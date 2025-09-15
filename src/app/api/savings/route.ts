import { NextResponse } from "next/server"
import { getAllProductPrices } from "@/lib/price-utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
	try {
		// Buscar produtos mais comprados nos últimos 3 meses
		const threeMonthsAgo = new Date()
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

		const topProducts = await prisma.purchaseItem.groupBy({
			by: ["productId"],
			where: {
				purchase: {
					purchaseDate: { gte: threeMonthsAgo },
				},
				productId: { not: null },
			},
			_count: { productId: true },
			_avg: { unitPrice: true },
			orderBy: { _count: { productId: "desc" } },
			take: 10,
		})

		// Para cada produto, buscar preços em diferentes mercados
		const savingsAnalysis = await Promise.all(
			topProducts.map(async (item) => {
				if (!item.productId) return null

				// Buscar produto info
				const product = await prisma.product.findUnique({
					where: { id: item.productId },
					include: {
						brand: true,
						category: true,
					},
				})

				if (!product) return null

				// Buscar preços combinados (compras + registros) nos últimos 3 meses
				const [purchases, priceRecords] = await Promise.all([
					prisma.purchaseItem.findMany({
						where: {
							productId: item.productId,
							purchase: {
								purchaseDate: { gte: threeMonthsAgo },
							},
						},
						include: {
							purchase: {
								include: { market: true },
							},
						},
					}),
					prisma.priceRecord.findMany({
						where: {
							productId: item.productId,
							recordDate: { gte: threeMonthsAgo },
						},
						include: {
							market: true,
						},
					}),
				])

				// Agrupar todos os preços por mercado
				const marketGroups: any = {}

				// Adicionar compras
				purchases.forEach((purchase) => {
					const marketId = purchase.purchase.marketId
					if (!marketGroups[marketId]) {
						marketGroups[marketId] = {
							market: purchase.purchase.market,
							prices: [],
							purchaseCount: 0,
							recordCount: 0,
						}
					}
					marketGroups[marketId].prices.push(purchase.unitPrice)
					marketGroups[marketId].purchaseCount++
				})

				// Adicionar registros de preço
				priceRecords.forEach((record) => {
					const marketId = record.marketId
					if (!marketGroups[marketId]) {
						marketGroups[marketId] = {
							market: record.market,
							prices: [],
							purchaseCount: 0,
							recordCount: 0,
						}
					}
					marketGroups[marketId].prices.push(record.price)
					marketGroups[marketId].recordCount++
				})

				const marketDetails = Object.values(marketGroups).map((group: any) => ({
					market: group.market,
					avgPrice: group.prices.reduce((sum: number, price: number) => sum + price, 0) / group.prices.length,
					minPrice: Math.min(...group.prices),
					maxPrice: Math.max(...group.prices),
					purchaseCount: group.purchaseCount,
					recordCount: group.recordCount,
					totalDataPoints: group.prices.length,
				}))

				const flatMarketDetails = marketDetails

				if (flatMarketDetails.length < 2) return null

				// Encontrar melhor e pior mercado
				const sortedByPrice = flatMarketDetails.sort((a, b) => a.avgPrice - b.avgPrice)
				const cheapest = sortedByPrice[0]
				const mostExpensive = sortedByPrice[sortedByPrice.length - 1]

				const potentialSaving = mostExpensive.avgPrice - cheapest.avgPrice

				return {
					product,
					purchaseFrequency: item._count.productId,
					avgPrice: item._avg.unitPrice || 0,
					cheapestMarket: cheapest,
					mostExpensiveMarket: mostExpensive,
					potentialSaving,
					potentialSavingPercent: (potentialSaving / mostExpensive.avgPrice) * 100,
					marketOptions: sortedByPrice,
				}
			}),
		)

		const validSavings = savingsAnalysis.filter((item) => item !== null && item.potentialSaving > 0.5)

		// Calcular economia total mensal estimada
		const totalMonthlySavings = validSavings.reduce((total, item) => {
			if (!item) return total
			const monthlyFreq = item.purchaseFrequency / 3 // últimos 3 meses
			return total + item.potentialSaving * monthlyFreq
		}, 0)

		return NextResponse.json({
			topSavingsOpportunities: validSavings.slice(0, 5),
			totalMonthlySavings,
			analyzedProducts: validSavings.length,
			totalProducts: topProducts.length,
		})
	} catch (error) {
		console.error("Erro ao calcular economia:", error)
		return NextResponse.json({ error: "Erro ao calcular economia sugerida" }, { status: 500 })
	}
}
