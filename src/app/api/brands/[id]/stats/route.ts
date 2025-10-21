import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const brandId = params.id

		// Buscar a marca primeiro para validar
		const brand = await prisma.brand.findUnique({
			where: { id: brandId },
		})

		if (!brand) {
			return NextResponse.json({ error: "Marca não encontrada" }, { status: 404 })
		}

		// Buscar produtos da marca
		const products = await prisma.product.findMany({
			where: { brandId },
			select: { id: true },
		})

		const productIds = products.map((p) => p.id)

		if (productIds.length === 0) {
			return NextResponse.json({
				totalPurchases: 0,
				totalSpent: 0,
				totalQuantity: 0,
				avgPrice: 0,
				topProducts: [],
				marketComparison: [],
				monthlyTrend: [],
			})
		}

		// Buscar itens de compra dos produtos desta marca
		const purchaseItems = await prisma.purchaseItem.findMany({
			where: {
				productId: { in: productIds },
			},
			include: {
				purchase: {
					include: {
						market: true,
					},
				},
				product: true,
			},
		})

		// Calcular estatísticas gerais
		const totalPurchases = new Set(purchaseItems.map((item) => item.purchaseId)).size
		const totalSpent = purchaseItems.reduce((sum, item) => sum + (item.finalPrice || item.totalPrice), 0)
		const totalQuantity = purchaseItems.reduce((sum, item) => sum + item.quantity, 0)
		const avgPrice = totalPurchases > 0 ? totalSpent / totalPurchases : 0

		// Produtos mais comprados desta marca
		const productStats = purchaseItems.reduce(
			(acc, item) => {
				if (!item.productId) return acc

				if (!acc[item.productId]) {
					acc[item.productId] = {
						productId: item.productId,
						productName: item.product?.name || item.productName || "Produto sem nome",
						totalQuantity: 0,
						totalSpent: 0,
						purchaseCount: 0,
						unit: item.product?.unit || item.productUnit || "un",
					}
				}

				acc[item.productId].totalQuantity += item.quantity
				acc[item.productId].totalSpent += item.finalPrice || item.totalPrice
				acc[item.productId].purchaseCount += 1

				return acc
			},
			{} as Record<
				string,
				{
					productId: string
					productName: string
					totalQuantity: number
					totalSpent: number
					purchaseCount: number
					unit: string
				}
			>,
		)

		const topProducts = Object.values(productStats)
			.map((stat) => ({
				...stat,
				avgPrice: stat.totalSpent / stat.purchaseCount,
			}))
			.sort((a, b) => b.totalQuantity - a.totalQuantity)

		// Comparação de mercados
		const marketStats = purchaseItems.reduce(
			(acc, item) => {
				const marketId = item.purchase.marketId
				const marketName = item.purchase.market?.name || "Mercado desconhecido"

				if (!acc[marketId]) {
					acc[marketId] = {
						marketId,
						marketName,
						totalSpent: 0,
						purchaseCount: 0,
						purchases: new Set<string>(),
					}
				}

				acc[marketId].totalSpent += item.finalPrice || item.totalPrice
				acc[marketId].purchases.add(item.purchaseId)

				return acc
			},
			{} as Record<
				string,
				{
					marketId: string
					marketName: string
					totalSpent: number
					purchaseCount: number
					purchases: Set<string>
				}
			>,
		)

		const marketComparison = Object.values(marketStats)
			.map((stat) => ({
				marketId: stat.marketId,
				marketName: stat.marketName,
				totalSpent: stat.totalSpent,
				purchaseCount: stat.purchases.size,
				avgPrice: stat.totalSpent / stat.purchases.size,
			}))
			.sort((a, b) => a.avgPrice - b.avgPrice)

		// Tendência mensal (últimos 6 meses)
		const now = new Date()
		const monthlyData: Record<string, { spent: number; purchases: Set<string> }> = {}

		for (let i = 5; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
			const monthKey = date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })
			monthlyData[monthKey] = { spent: 0, purchases: new Set() }
		}

		purchaseItems.forEach((item) => {
			const purchaseDate = new Date(item.purchase.purchaseDate)
			const monthKey = purchaseDate.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })

			if (monthlyData[monthKey]) {
				monthlyData[monthKey].spent += item.finalPrice || item.totalPrice
				monthlyData[monthKey].purchases.add(item.purchaseId)
			}
		})

		const monthlyTrend = Object.entries(monthlyData).map(([month, data]) => ({
			month,
			spent: data.spent,
			purchases: data.purchases.size,
		}))

		return NextResponse.json({
			totalPurchases,
			totalSpent,
			totalQuantity,
			avgPrice,
			topProducts,
			marketComparison,
			monthlyTrend,
		})
	} catch (error) {
		console.error("Erro ao buscar estatísticas da marca:", error)
		return NextResponse.json({ error: "Erro ao buscar estatísticas da marca" }, { status: 500 })
	}
}
