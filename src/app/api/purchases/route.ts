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
		const page = parseInt(searchParams.get("page") || "1", 10)
		const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "12", 10)

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
		const { marketId, items, purchaseDate, paymentMethod, totalDiscount = 0 } = body

		if (!marketId || !items || items.length === 0) {
			return NextResponse.json({ error: "Mercado e itens são obrigatórios" }, { status: 400 })
		}

		// Validar que todos os itens tem nome do produto
		const invalidItems = items.filter((item: any) => !item.productName || !item.productName.trim())
		if (invalidItems.length > 0) {
			return NextResponse.json({ error: "Todos os itens precisam ter um nome de produto" }, { status: 400 })
		}

		const totalAmount = items.reduce((sum: number, item: any) => {
			const itemTotal = item.quantity * item.unitPrice
			const itemDiscount = item.quantity * (item.unitDiscount || 0)
			return sum + itemTotal - itemDiscount
		}, 0)
		const finalAmount = totalAmount - totalDiscount

		// Buscar produtos vinculados
		const productIds = items.map((item: any) => item.productId).filter(Boolean)
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
			include: {
				brand: true,
				category: true,
			},
		})

		const purchase = await prisma.$transaction(
			async (tx) => {
				// Criar a compra diretamente com os itens
				const newPurchase = await tx.purchase.create({
					data: {
						marketId,
						totalAmount,
						totalDiscount,
						finalAmount,
						purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
						paymentMethod: normalizePaymentMethod(paymentMethod || "MONEY"),
						items: {
							create: items.map((item: any) => {
								const product = products.find((p) => p.id === item.productId)
								const itemTotal = item.quantity * item.unitPrice
								const itemDiscount = item.quantity * (item.unitDiscount || 0)
								return {
									productId: item.productId || null,
									quantity: item.quantity,
									unitPrice: item.unitPrice,
									unitDiscount: item.unitDiscount || 0,
									totalPrice: itemTotal,
									totalDiscount: itemDiscount,
									finalPrice: itemTotal - itemDiscount,
									// Se tem produto vinculado, usa dados do produto. Senão, usa o que foi digitado
									productName: product?.name || item.productName,
									productUnit: product?.unit || item.productUnit || "unidade",
									productCategory: product?.category?.name || item.category || null,
									brandName: product?.brand?.name || item.brand || null,
								}
							}),
						},
					},
					include: {
						items: true,
						market: true,
					},
				})

				// Criar entradas de estoque apenas para itens vinculados a produtos que tem controle de estoque
				const stockCreationPromises = items
					.filter((item: any) => {
						if (!item.productId || !item.addToStock) return false
						const product = products.find((p) => p.id === item.productId)
						return product?.hasStock
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
			},
			{
				maxWait: 10000, // 10 segundos de espera máxima
				timeout: 15000, // 15 segundos de timeout
			},
		)

		return NextResponse.json(purchase, { status: 201 })
	} catch (error) {
		console.error("Erro ao criar compra:", error)
		return NextResponse.json({ error: "Erro ao criar compra" }, { status: 500 })
	}
}
