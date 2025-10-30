// src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server"
import { getAllProductPrices } from "@/lib/price-utils"
import { prisma } from "@/lib/prisma"

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
				// Calcular descontos totais incluindo descontos de compra E descontos de itens
				const [
					purchaseDiscounts,
					itemDiscounts,
					totalPurchasesCount,
					monthlyDiscounts,
					topDiscountMarkets,
				] = await Promise.all([
					// Descontos ao nível da compra
					prisma.purchase.aggregate({
						_sum: { totalDiscount: true },
					}),
					// Descontos ao nível dos itens
					prisma.purchaseItem.aggregate({
						_sum: { totalDiscount: true },
					}),
					// Total de compras
					prisma.purchase.count(),
					// Descontos mensais (compra + itens)
					prisma.$queryRaw`
						SELECT 
							TO_CHAR(date_trunc('month', p."purchaseDate"), 'YYYY-MM') as month,
							COALESCE(SUM(p."totalDiscount"), 0) + COALESCE(SUM(pi."totalDiscount"), 0) as "totalDiscounts"
						FROM "purchases" p
						LEFT JOIN "purchase_items" pi ON p.id = pi."purchaseId"
						WHERE p."purchaseDate" >= ${twelveMonthsAgo}
						GROUP BY month
						HAVING COALESCE(SUM(p."totalDiscount"), 0) + COALESCE(SUM(pi."totalDiscount"), 0) > 0
						ORDER BY month ASC
					`,
					// Top mercados com descontos
					prisma.$queryRaw`
						SELECT 
							p."marketId" as "marketId",
							COALESCE(SUM(p."totalDiscount"), 0) + COALESCE(SUM(pi."totalDiscount"), 0) as "totalDiscounts",
							COUNT(DISTINCT p.id) as "purchasesWithDiscounts"
						FROM "purchases" p
						LEFT JOIN "purchase_items" pi ON p.id = pi."purchaseId"
						GROUP BY p."marketId"
						HAVING COALESCE(SUM(p."totalDiscount"), 0) + COALESCE(SUM(pi."totalDiscount"), 0) > 0
						ORDER BY "totalDiscounts" DESC
						LIMIT 5
					`,
				])

				// Calcular total de descontos (compra + itens)
				const totalDiscountsValue = (purchaseDiscounts._sum.totalDiscount || 0) + (itemDiscounts._sum.totalDiscount || 0)

				// Contar compras com desconto (qualquer tipo)
				const purchasesWithDiscountsCount = await prisma.purchase.count({
					where: {
						OR: [
							{ totalDiscount: { gt: 0 } },
							{ items: { some: { totalDiscount: { gt: 0 } } } }
						]
					}
				})

				// Calcular média de desconto por compra com desconto
				const averageDiscountValue = purchasesWithDiscountsCount > 0
					? totalDiscountsValue / purchasesWithDiscountsCount
					: 0

				return {
					totalDiscounts: totalDiscountsValue,
					totalPurchases: totalPurchasesCount,
					purchasesWithDiscounts: purchasesWithDiscountsCount,
					averageDiscount: averageDiscountValue,
					discountPercentage: totalPurchasesCount > 0 ? (purchasesWithDiscountsCount / totalPurchasesCount) * 100 : 0,
					monthlyDiscounts: (monthlyDiscounts as any[]).map((data) => ({
						month: data.month,
						totalDiscounts: parseFloat(data.totalDiscounts || '0'),
					})),
					topDiscountMarkets: (topDiscountMarkets as any[]).map((market) => ({
						marketId: market.marketId,
						totalDiscounts: parseFloat(market.totalDiscounts || '0'),
						purchasesWithDiscounts: parseInt(market.purchasesWithDiscounts || '0'),
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

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
	} catch (error) {
		console.error("Dashboard stats error:", error)
		return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
	}
}
