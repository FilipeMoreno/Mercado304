import { addDays } from "date-fns"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Função para normalizar o método de pagamento
function normalizePaymentMethod(method: string): any {
	const normalizedMethod = method?.toUpperCase().replace(/[-_]/g, "")

	// Mapeamento de valores comuns para os valores do enum
	const mapping: Record<string, string> = {
		CREDITCARD: "CREDIT",
		CREDIT: "CREDIT",
		DEBITCARD: "DEBIT",
		DEBIT: "DEBIT",
		MONEY: "MONEY",
		CASH: "MONEY",
		DINHEIRO: "MONEY",
		PIX: "PIX",
		VOUCHER: "VOUCHER",
		VALE: "VOUCHER",
		CHECK: "CHECK",
		CHEQUE: "CHECK",
		OTHER: "OTHER",
		OUTRO: "OTHER",
		OUTROS: "OTHER",
	}

	return mapping[normalizedMethod] || "MONEY"
}

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
		const { marketId, items, purchaseDate, paymentMethod, totalDiscount = 0, convertTemporaryItems } = body

		if (!marketId || !items || items.length === 0) {
			return NextResponse.json({ error: "Mercado e itens são obrigatórios" }, { status: 400 })
		}

		const totalAmount = items.reduce((sum: number, item: any) => {
			const itemTotal = item.quantity * item.unitPrice
			const itemDiscount = item.quantity * (item.unitDiscount || 0)
			return sum + itemTotal - itemDiscount
		}, 0)
		const finalAmount = totalAmount - totalDiscount

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
			const allItemsData = [...items]

			if (convertTemporaryItems && temporaryItems.length > 0) {
				// Coletar todas as categorias e marcas únicas primeiro
				const uniqueCategories = Array.from(new Set(temporaryItems.filter((i: any) => i.shouldConvert && i.tempCategory).map((i: any) => i.tempCategory as string))) as string[]
				const uniqueBrands = Array.from(new Set(temporaryItems.filter((i: any) => i.shouldConvert && i.tempBrand).map((i: any) => i.tempBrand as string))) as string[]

				// Buscar categorias e marcas existentes em paralelo
				const [existingCategories, existingBrands] = await Promise.all([
					uniqueCategories.length > 0
						? tx.category.findMany({ where: { name: { in: uniqueCategories, mode: "insensitive" } } })
						: Promise.resolve([]),
					uniqueBrands.length > 0
						? tx.brand.findMany({ where: { name: { in: uniqueBrands, mode: "insensitive" } } })
						: Promise.resolve([])
				])

				// Criar categorias e marcas faltantes em paralelo
				const categoriesToCreate = uniqueCategories.filter(
					(cat: string) => !existingCategories.find(ec => ec.name.toLowerCase() === cat.toLowerCase())
				)
				const brandsToCreate = uniqueBrands.filter(
					(brand: string) => !existingBrands.find(eb => eb.name.toLowerCase() === brand.toLowerCase())
				)

				const [newCategories, newBrands] = await Promise.all([
					categoriesToCreate.length > 0
						? Promise.all(categoriesToCreate.map((name: string) =>
							tx.category.create({
								data: { name, icon: "📦", color: "#64748b", isFood: true }
							})
						))
						: Promise.resolve([]),
					brandsToCreate.length > 0
						? Promise.all(brandsToCreate.map((name: string) =>
							tx.brand.create({ data: { name } })
						))
						: Promise.resolve([])
				])

				const allCategories = [...existingCategories, ...newCategories]
				const allBrands = [...existingBrands, ...newBrands]

				// Criar todos os produtos em paralelo
				const productCreationPromises = temporaryItems
					.filter((tempItem: any) => tempItem.shouldConvert)
					.map(async (tempItem: any) => {
						const categoryId = tempItem.categoryId || allCategories.find(
							c => c.name.toLowerCase() === tempItem.tempCategory?.toLowerCase()
						)?.id
						const brandId = tempItem.brandId || allBrands.find(
							b => b.name.toLowerCase() === tempItem.tempBrand?.toLowerCase()
						)?.id

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
							},
						})

						// Atualizar o item para referenciar o produto criado
						const updatedItemIndex = allItemsData.findIndex((item) => item.tempId === tempItem.tempId)
						if (updatedItemIndex !== -1) {
							allItemsData[updatedItemIndex] = {
								...tempItem,
								productId: newProduct.id,
								isTemporary: false,
							}
						}

						return newProduct
					})

				convertedProducts.push(...await Promise.all(productCreationPromises))
			}

			const newPurchase = await tx.purchase.create({
				data: {
					marketId,
					totalAmount,
					totalDiscount,
					finalAmount,
					purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
					paymentMethod: normalizePaymentMethod(paymentMethod || "MONEY"),
					items: {
						create: allItemsData.map((item: any) => {
							const product =
								products.find((p) => p.id === item.productId) || convertedProducts.find((p) => p.id === item.productId)
							const itemTotal = item.quantity * item.unitPrice
							const itemDiscount = item.quantity * (item.unitDiscount || 0)
							return {
								productId: item.isTemporary ? null : item.productId,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
								unitDiscount: item.unitDiscount || 0,
								totalPrice: itemTotal,
								totalDiscount: itemDiscount,
								finalPrice: itemTotal - itemDiscount,
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

			// Criar entradas de estoque em paralelo
			const stockCreationPromises = items
				.filter((item: any) => {
					const product = products.find((p) => p.id === item.productId)
					return item.addToStock && product && product.hasStock
				})
				.flatMap((item: any) => {
					const product = products.find((p) => p.id === item.productId)!
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

					return entriesToCreate.map(async (entry: any) => {
						const stockItem = await tx.stockItem.create({
							data: {
								productId: item.productId,
								quantity: entry.quantity || 1,
								unitCost: item.unitPrice,
								location: entry.location || "Despensa",
								expirationDate: entry.expirationDate ? new Date(entry.expirationDate) : null,
								notes: entry.notes || `Compra #${newPurchase.id.substring(0, 8)}`,
								isLowStock: product.hasStock && product.minStock ? (entry.quantity || 1) <= product.minStock : false,
							},
						})

						return tx.stockMovement.create({
							data: {
								stockItemId: stockItem.id,
								purchaseItemId: newPurchase.items.find((pi) => pi.productId === item.productId)?.id,
								type: "ENTRADA",
								quantity: entry.quantity || 1,
								reason: "Registro de compra",
							},
						})
					})
				})

			await Promise.all(stockCreationPromises)

			return tx.purchase.findUnique({
				where: { id: newPurchase.id },
				include: { market: true, items: { include: { product: true } } },
			})
		}, {
			maxWait: 10000, // 10 segundos de espera máxima
			timeout: 15000, // 15 segundos de timeout
		})

		return NextResponse.json(purchase, { status: 201 })
	} catch (error) {
		console.error("Erro ao criar compra:", error)
		return NextResponse.json({ error: "Erro ao criar compra" }, { status: 500 })
	}
}
