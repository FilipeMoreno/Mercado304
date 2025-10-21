import { prisma } from "@/lib/prisma"

export const advancedAnalyticsFunctions = {
	analyzeSpendingByCategory: async ({
		startDate,
		endDate,
		categoryName,
	}: {
		startDate?: string
		endDate?: string
		categoryName?: string
	}) => {
		try {
			const dateFilter: any = {}
			if (startDate) dateFilter.gte = new Date(startDate)
			if (endDate) dateFilter.lte = new Date(endDate)

			const categoryFilter: any = {}
			if (categoryName) {
				categoryFilter.category = { name: { contains: categoryName, mode: "insensitive" } }
			}

			const purchases = await prisma.purchase.findMany({
				where: {
					...(Object.keys(dateFilter).length > 0 ? { purchaseDate: dateFilter } : {}),
				},
				include: {
					items: {
						include: {
							product: {
								include: { category: true },
							},
						},
						where: categoryFilter,
					},
					market: true,
				},
			})

			const categoryStats: Record<
				string,
				{
					totalSpent: number
					itemCount: number
					avgPrice: number
					purchases: number
					products: Set<string>
				}
			> = {}

			let totalSpent = 0

			for (const purchase of purchases) {
				for (const item of purchase.items) {
					const categoryName = item.product?.category?.name || "Sem categoria"
					const itemTotal = item.totalPrice

					if (!categoryStats[categoryName]) {
						categoryStats[categoryName] = {
							totalSpent: 0,
							itemCount: 0,
							avgPrice: 0,
							purchases: 0,
							products: new Set(),
						}
					}

					categoryStats[categoryName].totalSpent += itemTotal
					categoryStats[categoryName].itemCount += item.quantity
					categoryStats[categoryName].products.add(item.product?.name || "Produto não identificado")
					totalSpent += itemTotal
				}
			}

			// Calcula médias e percentuais
			const categoryAnalysis = Object.entries(categoryStats)
				.map(([category, stats]) => ({
					category,
					totalSpent: stats.totalSpent,
					percentage: (stats.totalSpent / totalSpent) * 100,
					itemCount: stats.itemCount,
					avgPrice: stats.totalSpent / stats.itemCount,
					uniqueProducts: stats.products.size,
					productsArray: Array.from(stats.products),
				}))
				.sort((a, b) => b.totalSpent - a.totalSpent)

			const period =
				startDate && endDate
					? `${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(endDate).toLocaleDateString("pt-BR")}`
					: "Todo o período"

			return {
				success: true,
				message: `Análise de gastos por categoria - ${period}: R$ ${totalSpent.toFixed(2)} total`,
				totalSpent,
				period,
				categoriesCount: categoryAnalysis.length,
				categoryAnalysis,
				topCategory: categoryAnalysis[0],
			}
		} catch (error) {
			return { success: false, message: `Erro ao analisar gastos: ${error}` }
		}
	},

	getBestTimeToBuy: async ({ productName }: { productName: string }) => {
		try {
			const purchases = await prisma.purchase.findMany({
				where: {
					items: {
						some: {
							product: { name: { contains: productName, mode: "insensitive" } },
						},
					},
				},
				include: {
					items: {
						where: {
							product: { name: { contains: productName, mode: "insensitive" } },
						},
						include: { product: true },
					},
					market: true,
				},
				orderBy: { purchaseDate: "desc" },
				take: 100, // Últimas 100 compras
			})

			if (purchases.length === 0) {
				return {
					success: false,
					message: `Nenhuma compra encontrada para "${productName}"`,
				}
			}

			const dayStats: Record<string, { prices: number[]; count: number }> = {}
			const monthStats: Record<string, { prices: number[]; count: number }> = {}

			for (const purchase of purchases) {
				for (const item of purchase.items) {
					const date = purchase.purchaseDate
					const dayOfWeek = date.toLocaleDateString("pt-BR", { weekday: "long" })
					const month = date.toLocaleDateString("pt-BR", { month: "long" })
					const price = item.unitPrice

					// Estatísticas por dia da semana
					if (!dayStats[dayOfWeek]) {
						dayStats[dayOfWeek] = { prices: [], count: 0 }
					}
					dayStats[dayOfWeek].prices.push(price)
					dayStats[dayOfWeek].count++

					// Estatísticas por mês
					if (!monthStats[month]) {
						monthStats[month] = { prices: [], count: 0 }
					}
					monthStats[month].prices.push(price)
					monthStats[month].count++
				}
			}

			// Calcula médias
			const dayAnalysis = Object.entries(dayStats)
				.map(([day, stats]) => ({
					period: day,
					avgPrice: stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length,
					minPrice: Math.min(...stats.prices),
					maxPrice: Math.max(...stats.prices),
					purchaseCount: stats.count,
				}))
				.sort((a, b) => a.avgPrice - b.avgPrice)

			const monthAnalysis = Object.entries(monthStats)
				.map(([month, stats]) => ({
					period: month,
					avgPrice: stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length,
					minPrice: Math.min(...stats.prices),
					maxPrice: Math.max(...stats.prices),
					purchaseCount: stats.count,
				}))
				.sort((a, b) => a.avgPrice - b.avgPrice)

			return {
				success: true,
				message: `Análise de melhor época para comprar "${productName}"`,
				productName,
				totalPurchases: purchases.length,
				bestDayToBuy: dayAnalysis[0],
				bestMonthToBuy: monthAnalysis[0],
				dayAnalysis,
				monthAnalysis,
				recommendation: `Melhor dia: ${dayAnalysis[0]?.period} (R$ ${dayAnalysis[0]?.avgPrice.toFixed(2)} em média). Melhor mês: ${monthAnalysis[0]?.period}.`,
			}
		} catch (error) {
			return { success: false, message: `Erro ao analisar melhor época: ${error}` }
		}
	},

	predictPriceChanges: async ({ productName, days = 30 }: { productName: string; days?: number }) => {
		try {
			const purchases = await prisma.purchase.findMany({
				where: {
					items: {
						some: {
							product: { name: { contains: productName, mode: "insensitive" } },
						},
					},
					purchaseDate: {
						gte: new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000), // Dobro do período para análise
					},
				},
				include: {
					items: {
						where: {
							product: { name: { contains: productName, mode: "insensitive" } },
						},
						include: { product: true },
					},
					market: true,
				},
				orderBy: { purchaseDate: "asc" },
			})

			if (purchases.length < 3) {
				return {
					success: false,
					message: `Dados insuficientes para previsão de "${productName}". Necessário pelo menos 3 compras.`,
				}
			}

			const priceData: { date: Date; price: number; market: string }[] = []

			for (const purchase of purchases) {
				for (const item of purchase.items) {
					priceData.push({
						date: purchase.purchaseDate,
						price: item.unitPrice,
						market: purchase.market.name,
					})
				}
			}

			// Análise de tendência (regressão linear simples)
			const n = priceData.length
			const sumX = priceData.reduce((sum, _point, index) => sum + index, 0)
			const sumY = priceData.reduce((sum, point) => sum + point.price, 0)
			const sumXY = priceData.reduce((sum, point, index) => sum + index * point.price, 0)
			const sumX2 = priceData.reduce((sum, _point, index) => sum + index * index, 0)

			const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
			const intercept = (sumY - slope * sumX) / n

			// Previsão para os próximos dias
			const currentPrice = priceData[priceData.length - 1].price
			const predictedPrice = slope * (n + days) + intercept
			const priceChange = predictedPrice - currentPrice
			const percentageChange = (priceChange / currentPrice) * 100

			const trend = slope > 0.01 ? "alta" : slope < -0.01 ? "baixa" : "estável"
			const confidence = Math.min(90, Math.max(10, 70 - Math.abs(percentageChange) * 2))

			return {
				success: true,
				message: `Previsão de preço para "${productName}" nos próximos ${days} dias`,
				productName,
				currentPrice,
				predictedPrice,
				priceChange,
				percentageChange,
				trend,
				confidence,
				dataPoints: n,
				recommendation:
					trend === "alta"
						? "Considere comprar agora, preço pode subir"
						: trend === "baixa"
							? "Aguarde, preço pode cair"
							: "Preço estável, pode comprar quando necessário",
				priceHistory: priceData.slice(-10), // Últimos 10 pontos
			}
		} catch (error) {
			return { success: false, message: `Erro ao prever preços: ${error}` }
		}
	},

	getPromotionHistory: async ({
		productName,
		marketName,
		days = 90,
	}: {
		productName?: string
		marketName?: string
		days?: number
	}) => {
		try {
			const dateFilter = {
				gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
			}

			const purchases = await prisma.purchase.findMany({
				where: {
					purchaseDate: dateFilter,
					...(marketName ? { market: { name: { contains: marketName, mode: "insensitive" } } } : {}),
					...(productName
						? {
								items: {
									some: {
										product: { name: { contains: productName, mode: "insensitive" } },
									},
								},
							}
						: {}),
				},
				include: {
					items: {
						include: { product: true },
						...(productName
							? {
									where: {
										product: { name: { contains: productName, mode: "insensitive" } },
									},
								}
							: {}),
					},
					market: true,
				},
				orderBy: { purchaseDate: "desc" },
			})

			// Detecta promoções (preços significativamente abaixo da média)
			const productPrices: Record<string, number[]> = {}

			for (const purchase of purchases) {
				for (const item of purchase.items) {
					const key = item.product?.name || "Produto não identificado"
					if (!productPrices[key]) {
						productPrices[key] = []
					}
					productPrices[key].push(item.unitPrice)
				}
			}

			const promotions = []

			for (const purchase of purchases) {
				for (const item of purchase.items) {
					const productKey = item.product?.name || "Produto não identificado"
					const prices = productPrices[productKey]

					if (prices.length >= 3) {
						const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
						const discount = ((avgPrice - item.unitPrice) / avgPrice) * 100

						if (discount > 15) {
							// Considera promoção se desconto > 15%
							promotions.push({
								product: productKey,
								market: purchase.market.name,
								originalPrice: avgPrice,
								promotionPrice: item.unitPrice,
								discount: discount,
								date: purchase.purchaseDate.toLocaleDateString("pt-BR"),
								savings: (avgPrice - item.unitPrice) * item.quantity,
								quantity: item.quantity,
							})
						}
					}
				}
			}

			promotions.sort((a, b) => b.discount - a.discount)

			const totalSavings = promotions.reduce((sum, promo) => sum + promo.savings, 0)
			const avgDiscount =
				promotions.length > 0 ? promotions.reduce((sum, promo) => sum + promo.discount, 0) / promotions.length : 0

			return {
				success: true,
				message: `Histórico de promoções dos últimos ${days} dias: ${promotions.length} promoções encontradas`,
				period: `${days} dias`,
				promotionsFound: promotions.length,
				totalSavings,
				avgDiscount,
				promotions: promotions.slice(0, 20), // Top 20 promoções
				filters: {
					product: productName || "Todos os produtos",
					market: marketName || "Todos os mercados",
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao buscar histórico de promoções: ${error}` }
		}
	},
}
