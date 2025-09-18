import { addDays } from "date-fns"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const marketId = searchParams.get("marketId")
		const searchTerm = searchParams.get("search") || ""
		const sort = searchParams.get("sort") || "date-desc"
		const dateFrom = searchParams.get("dateFrom")
		const dateTo = searchParams.get("dateTo")
		const page = parseInt(searchParams.get("page") || "1")
		const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "12")

		const where: any = {}
		if (marketId && marketId !== "all") {
			where.marketId = marketId
		}

		if (dateFrom || dateTo) {
			where.purchaseDate = {}
			if (dateFrom) {
				where.purchaseDate.gte = new Date(`${dateFrom}T00:00:00.000Z`)
			}
			if (dateTo) {
				const endDate = new Date(`${dateTo}T00:00:00.000Z`)
				where.purchaseDate.lt = addDays(endDate, 1)
			}
		}

		if (searchTerm) {
			where.items = {
				some: {
					OR: [
						{ productName: { contains: searchTerm, mode: "insensitive" } },
						{
							product: { name: { contains: searchTerm, mode: "insensitive" } },
						},
					],
				},
			}
		}

		const orderBy: any = {}
		switch (sort) {
			case "date-asc":
				orderBy.purchaseDate = "asc"
				break
			case "date-desc":
				orderBy.purchaseDate = "desc"
				break
			case "value-asc":
				orderBy.totalAmount = "asc"
				break
			case "value-desc":
				orderBy.totalAmount = "desc"
				break
			default:
				orderBy.purchaseDate = "desc"
				break
		}

		const [purchases, totalCount] = await prisma.$transaction([
			prisma.purchase.findMany({
				where,
				include: {
					market: true,
					items: {
						include: {
							product: {
								include: {
									brand: true,
								},
							},
						},
					},
				},
				orderBy,
				skip: (page - 1) * itemsPerPage,
				take: itemsPerPage,
			}),
			prisma.purchase.count({ where }),
		])

		return NextResponse.json({ purchases, totalCount })
	} catch (error) {
		console.error("Erro ao buscar compras:", error)
		return NextResponse.json({ error: "Erro ao buscar compras" }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { marketId, items, purchaseDate, paymentMethod, convertTemporaryItems } = body

		if (!marketId || !items || items.length === 0) {
			return NextResponse.json({ error: "Mercado e itens são obrigatórios" }, { status: 400 })
		}

		const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0)

		// Separar itens temporários dos permanentes
		const permanentItems = items.filter((item: any) => !item.isTemporary)
		const temporaryItems = items.filter((item: any) => item.isTemporary)

		const productIds = permanentItems.map((item: any) => item.productId).filter(Boolean)
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
		})

		const purchase = await prisma.$transaction(async (tx) => {
			// Converter itens temporários em produtos se solicitado
			const convertedProducts: any[] = []
			let allItemsData = [...items]

			if (convertTemporaryItems && temporaryItems.length > 0) {
				for (const tempItem of temporaryItems) {
					if (tempItem.shouldConvert) {
						// Verificar se a categoria existe ou criar uma nova
						let categoryId = tempItem.categoryId
						if (!categoryId && tempItem.tempCategory) {
							const category = await tx.category.findFirst({
								where: { name: { equals: tempItem.tempCategory, mode: "insensitive" } }
							})

							if (category) {
								categoryId = category.id
							} else {
								const newCategory = await tx.category.create({
									data: {
										name: tempItem.tempCategory,
										icon: "📦",
										color: "#64748b",
										isFood: true,
									}
								})
								categoryId = newCategory.id
							}
						}

						// Verificar se a marca existe ou criar uma nova
						let brandId = tempItem.brandId
						if (!brandId && tempItem.tempBrand) {
							const brand = await tx.brand.findFirst({
								where: { name: { equals: tempItem.tempBrand, mode: "insensitive" } }
							})

							if (brand) {
								brandId = brand.id
							} else {
								const newBrand = await tx.brand.create({
									data: {
										name: tempItem.tempBrand,
									}
								})
								brandId = newBrand.id
							}
						}

						// Criar o produto permanente
						const newProduct = await tx.product.create({
							data: {
								name: tempItem.productName,
								barcode: tempItem.tempBarcode,
								categoryId: categoryId,
								brandId: brandId,
								unit: tempItem.productUnit || "un",
								hasStock: tempItem.hasStock || false,
								minStock: tempItem.minStock || 0,
								maxStock: tempItem.maxStock || 0,
								hasExpiration: tempItem.hasExpiration || false,
								defaultShelfLifeDays: tempItem.defaultShelfLifeDays || 30,
							}
						})

						convertedProducts.push(newProduct)

						// Atualizar o item para referenciar o produto criado
						const updatedItemIndex = allItemsData.findIndex(item => item.tempId === tempItem.tempId)
						if (updatedItemIndex !== -1) {
							allItemsData[updatedItemIndex] = {
								...tempItem,
								productId: newProduct.id,
								isTemporary: false,
							}
						}
					}
				}
			}

			const newPurchase = await tx.purchase.create({
				data: {
					marketId,
					totalAmount,
					purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
					paymentMethod: paymentMethod || "MONEY",
					items: {
						create: allItemsData.map((item: any) => {
							const product = products.find((p) => p.id === item.productId) || 
											convertedProducts.find((p) => p.id === item.productId)
							return {
								productId: item.isTemporary ? null : item.productId,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
								totalPrice: item.quantity * item.unitPrice,
								productName: item.productName || product?.name,
								productUnit: item.productUnit || product?.unit,
								productCategory: item.tempCategory || product?.category?.name,
								brandName: item.tempBrand || product?.brand?.name,
							}
						}),
					},
				},
				include: { items: true },
			})

			for (const item of items) {
				const product = products.find((p) => p.id === item.productId)
				if (item.addToStock && product && product.hasStock) {
					const entriesToCreate =
						item.stockEntries && item.stockEntries.length > 0
							? item.stockEntries
							: [
									{
										quantity: item.quantity,
										location: "Despensa",
										expirationDate: item.expirationDate,
									},
								]

					for (const entry of entriesToCreate) {
						const stockItem = await tx.stockItem.create({
							data: {
								productId: item.productId,
								quantity: entry.quantity || 1, // Cada entrada é uma unidade
								unitCost: item.unitPrice,
								location: entry.location || "Despensa",
								expirationDate: entry.expirationDate ? new Date(entry.expirationDate) : null,
								notes: entry.notes || `Compra #${newPurchase.id.substring(0, 8)}`,
								isLowStock: product.hasStock && product.minStock ? (entry.quantity || 1) <= product.minStock : false,
							},
						})

						await tx.stockMovement.create({
							data: {
								stockItemId: stockItem.id,
								purchaseItemId: newPurchase.items.find((pi) => pi.productId === item.productId)?.id,
								type: "ENTRADA",
								quantity: entry.quantity || 1,
								reason: "Registro de compra",
							},
						})
					}
				}
			}

			return tx.purchase.findUnique({
				where: { id: newPurchase.id },
				include: { market: true, items: { include: { product: true } } },
			})
		})

		return NextResponse.json(purchase, { status: 201 })
	} catch (error) {
		console.error("Erro ao criar compra:", error)
		return NextResponse.json({ error: "Erro ao criar compra" }, { status: 500 })
	}
}
