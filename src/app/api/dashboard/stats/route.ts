// src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server"
import { getAllProductPrices } from "@/lib/price-utils"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
	try {
		const currentMonth = new Date()
		currentMonth.setDate(1) // Primeiro dia do mês atual

		const lastMonth = new Date(currentMonth)
		lastMonth.setMonth(lastMonth.getMonth() - 1)

		// Período de 12 meses atrás para o novo gráfico
		const twelveMonthsAgo = new Date()
		twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

		const [
			totalPurchases,
			totalSpent,
			totalDiscounts,
			totalProducts,
			totalMarkets,
			recentPurchases,
			topProducts,
			marketComparison,
			categoryStats,
			currentMonthStats,
			lastMonthStats,
			monthlySpending,
			priceRecordsStats,
			combinedPriceStats,
			discountStats,
		] = await Promise.all([
			prisma.purchase.count(),

			prisma.purchase.aggregate({
				_sum: { totalAmount: true },
			}),

			prisma.purchase.aggregate({
				_sum: { totalDiscount: true },
			}),

			prisma.product.count(),

			prisma.market.count(),

			prisma.purchase.findMany({
				include: {
					market: true,
					items: {
						include: {
							product: true,
						},
					},
				},
				orderBy: { purchaseDate: "desc" },
				take: 10,
			}),

			prisma.purchaseItem.groupBy({
				by: ["productId"],
				where: { productId: { not: null } }, // Garante que não pegamos itens sem produto
				_count: {
					productId: true,
				},
				_sum: {
					quantity: true,
				},
				_avg: {
					unitPrice: true,
				},
				orderBy: {
					_count: {
						productId: "desc",
					},
				},
				take: 10,
			}),

			prisma.purchase.groupBy({
				by: ["marketId"],
				_count: {
					id: true,
				},
				_avg: {
					totalAmount: true,
				},
				orderBy: {
					_avg: {
						totalAmount: "asc",
					},
				},
			}),

			prisma.$queryRaw`
        SELECT 
          c.name as "categoryName",
          c.id as "categoryId",
          c.icon as "icon",
          c.color as "color",
          SUM(pi.quantity * pi."unitPrice") as "totalSpent",
          COUNT(DISTINCT pi."purchaseId") as "totalPurchases",
          SUM(pi.quantity) as "totalQuantity",
          AVG(pi."unitPrice") as "averagePrice"
        FROM "purchase_items" pi
        LEFT JOIN "products" p ON pi."productId" = p.id
        LEFT JOIN "categories" c ON p."categoryId" = c.id
        WHERE c.name IS NOT NULL
        GROUP BY c.id, c.name, c.icon, c.color
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `,

			prisma.purchase.aggregate({
				where: {
					purchaseDate: { gte: currentMonth },
				},
				_count: { id: true },
				_sum: { totalAmount: true },
			}),

			prisma.purchase.aggregate({
				where: {
					purchaseDate: {
						gte: lastMonth,
						lt: currentMonth,
					},
				},
				_count: { id: true },
				_sum: { totalAmount: true },
			}),

			prisma.$queryRaw`
        SELECT 
          TO_CHAR(date_trunc('month', "purchaseDate"), 'YYYY-MM') as month,
          SUM("totalAmount") as "totalSpent"
        FROM "purchases"
        WHERE "purchaseDate" >= ${twelveMonthsAgo}
        GROUP BY month
        ORDER BY month ASC
      `,

			// Estatísticas dos registros de preços
			prisma.priceRecord.aggregate({
				_count: { id: true },
				_avg: { price: true },
				_min: { price: true },
				_max: { price: true },
			}),

			// Estatísticas combinadas de preços (produtos com dados tanto de compra quanto registro)
			(async () => {
				const productsWithBothSources = await prisma.product.findMany({
					where: {
						AND: [{ purchaseItems: { some: {} } }, { priceRecords: { some: {} } }],
					},
					select: { id: true, name: true },
				})

				return {
					productsWithBothSources: productsWithBothSources.length,
					productNames: productsWithBothSources.slice(0, 5).map((p) => p.name),
				}
			})(),

			// Estatísticas de descontos
			(async () => {
				const [
					totalDiscounts,
					purchasesWithDiscounts,
					averageDiscount,
					monthlyDiscounts,
					topDiscountMarkets,
				] = await Promise.all([
					prisma.purchase.aggregate({
						_sum: { totalDiscount: true },
						_count: { id: true },
					}),
					prisma.purchase.count({
						where: {
							totalDiscount: { gt: 0 },
						},
					}),
					prisma.purchase.aggregate({
						where: {
							totalDiscount: { gt: 0 },
						},
						_avg: { totalDiscount: true },
					}),
					prisma.$queryRaw`
						SELECT 
							TO_CHAR(date_trunc('month', "purchaseDate"), 'YYYY-MM') as month,
							SUM("totalDiscount") as "totalDiscounts"
						FROM "purchases"
						WHERE "totalDiscount" > 0 AND "purchaseDate" >= ${twelveMonthsAgo}
						GROUP BY month
						ORDER BY month ASC
					`,
					prisma.purchase.groupBy({
						by: ["marketId"],
						where: {
							totalDiscount: { gt: 0 },
						},
						_sum: { totalDiscount: true },
						_count: { id: true },
						orderBy: {
							_sum: { totalDiscount: "desc" },
						},
						take: 5,
					}),
				])

				return {
					totalDiscounts: totalDiscounts._sum.totalDiscount || 0,
					totalPurchases: totalDiscounts._count.id || 0,
					purchasesWithDiscounts,
					averageDiscount: averageDiscount._avg.totalDiscount || 0,
					discountPercentage: totalDiscounts._count.id > 0 ? (purchasesWithDiscounts / totalDiscounts._count.id) * 100 : 0,
					monthlyDiscounts: (monthlyDiscounts as any[]).map((data) => ({
						...data,
						totalDiscounts: parseFloat(data.totalDiscounts),
					})),
					topDiscountMarkets: topDiscountMarkets.map((market) => ({
						marketId: market.marketId,
						totalDiscounts: market._sum.totalDiscount || 0,
						purchasesWithDiscounts: market._count.id,
					})),
				}
			})(),
		])

		// OTIMIZAÇÃO: Coletar todos os IDs de produtos e mercados
		const productIds = topProducts.map((item) => item.productId).filter((id): id is string => id !== null)
		const marketIds = marketComparison.map((item) => item.marketId)

		// OTIMIZAÇÃO: Fazer duas consultas únicas para buscar todos os detalhes de uma vez
		const [productsInfo, marketsInfo] = await Promise.all([
			prisma.product.findMany({
				where: { id: { in: productIds } },
				include: {
					brand: true,
					category: true,
				},
			}),
			prisma.market.findMany({
				where: { id: { in: marketIds } },
			}),
		])

		// OTIMIZAÇÃO: Mapear os resultados em memória, sem novas consultas ao banco
		const topProductsWithNames = topProducts.map((item) => {
			const product = productsInfo.find((p) => p.id === item.productId)
			return {
				productId: item.productId,
				productName: product?.name || "Produto não encontrado",
				unit: product?.unit || "unidade",
				totalPurchases: item._count.productId,
				totalQuantity: item._sum.quantity || 0,
				averagePrice: item._avg.unitPrice || 0,
			}
		})

		const marketComparisonWithNames = marketComparison.map((item) => {
			const market = marketsInfo.find((m) => m.id === item.marketId)
			return {
				marketId: item.marketId,
				marketName: market?.name || "Mercado não encontrado",
				totalPurchases: item._count.id,
				averagePrice: item._avg.totalAmount || 0,
			}
		})

		// Calcular comparação mensal
		const currentMonthTotal = currentMonthStats?._sum?.totalAmount || 0
		const lastMonthTotal = lastMonthStats?._sum?.totalAmount || 0
		const currentMonthPurchases = currentMonthStats?._count?.id || 0
		const lastMonthPurchases = lastMonthStats?._count?.id || 0

		const monthlyComparison = {
			currentMonth: {
				totalSpent: currentMonthTotal,
				totalPurchases: currentMonthPurchases,
				averagePerPurchase: currentMonthPurchases > 0 ? currentMonthTotal / currentMonthPurchases : 0,
			},
			lastMonth: {
				totalSpent: lastMonthTotal,
				totalPurchases: lastMonthPurchases,
				averagePerPurchase: lastMonthPurchases > 0 ? lastMonthTotal / lastMonthPurchases : 0,
			},
			spentChange: lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
			purchasesChange:
				lastMonthPurchases > 0 ? ((currentMonthPurchases - lastMonthPurchases) / lastMonthPurchases) * 100 : 0,
		}

		// Processar estatísticas por categoria
		const categoryStatsProcessed = (categoryStats as any[]).map((cat: any) => ({
			categoryId: cat.categoryId,
			categoryName: cat.categoryName,
			icon: cat.icon,
			color: cat.color,
			totalSpent: parseFloat(cat.totalSpent || "0"),
			totalPurchases: parseInt(cat.totalPurchases || "0"),
			totalQuantity: parseFloat(cat.totalQuantity || "0"),
			averagePrice: parseFloat(cat.averagePrice || "0"),
		}))

		// Processar dados do novo gráfico
		const monthlySpendingProcessed = (monthlySpending as any[]).map((data) => ({
			...data,
			totalSpent: parseFloat(data.totalSpent),
		}))

		// Buscar nomes dos mercados com mais descontos
		const topDiscountMarketIds = discountStats.topDiscountMarkets.map((m) => m.marketId)
		const topDiscountMarketsInfo = await prisma.market.findMany({
			where: { id: { in: topDiscountMarketIds } },
		})

		const topDiscountMarketsWithNames = discountStats.topDiscountMarkets.map((market) => {
			const marketInfo = topDiscountMarketsInfo.find((m) => m.id === market.marketId)
			return {
				...market,
				marketName: marketInfo?.name || "Mercado não encontrado",
			}
		})

		const stats = {
			totalPurchases,
			totalSpent: totalSpent._sum.totalAmount || 0,
			totalDiscounts: totalDiscounts._sum.totalDiscount || 0,
			totalProducts,
			totalMarkets,
			recentPurchases,
			topProducts: topProductsWithNames.filter((p) => p.productId), // Filtrar produtos nulos
			marketComparison: marketComparisonWithNames,
			monthlyComparison,
			categoryStats: categoryStatsProcessed,
			monthlySpending: monthlySpendingProcessed,
			priceRecords: {
				totalRecords: priceRecordsStats._count.id,
				averagePrice: priceRecordsStats._avg.price || 0,
				minPrice: priceRecordsStats._min.price || 0,
				maxPrice: priceRecordsStats._max.price || 0,
			},
			combinedPriceData: {
				productsWithBothSources: combinedPriceStats.productsWithBothSources,
				sampleProducts: combinedPriceStats.productNames,
				dataIntegrationLevel:
					totalProducts > 0 ? (combinedPriceStats.productsWithBothSources / totalProducts) * 100 : 0,
			},
			discountStats: {
				...discountStats,
				topDiscountMarkets: topDiscountMarketsWithNames,
			},
		}

		return NextResponse.json(stats)
	} catch (error) {
		console.error("Dashboard stats error:", error)
		return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
	}
}
