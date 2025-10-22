import { prisma } from "@/lib/prisma"

export const predictionFunctions = {
	compareBasicBasket: async ({ marketNames }: { marketNames: string[] }) => {
		try {
			if (marketNames.length < 2) {
				return { success: false, message: "É necessário informar pelo menos 2 mercados para comparação" }
			}

			// Produtos básicos para comparação
			const basicProducts = [
				"arroz",
				"feijão",
				"açúcar",
				"sal",
				"óleo",
				"farinha de trigo",
				"leite",
				"ovos",
				"pão",
				"manteiga",
				"café",
				"macarrão",
				"carne bovina",
				"frango",
				"banana",
				"tomate",
				"cebola",
				"batata",
			]

			const marketComparison: any[] = []

			for (const marketName of marketNames) {
				const market = await prisma.market.findFirst({
					where: { name: { contains: marketName, mode: "insensitive" } },
				})

				if (!market) {
					continue
				}

				const marketData = {
					market: market.name,
					products: [] as any[],
					totalBasket: 0,
					foundProducts: 0,
				}

				for (const productName of basicProducts) {
					// Busca preço mais recente do produto neste mercado
					const recentPurchase = await prisma.purchase.findFirst({
						where: {
							marketId: market.id,
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
						},
						orderBy: { purchaseDate: "desc" },
					})

					if (recentPurchase?.items[0]) {
						const item = recentPurchase.items[0]
						marketData.products.push({
							product: item.product?.name || productName,
							price: item.unitPrice,
							lastUpdate: recentPurchase.purchaseDate.toLocaleDateString("pt-BR"),
							found: true,
						})
						marketData.totalBasket += item.unitPrice
						marketData.foundProducts++
					} else {
						marketData.products.push({
							product: productName,
							price: null,
							lastUpdate: null,
							found: false,
						})
					}
				}

				marketComparison.push(marketData)
			}

			// Ordena por menor custo total
			marketComparison.sort((a, b) => a.totalBasket - b.totalBasket)

			// Calcula diferenças
			const cheapestMarket = marketComparison[0]
			const comparisons = marketComparison.map((market) => ({
				...market,
				difference: market.totalBasket - cheapestMarket.totalBasket,
				percentageDifference:
					cheapestMarket.totalBasket > 0
						? ((market.totalBasket - cheapestMarket.totalBasket) / cheapestMarket.totalBasket) * 100
						: 0,
				coverage: (market.foundProducts / basicProducts.length) * 100,
			}))

			// Análise por produto
			const productAnalysis = basicProducts
				.map((productName) => {
					const productPrices = marketComparison
						.map((market) => {
							const product = market.products.find((p: any) =>
								p.product.toLowerCase().includes(productName.toLowerCase()),
							)
							return product?.found
								? {
									market: market.market,
									price: product.price,
									lastUpdate: product.lastUpdate,
								}
								: null
						})
						.filter(Boolean)

					if (productPrices.length === 0) return null

					const sortedPrices = productPrices.sort((a, b) => (a?.price || 0) - (b?.price || 0))
					const cheapest = sortedPrices[0]
					const mostExpensive = sortedPrices[sortedPrices.length - 1]

					return {
						product: productName,
						cheapestMarket: cheapest?.market,
						cheapestPrice: cheapest?.price,
						mostExpensiveMarket: mostExpensive?.market,
						mostExpensivePrice: mostExpensive?.price,
						priceDifference: (mostExpensive?.price || 0) - (cheapest?.price || 0),
						marketsWithPrice: productPrices.length,
						allPrices: productPrices,
					}
				})
				.filter(Boolean)

			return {
				success: true,
				message: `Comparação de cesta básica entre ${marketComparison.length} mercados`,
				marketsCompared: marketComparison.length,
				productsAnalyzed: basicProducts.length,
				cheapestMarket: cheapestMarket.market,
				marketComparison: comparisons,
				productAnalysis,
				summary: {
					bestOverall: cheapestMarket.market,
					totalSavings: comparisons[comparisons.length - 1]?.difference || 0,
					avgCoverage: comparisons.reduce((sum, m) => sum + m.coverage, 0) / comparisons.length,
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao comparar cestas: ${error}` }
		}
	},

	predictNextPurchases: async ({ daysAhead = 7, confidence = 70 }: { daysAhead?: number; confidence?: number }) => {
		try {
			// Busca histórico de compras dos últimos 90 dias
			const recentPurchases = await prisma.purchase.findMany({
				where: {
					purchaseDate: {
						gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
					},
				},
				include: {
					items: { include: { product: { include: { category: true } } } },
					market: true,
				},
				orderBy: { purchaseDate: "desc" },
			})

			if (recentPurchases.length < 3) {
				return {
					success: false,
					message: "Dados insuficientes para previsão. Necessário pelo menos 3 compras nos últimos 90 dias.",
				}
			}

			// Analisa padrões de compra por produto
			const productPatterns: Record<
				string,
				{
					purchases: Date[]
					quantities: number[]
					avgInterval: number
					lastPurchase: Date
					avgQuantity: number
					category: string
				}
			> = {}

			for (const purchase of recentPurchases) {
				for (const item of purchase.items) {
					const productName = item.product?.name || "Produto não identificado"

					if (!productPatterns[productName]) {
						productPatterns[productName] = {
							purchases: [],
							quantities: [],
							avgInterval: 0,
							lastPurchase: new Date(0),
							avgQuantity: 0,
							category: item.product?.category?.name || "Sem categoria",
						}
					}

					productPatterns[productName].purchases.push(purchase.purchaseDate)
					productPatterns[productName].quantities.push(item.quantity)

					if (purchase.purchaseDate > productPatterns[productName].lastPurchase) {
						productPatterns[productName].lastPurchase = purchase.purchaseDate
					}
				}
			}

			// Calcula intervalos e previsões
			const predictions = []
			const now = new Date()

			for (const [productName, pattern] of Object.entries(productPatterns)) {
				if (pattern.purchases.length >= 2) {
					// Calcula intervalo médio entre compras
					const sortedPurchases = pattern.purchases.sort((a, b) => a.getTime() - b.getTime())
					const intervals = []

					for (let i = 1; i < sortedPurchases.length; i++) {
						const current = sortedPurchases[i];
						const previous = sortedPurchases[i - 1];
						if (current && previous) {
							const interval = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)
							intervals.push(interval)
						}
					}

					const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
					const avgQuantity = pattern.quantities.reduce((a, b) => a + b, 0) / pattern.quantities.length

					// Calcula quando seria a próxima compra
					const daysSinceLastPurchase = (now.getTime() - pattern.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)
					const daysUntilNextPurchase = avgInterval - daysSinceLastPurchase

					// Calcula confiança baseada na regularidade
					const intervalVariance =
						intervals.reduce((sum, interval) => sum + (interval - avgInterval) ** 2, 0) / intervals.length
					const intervalStdDev = Math.sqrt(intervalVariance)
					const regularity = Math.max(0, 100 - (intervalStdDev / avgInterval) * 100)

					if (daysUntilNextPurchase <= daysAhead && regularity >= confidence) {
						// Busca preço mais recente
						const recentPrice = await prisma.purchase.findFirst({
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
								},
								market: true,
							},
							orderBy: { purchaseDate: "desc" },
						})

						predictions.push({
							product: productName,
							category: pattern.category,
							predictedDate: new Date(now.getTime() + daysUntilNextPurchase * 24 * 60 * 60 * 1000).toLocaleDateString(
								"pt-BR",
							),
							daysUntilPurchase: Math.round(daysUntilNextPurchase * 10) / 10,
							predictedQuantity: Math.round(avgQuantity),
							confidence: Math.round(regularity),
							avgInterval: Math.round(avgInterval),
							lastPurchase: pattern.lastPurchase.toLocaleDateString("pt-BR"),
							estimatedPrice: recentPrice?.items[0]?.unitPrice || 0,
							lastMarket: recentPrice?.market.name || "Não encontrado",
							totalPurchases: pattern.purchases.length,
						})
					}
				}
			}

			predictions.sort((a, b) => a.daysUntilPurchase - b.daysUntilPurchase)

			const totalEstimatedCost = predictions.reduce(
				(sum, pred) => sum + pred.estimatedPrice * pred.predictedQuantity,
				0,
			)
			const highConfidencePredictions = predictions.filter((p) => p.confidence >= 80).length

			return {
				success: true,
				message: `Previsão de compras para os próximos ${daysAhead} dias: ${predictions.length} produtos`,
				daysAhead,
				confidenceThreshold: confidence,
				predictionsCount: predictions.length,
				highConfidencePredictions,
				totalEstimatedCost,
				predictions,
				summary: {
					nextPurchase: predictions[0]?.product || "Nenhuma previsão",
					avgConfidence:
						predictions.length > 0 ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length : 0,
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao prever compras: ${error}` }
		}
	},

	suggestForgottenItems: async ({ basedOnHistory = 30 }: { basedOnHistory?: number }) => {
		try {
			// Busca compras dos últimos X dias para análise
			const recentPurchases = await prisma.purchase.findMany({
				where: {
					purchaseDate: {
						gte: new Date(Date.now() - basedOnHistory * 24 * 60 * 60 * 1000),
					},
				},
				include: {
					items: { include: { product: { include: { category: true } } } },
				},
			})

			// Busca compras históricas (últimos 6 meses) para comparação
			const historicalPurchases = await prisma.purchase.findMany({
				where: {
					purchaseDate: {
						gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
						lt: new Date(Date.now() - basedOnHistory * 24 * 60 * 60 * 1000),
					},
				},
				include: {
					items: { include: { product: { include: { category: true } } } },
				},
			})

			// Produtos comprados recentemente
			const recentProducts = new Set()
			for (const purchase of recentPurchases) {
				for (const item of purchase.items) {
					recentProducts.add(item.product?.name || "")
				}
			}

			// Analisa produtos frequentes no histórico que não foram comprados recentemente
			const historicalProductFrequency: Record<
				string,
				{
					count: number
					lastPurchase: Date
					avgQuantity: number
					category: string
					totalQuantity: number
				}
			> = {}

			for (const purchase of historicalPurchases) {
				for (const item of purchase.items) {
					const productName = item.product?.name || "Produto não identificado"

					if (!historicalProductFrequency[productName]) {
						historicalProductFrequency[productName] = {
							count: 0,
							lastPurchase: new Date(0),
							avgQuantity: 0,
							category: item.product?.category?.name || "Sem categoria",
							totalQuantity: 0,
						}
					}

					historicalProductFrequency[productName].count++
					historicalProductFrequency[productName].totalQuantity += item.quantity

					if (purchase.purchaseDate > historicalProductFrequency[productName].lastPurchase) {
						historicalProductFrequency[productName].lastPurchase = purchase.purchaseDate
					}
				}
			}

			// Calcula médias e identifica produtos esquecidos
			const forgottenItems = []
			const now = new Date()

			for (const [productName, data] of Object.entries(historicalProductFrequency)) {
				// Só considera produtos que eram comprados com frequência (pelo menos 3 vezes)
				if (data.count >= 3 && !recentProducts.has(productName)) {
					data.avgQuantity = data.totalQuantity / data.count
					const daysSinceLastPurchase = (now.getTime() - data.lastPurchase.getTime()) / (1000 * 60 * 60 * 24)

					// Calcula frequência de compra (compras por mês)
					const monthsInHistory = 6 // 6 meses de histórico
					const purchaseFrequency = data.count / monthsInHistory

					// Busca preço mais recente
					const recentPrice = await prisma.purchase.findFirst({
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
							},
							market: true,
						},
						orderBy: { purchaseDate: "desc" },
					})

					forgottenItems.push({
						product: productName,
						category: data.category,
						historicalFrequency: Math.round(purchaseFrequency * 10) / 10, // compras por mês
						daysSinceLastPurchase: Math.round(daysSinceLastPurchase),
						avgQuantity: Math.round(data.avgQuantity),
						totalHistoricalPurchases: data.count,
						lastPurchase: data.lastPurchase.toLocaleDateString("pt-BR"),
						estimatedPrice: recentPrice?.items[0]?.unitPrice || 0,
						lastMarket: recentPrice?.market.name || "Não encontrado",
						priority: purchaseFrequency > 1 ? "alta" : purchaseFrequency > 0.5 ? "média" : "baixa",
						reason:
							daysSinceLastPurchase > 60
								? "Não comprado há muito tempo"
								: "Produto frequente ausente nas compras recentes",
					})
				}
			}

			// Ordena por frequência histórica (mais frequentes primeiro)
			forgottenItems.sort((a, b) => b.historicalFrequency - a.historicalFrequency)

			// Agrupa por categoria para melhor visualização
			const categoryGroups: Record<string, typeof forgottenItems> = {}
			for (const item of forgottenItems) {
				if (!categoryGroups[item.category]) {
					categoryGroups[item.category] = []
				}
				categoryGroups[item.category]!.push(item)
			}

			const totalEstimatedCost = forgottenItems.reduce((sum, item) => sum + item.estimatedPrice * item.avgQuantity, 0)
			const highPriorityItems = forgottenItems.filter((item) => item.priority === "alta").length

			return {
				success: true,
				message: `Sugestões de itens esquecidos baseado nos últimos ${basedOnHistory} dias: ${forgottenItems.length} produtos`,
				analysisPeriod: basedOnHistory,
				forgottenItemsCount: forgottenItems.length,
				highPriorityItems,
				totalEstimatedCost,
				forgottenItems: forgottenItems.slice(0, 20), // Top 20
				categoryGroups,
				summary: {
					topForgottenItem: forgottenItems[0]?.product || "Nenhum item esquecido",
					avgDaysSinceLastPurchase:
						forgottenItems.length > 0
							? forgottenItems.reduce((sum, item) => sum + item.daysSinceLastPurchase, 0) / forgottenItems.length
							: 0,
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao sugerir itens esquecidos: ${error}` }
		}
	},

	detectConsumptionChanges: async ({ period = 60 }: { period?: number }) => {
		try {
			const midPoint = new Date(Date.now() - (period / 2) * 24 * 60 * 60 * 1000)
			const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

			// Primeira metade do período
			const firstPeriodPurchases = await prisma.purchase.findMany({
				where: {
					purchaseDate: {
						gte: startDate,
						lt: midPoint,
					},
				},
				include: {
					items: { include: { product: { include: { category: true } } } },
				},
			})

			// Segunda metade do período
			const secondPeriodPurchases = await prisma.purchase.findMany({
				where: {
					purchaseDate: {
						gte: midPoint,
						lt: new Date(),
					},
				},
				include: {
					items: { include: { product: { include: { category: true } } } },
				},
			})

			if (firstPeriodPurchases.length === 0 || secondPeriodPurchases.length === 0) {
				return {
					success: false,
					message: `Dados insuficientes para análise. Necessário compras em ambos os períodos de ${period / 2} dias.`,
				}
			}

			// Analisa consumo por produto em cada período
			const firstPeriodConsumption: Record<string, { quantity: number; spending: number; category: string }> = {}
			const secondPeriodConsumption: Record<string, { quantity: number; spending: number; category: string }> = {}

			// Primeira metade
			for (const purchase of firstPeriodPurchases) {
				for (const item of purchase.items) {
					const productName = item.product?.name || "Produto não identificado"
					if (!firstPeriodConsumption[productName]) {
						firstPeriodConsumption[productName] = {
							quantity: 0,
							spending: 0,
							category: item.product?.category?.name || "Sem categoria",
						}
					}
					firstPeriodConsumption[productName].quantity += item.quantity
					firstPeriodConsumption[productName].spending += item.totalPrice
				}
			}

			// Segunda metade
			for (const purchase of secondPeriodPurchases) {
				for (const item of purchase.items) {
					const productName = item.product?.name || "Produto não identificado"
					if (!secondPeriodConsumption[productName]) {
						secondPeriodConsumption[productName] = {
							quantity: 0,
							spending: 0,
							category: item.product?.category?.name || "Sem categoria",
						}
					}
					secondPeriodConsumption[productName].quantity += item.quantity
					secondPeriodConsumption[productName].spending += item.totalPrice
				}
			}

			// Detecta mudanças significativas
			const changes = []
			const allProducts = new Set([...Object.keys(firstPeriodConsumption), ...Object.keys(secondPeriodConsumption)])

			for (const productName of Array.from(allProducts)) {
				const first = firstPeriodConsumption[productName] || { quantity: 0, spending: 0, category: "Sem categoria" }
				const second = secondPeriodConsumption[productName] || { quantity: 0, spending: 0, category: "Sem categoria" }

				// Calcula mudanças percentuais
				const quantityChange =
					first.quantity > 0
						? ((second.quantity - first.quantity) / first.quantity) * 100
						: second.quantity > 0
							? 100
							: 0

				const spendingChange =
					first.spending > 0
						? ((second.spending - first.spending) / first.spending) * 100
						: second.spending > 0
							? 100
							: 0

				// Só considera mudanças significativas (>20% ou produtos novos/removidos)
				if (Math.abs(quantityChange) > 20 || first.quantity === 0 || second.quantity === 0) {
					let changeType = ""
					if (first.quantity === 0 && second.quantity > 0) {
						changeType = "Produto novo"
					} else if (first.quantity > 0 && second.quantity === 0) {
						changeType = "Parou de comprar"
					} else if (quantityChange > 20) {
						changeType = "Aumento significativo"
					} else if (quantityChange < -20) {
						changeType = "Redução significativa"
					}

					changes.push({
						product: productName,
						category: first.category || second.category,
						changeType,
						firstPeriod: {
							quantity: first.quantity,
							spending: first.spending,
						},
						secondPeriod: {
							quantity: second.quantity,
							spending: second.spending,
						},
						quantityChange: Math.round(quantityChange * 10) / 10,
						spendingChange: Math.round(spendingChange * 10) / 10,
						significance: Math.abs(quantityChange) > 50 ? "alta" : Math.abs(quantityChange) > 30 ? "média" : "baixa",
					})
				}
			}

			// Ordena por significância da mudança
			changes.sort((a, b) => Math.abs(b.quantityChange) - Math.abs(a.quantityChange))

			// Análise por categoria
			const categoryChanges: Record<string, { products: number; avgChange: number }> = {}
			for (const change of changes) {
				if (!categoryChanges[change.category]) {
					categoryChanges[change.category] = { products: 0, avgChange: 0 }
				}
				categoryChanges[change.category]!.products++
				categoryChanges[change.category]!.avgChange += Math.abs(change.quantityChange)
			}

			for (const category of Object.keys(categoryChanges)) {
				const catChange = categoryChanges[category];
				if (catChange) {
					catChange.avgChange /= catChange.products
					catChange.avgChange = Math.round(catChange.avgChange * 10) / 10
				}
			}

			const totalFirstPeriodSpending = Object.values(firstPeriodConsumption).reduce(
				(sum, item) => sum + item.spending,
				0,
			)
			const totalSecondPeriodSpending = Object.values(secondPeriodConsumption).reduce(
				(sum, item) => sum + item.spending,
				0,
			)
			const overallSpendingChange =
				totalFirstPeriodSpending > 0
					? ((totalSecondPeriodSpending - totalFirstPeriodSpending) / totalFirstPeriodSpending) * 100
					: 0

			return {
				success: true,
				message: `Análise de mudanças no consumo dos últimos ${period} dias: ${changes.length} mudanças detectadas`,
				analysisPeriod: period,
				periodsCompared: `${period / 2} dias cada`,
				changesDetected: changes.length,
				significantChanges: changes.filter((c) => c.significance === "alta").length,
				overallSpendingChange: Math.round(overallSpendingChange * 10) / 10,
				changes: changes.slice(0, 15), // Top 15 mudanças
				categoryChanges,
				summary: {
					biggestIncrease: changes.find((c) => c.quantityChange > 0)?.product || "Nenhum",
					biggestDecrease: changes.find((c) => c.quantityChange < 0)?.product || "Nenhum",
					newProducts: changes.filter((c) => c.changeType === "Produto novo").length,
					stoppedBuying: changes.filter((c) => c.changeType === "Parou de comprar").length,
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao detectar mudanças: ${error}` }
		}
	},
}
