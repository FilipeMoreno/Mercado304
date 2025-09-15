import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
	try {
		const now = new Date()

		// Definir períodos
		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
		const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

		// Buscar dados do mês atual
		const [currentMonthPurchases, currentMonthSpent] = await Promise.all([
			prisma.purchase.count({
				where: {
					purchaseDate: {
						gte: currentMonthStart,
						lte: currentMonthEnd,
					},
				},
			}),
			prisma.purchase.aggregate({
				where: {
					purchaseDate: {
						gte: currentMonthStart,
						lte: currentMonthEnd,
					},
				},
				_sum: { totalAmount: true },
			}),
		])

		// Buscar dados do mês passado
		const [lastMonthPurchases, lastMonthSpent] = await Promise.all([
			prisma.purchase.count({
				where: {
					purchaseDate: {
						gte: lastMonthStart,
						lte: lastMonthEnd,
					},
				},
			}),
			prisma.purchase.aggregate({
				where: {
					purchaseDate: {
						gte: lastMonthStart,
						lte: lastMonthEnd,
					},
				},
				_sum: { totalAmount: true },
			}),
		])

		// Calcular mudanças percentuais
		const currentSpent = currentMonthSpent._sum.totalAmount || 0
		const lastSpent = lastMonthSpent._sum.totalAmount || 0

		const spentChange = lastSpent > 0 ? ((currentSpent - lastSpent) / lastSpent) * 100 : 0
		const purchasesChange =
			lastMonthPurchases > 0 ? ((currentMonthPurchases - lastMonthPurchases) / lastMonthPurchases) * 100 : 0

		const currentAvgTicket = currentMonthPurchases > 0 ? currentSpent / currentMonthPurchases : 0
		const lastAvgTicket = lastMonthPurchases > 0 ? lastSpent / lastMonthPurchases : 0
		const avgTicketChange = lastAvgTicket > 0 ? ((currentAvgTicket - lastAvgTicket) / lastAvgTicket) * 100 : 0

		// Buscar produtos mais comprados em cada mês
		const [currentTopProducts, lastTopProducts] = await Promise.all([
			prisma.purchaseItem.groupBy({
				by: ["productId"],
				where: {
					purchase: {
						purchaseDate: {
							gte: currentMonthStart,
							lte: currentMonthEnd,
						},
					},
					productId: { not: null },
				},
				_count: { productId: true },
				orderBy: { _count: { productId: "desc" } },
				take: 5,
			}),
			prisma.purchaseItem.groupBy({
				by: ["productId"],
				where: {
					purchase: {
						purchaseDate: {
							gte: lastMonthStart,
							lte: lastMonthEnd,
						},
					},
					productId: { not: null },
				},
				_count: { productId: true },
				orderBy: { _count: { productId: "desc" } },
				take: 5,
			}),
		])

		// Buscar nomes dos produtos
		const allProductIds = [
			...currentTopProducts.map((p) => p.productId),
			...lastTopProducts.map((p) => p.productId),
		].filter((id): id is string => id !== null)

		const productsInfo = await prisma.product.findMany({
			where: { id: { in: allProductIds } },
			include: {
				brand: true,
				category: true,
			},
		})

		const currentTopWithNames = currentTopProducts.map((item) => {
			const product = productsInfo.find((p) => p.id === item.productId)
			return {
				...item,
				product,
			}
		})

		const lastTopWithNames = lastTopProducts.map((item) => {
			const product = productsInfo.find((p) => p.id === item.productId)
			return {
				...item,
				product,
			}
		})

		// Buscar mercados mais utilizados
		const [currentTopMarkets, lastTopMarkets] = await Promise.all([
			prisma.purchase.groupBy({
				by: ["marketId"],
				where: {
					purchaseDate: {
						gte: currentMonthStart,
						lte: currentMonthEnd,
					},
				},
				_count: { marketId: true },
				_sum: { totalAmount: true },
				orderBy: { _count: { marketId: "desc" } },
				take: 3,
			}),
			prisma.purchase.groupBy({
				by: ["marketId"],
				where: {
					purchaseDate: {
						gte: lastMonthStart,
						lte: lastMonthEnd,
					},
				},
				_count: { marketId: true },
				_sum: { totalAmount: true },
				orderBy: { _count: { marketId: "desc" } },
				take: 3,
			}),
		])

		return NextResponse.json({
			currentMonth: {
				purchases: currentMonthPurchases,
				spent: Number(currentSpent),
				avgTicket: currentAvgTicket,
				topProducts: currentTopWithNames,
				topMarkets: currentTopMarkets,
			},
			lastMonth: {
				purchases: lastMonthPurchases,
				spent: Number(lastSpent),
				avgTicket: lastAvgTicket,
				topProducts: lastTopWithNames,
				topMarkets: lastTopMarkets,
			},
			changes: {
				spent: spentChange,
				purchases: purchasesChange,
				avgTicket: avgTicketChange,
			},
			insights: {
				spentMore: spentChange > 5,
				purchasedMore: purchasesChange > 10,
				higherTicket: avgTicketChange > 10,
			},
		})
	} catch (error) {
		console.error("Erro ao buscar comparação temporal:", error)
		return NextResponse.json({ error: "Erro ao buscar comparação temporal" }, { status: 500 })
	}
}
