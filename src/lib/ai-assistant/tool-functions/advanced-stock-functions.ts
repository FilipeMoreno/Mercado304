import { prisma } from "@/lib/prisma"

export const advancedStockFunctions = {
	suggestPurchasesByStock: async ({ daysAhead = 7 }: { daysAhead?: number }) => {
		try {
			// Busca itens em estoque
			const stockItems = await prisma.stockItem.findMany({
				include: {
					product: { include: { category: true } },
				},
			})

			// Busca movimentações de saída para cada item
			const stockMovements = await prisma.stockMovement.findMany({
				where: {
					type: "SAIDA",
					stockItemId: { in: stockItems.map((item) => item.id) },
				},
				orderBy: { date: "desc" },
				take: 100,
			})

			const suggestions = []

			for (const item of stockItems) {
				// Filtra movimentações para este item
				const itemMovements = stockMovements.filter((mov) => mov.stockItemId === item.id)

				if (itemMovements.length >= 2) {
					// Calcula consumo médio diário
					const movements = itemMovements.sort((a, b) => a.date.getTime() - b.date.getTime())
					const firstMovement = movements[0]
					const lastMovement = movements[movements.length - 1]

					if (!firstMovement || !lastMovement) continue

					const daysDiff = Math.max(
						1,
						(lastMovement.date.getTime() - firstMovement.date.getTime()) / (1000 * 60 * 60 * 24),
					)

					const totalConsumed = movements.reduce((sum: number, mov: any) => sum + mov.quantity, 0)
					const dailyConsumption = totalConsumed / daysDiff

					// Estima quando o produto vai acabar
					const daysUntilEmpty = item.quantity / dailyConsumption

					if (daysUntilEmpty <= daysAhead) {
						// Busca preço médio recente
						const recentPurchase = await prisma.purchase.findFirst({
							where: {
								items: { some: { productId: item.productId } },
							},
							include: {
								items: {
									where: { productId: item.productId },
									include: { product: true },
								},
								market: true,
							},
							orderBy: { purchaseDate: "desc" },
						})

						const avgPrice = recentPurchase?.items[0]?.unitPrice || 0
						const suggestedQuantity = Math.ceil(dailyConsumption * (daysAhead + 7)) // Para mais 1 semana

						suggestions.push({
							product: item.product?.name || "Produto não identificado",
							category: item.product?.category?.name || "Sem categoria",
							currentStock: item.quantity,
							dailyConsumption: Math.round(dailyConsumption * 100) / 100,
							daysUntilEmpty: Math.round(daysUntilEmpty * 10) / 10,
							suggestedQuantity,
							estimatedCost: avgPrice * suggestedQuantity,
							lastPrice: avgPrice,
							lastMarket: recentPurchase?.market.name || "Não encontrado",
							priority: daysUntilEmpty <= 3 ? "alta" : daysUntilEmpty <= 7 ? "média" : "baixa",
							location: item.location,
						})
					}
				}
			}

			suggestions.sort((a, b) => a.daysUntilEmpty - b.daysUntilEmpty)

			const totalEstimatedCost = suggestions.reduce((sum, item) => sum + item.estimatedCost, 0)
			const highPriority = suggestions.filter((s) => s.priority === "alta").length

			return {
				success: true,
				message: `Sugestões de compra para os próximos ${daysAhead} dias: ${suggestions.length} produtos`,
				daysAhead,
				suggestionsCount: suggestions.length,
				highPriorityItems: highPriority,
				totalEstimatedCost,
				suggestions,
			}
		} catch (error) {
			return { success: false, message: `Erro ao gerar sugestões: ${error}` }
		}
	},

	getRunningOutAlerts: async ({ daysThreshold = 7 }: { daysThreshold?: number }) => {
		try {
			const stockItems = await prisma.stockItem.findMany({
				include: {
					product: { include: { category: true } },
					movements: {
						where: { type: "SAIDA" },
						orderBy: { date: "desc" },
						take: 5,
					},
				},
			})

			const alerts = []
			const now = new Date()

			for (const item of stockItems) {
				let alertType = null
				let daysLeft = null
				let severity = "info"

				// Verifica se está com estoque baixo
				if (item.quantity <= 2) {
					alertType = "Estoque crítico"
					severity = "critical"
				} else if (item.quantity <= 5) {
					alertType = "Estoque baixo"
					severity = "warning"
				}

				// Verifica vencimento
				if (item.expirationDate) {
					const daysToExpire = Math.ceil((item.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

					if (daysToExpire <= 0) {
						alertType = "Produto vencido"
						severity = "critical"
						daysLeft = daysToExpire
					} else if (daysToExpire <= 3) {
						alertType = "Vence em breve"
						severity = "critical"
						daysLeft = daysToExpire
					} else if (daysToExpire <= daysThreshold) {
						alertType = alertType || "Próximo ao vencimento"
						severity = severity === "critical" ? "critical" : "warning"
						daysLeft = daysToExpire
					}
				}

				// Calcula consumo se houver histórico
				let dailyConsumption = 0
				let daysUntilEmpty = null

				if (item.movements.length >= 2) {
					const movements = item.movements
					const firstMov = movements[0]
					const lastMov = movements[movements.length - 1]
					if (!firstMov || !lastMov) continue

					const daysDiff = Math.max(1, (firstMov.date.getTime() - lastMov.date.getTime()) / (1000 * 60 * 60 * 24))
					const totalConsumed = movements.reduce((sum, mov) => sum + mov.quantity, 0)
					dailyConsumption = totalConsumed / daysDiff

					if (dailyConsumption > 0) {
						daysUntilEmpty = Math.round((item.quantity / dailyConsumption) * 10) / 10

						if (daysUntilEmpty <= daysThreshold && !alertType) {
							alertType = "Acabará em breve"
							severity = daysUntilEmpty <= 3 ? "critical" : "warning"
						}
					}
				}

				if (alertType) {
					alerts.push({
						product: item.product?.name || "Produto não identificado",
						category: item.product?.category?.name || "Sem categoria",
						alertType,
						severity,
						currentStock: item.quantity,
						location: item.location,
						expirationDate: item.expirationDate?.toLocaleDateString("pt-BR"),
						daysToExpire: daysLeft,
						dailyConsumption: Math.round(dailyConsumption * 100) / 100,
						daysUntilEmpty,
						recommendation: severity === "critical" ? "Ação imediata necessária" : "Planejar reposição",
					})
				}
			}

			// Ordena por severidade e urgência
			const severityOrder = { critical: 0, warning: 1, info: 2 }
			alerts.sort((a, b) => {
				const severityDiff =
					severityOrder[a.severity as keyof typeof severityOrder] -
					severityOrder[b.severity as keyof typeof severityOrder]
				if (severityDiff !== 0) return severityDiff

				if (a.daysToExpire !== null && b.daysToExpire !== null) {
					return a.daysToExpire - b.daysToExpire
				}

				if (a.daysUntilEmpty !== null && b.daysUntilEmpty !== null) {
					return a.daysUntilEmpty - b.daysUntilEmpty
				}

				return a.currentStock - b.currentStock
			})

			const criticalAlerts = alerts.filter((a) => a.severity === "critical").length
			const warningAlerts = alerts.filter((a) => a.severity === "warning").length

			return {
				success: true,
				message: `Alertas de estoque: ${criticalAlerts} críticos, ${warningAlerts} avisos`,
				totalAlerts: alerts.length,
				criticalAlerts,
				warningAlerts,
				daysThreshold,
				alerts,
			}
		} catch (error) {
			return { success: false, message: `Erro ao verificar alertas: ${error}` }
		}
	},

	optimizeStockByConsumption: async ({ productName }: { productName: string }) => {
		try {
			const product = await prisma.product.findFirst({
				where: { name: { contains: productName, mode: "insensitive" } },
			})

			if (!product) {
				return { success: false, message: `Produto "${productName}" não encontrado` }
			}

			const stockItems = await prisma.stockItem.findMany({
				where: { productId: product.id },
				include: {
					movements: {
						orderBy: { date: "desc" },
						take: 30, // Últimas 30 movimentações
					},
				},
			})

			if (stockItems.length === 0) {
				return { success: false, message: `Nenhum item em estoque para "${productName}"` }
			}

			// Analisa padrão de consumo
			const allMovements = stockItems.flatMap((item) => item.movements)
			const consumptionMovements = allMovements.filter((mov) => mov.type === "SAIDA")

			if (consumptionMovements.length < 3) {
				return {
					success: false,
					message: `Dados insuficientes para análise de "${productName}". Necessário pelo menos 3 movimentações.`,
				}
			}

			// Calcula estatísticas de consumo
			const sortedMovements = consumptionMovements.sort((a, b) => a.date.getTime() - b.date.getTime())
			const firstMovement = sortedMovements[0]
			const lastMovement = sortedMovements[sortedMovements.length - 1]

			if (!firstMovement || !lastMovement) {
				return { error: "Dados insuficientes para análise de padrões de consumo" }
			}

			const firstDate = firstMovement.date
			const lastDate = lastMovement.date
			const daysDiff = Math.max(1, (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24))

			const totalConsumed = consumptionMovements.reduce((sum, mov) => sum + mov.quantity, 0)
			const dailyConsumption = totalConsumed / daysDiff
			const weeklyConsumption = dailyConsumption * 7
			const monthlyConsumption = dailyConsumption * 30

			// Analisa variação no consumo
			const weeklyConsumptions = []
			for (let i = 0; i < sortedMovements.length - 6; i += 7) {
				const weekMovements = sortedMovements.slice(i, i + 7)
				const weekTotal = weekMovements.reduce((sum, mov) => sum + mov.quantity, 0)
				weeklyConsumptions.push(weekTotal)
			}

			const avgWeekly = weeklyConsumptions.reduce((a, b) => a + b, 0) / weeklyConsumptions.length
			const variance =
				weeklyConsumptions.reduce((sum, val) => sum + (val - avgWeekly) ** 2, 0) / weeklyConsumptions.length
			const stdDev = Math.sqrt(variance)
			const variability = (stdDev / avgWeekly) * 100

			// Recomendações de estoque
			const currentStock = stockItems.reduce((sum, item) => sum + item.quantity, 0)
			const daysOfStock = currentStock / dailyConsumption

			const recommendedMinStock = Math.ceil(weeklyConsumption * 1.5) // 1.5 semanas
			const recommendedMaxStock = Math.ceil(monthlyConsumption * 1.2) // 1.2 meses
			const optimalOrderQuantity = Math.ceil(weeklyConsumption * 2) // 2 semanas

			let recommendation = ""
			if (currentStock < recommendedMinStock) {
				recommendation = `Estoque baixo! Reabastecer com ${optimalOrderQuantity} unidades.`
			} else if (currentStock > recommendedMaxStock) {
				recommendation = `Estoque alto. Evitar compras por ${Math.ceil(daysOfStock - 30)} dias.`
			} else {
				recommendation = `Estoque adequado. Próxima compra em ${Math.ceil(daysOfStock - 10)} dias.`
			}

			return {
				success: true,
				message: `Análise de otimização de estoque para "${productName}"`,
				productName,
				currentStock,
				daysOfStock: Math.round(daysOfStock * 10) / 10,
				consumption: {
					daily: Math.round(dailyConsumption * 100) / 100,
					weekly: Math.round(weeklyConsumption * 100) / 100,
					monthly: Math.round(monthlyConsumption * 100) / 100,
				},
				variability: Math.round(variability * 10) / 10,
				recommendations: {
					minStock: recommendedMinStock,
					maxStock: recommendedMaxStock,
					optimalOrderQuantity,
					recommendation,
				},
				analysis: {
					totalMovements: consumptionMovements.length,
					analysisPeriod: Math.round(daysDiff),
					consumptionTrend: variability < 20 ? "estável" : variability < 40 ? "moderada" : "alta variação",
				},
			}
		} catch (error) {
			return { success: false, message: `Erro ao otimizar estoque: ${error}` }
		}
	},

	generateWasteReport: async ({
		period = 30,
		includeRecommendations = true,
	}: {
		period?: number
		includeRecommendations?: boolean
	}) => {
		try {
			const startDate = new Date(Date.now() - period * 24 * 60 * 60 * 1000)

			const wasteMovements = await prisma.stockMovement.findMany({
				where: {
					type: { in: ["VENCIMENTO", "PERDA", "DESPERDICIO"] },
					date: { gte: startDate },
				},
				include: {
					stockItem: { include: { product: { include: { category: true } } } },
				},
				orderBy: { date: "desc" },
			})

			const wasteRecords = await prisma.wasteRecord.findMany({
				where: { createdAt: { gte: startDate } },
			})

			// Combina dados de movimentações e registros de desperdício
			const wasteData = [
				...wasteMovements.map((mov) => ({
					product: mov.stockItem?.product?.name || "Produto não identificado",
					category: mov.stockItem?.product?.category?.name || "Sem categoria",
					quantity: mov.quantity,
					reason: mov.reason || mov.type,
					date: mov.date,
					location: mov.stockItem?.location,
					estimatedValue: 0, // Será calculado
				})),
				...wasteRecords.map((record) => ({
					product: record.productName,
					category: record.category || "Sem categoria",
					quantity: record.quantity,
					reason: record.wasteReason,
					date: record.wasteDate,
					location: record.location,
					estimatedValue: record.totalValue || 0,
				})),
			]

			// Calcula valores estimados para movimentações sem valor
			for (const waste of wasteData) {
				if (waste.estimatedValue === 0) {
					const recentPrice = await prisma.purchase.findFirst({
						where: {
							items: {
								some: {
									product: { name: { contains: waste.product, mode: "insensitive" } },
								},
							},
						},
						include: {
							items: {
								where: {
									product: { name: { contains: waste.product, mode: "insensitive" } },
								},
							},
						},
						orderBy: { purchaseDate: "desc" },
					})

					if (recentPrice?.items[0]) {
						waste.estimatedValue = recentPrice.items[0].unitPrice * waste.quantity
					}
				}
			}

			// Análise por categoria
			const categoryWaste: Record<
				string,
				{
					quantity: number
					value: number
					items: number
					reasons: Record<string, number>
				}
			> = {}

			let totalQuantity = 0
			let totalValue = 0

			for (const waste of wasteData) {
				const category = waste.category

				if (!categoryWaste[category]) {
					categoryWaste[category] = { quantity: 0, value: 0, items: 0, reasons: {} }
				}

				categoryWaste[category].quantity += waste.quantity
				categoryWaste[category].value += waste.estimatedValue
				categoryWaste[category].items++

				const reason = waste.reason || "Não especificado"
				categoryWaste[category].reasons[reason] = (categoryWaste[category].reasons[reason] || 0) + 1

				totalQuantity += waste.quantity
				totalValue += waste.estimatedValue
			}

			const categoryAnalysis = Object.entries(categoryWaste)
				.map(([category, data]) => ({
					category,
					quantity: data.quantity,
					value: data.value,
					items: data.items,
					percentage: (data.value / totalValue) * 100,
					topReason: Object.entries(data.reasons).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A",
				}))
				.sort((a, b) => b.value - a.value)

			// Recomendações
			const recommendations = []

			if (includeRecommendations) {
				// Categoria com mais desperdício
				if (categoryAnalysis.length > 0) {
					const topCategory = categoryAnalysis[0]
					if (topCategory) {
						recommendations.push(
							`Foque na categoria "${topCategory.category}" que representa ${topCategory.percentage.toFixed(1)}% do desperdício.`,
						)
					}
				}

				// Principais motivos
				const reasonCounts: Record<string, number> = {}
				wasteData.forEach((waste) => {
					const reason = waste.reason || "Não especificado"
					reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
				})

				const topReason = Object.entries(reasonCounts).sort(([, a], [, b]) => b - a)[0]
				if (topReason) {
					recommendations.push(
						`Principal causa: "${topReason[0]}" (${topReason[1]} ocorrências). Considere melhorar o controle de validade.`,
					)
				}

				// Valor médio
				const avgDailyWaste = totalValue / period
				if (avgDailyWaste > 10) {
					recommendations.push(
						`Desperdício médio de R$ ${avgDailyWaste.toFixed(2)}/dia. Considere implementar alertas de vencimento.`,
					)
				}
			}

			return {
				success: true,
				message: `Relatório de desperdício dos últimos ${period} dias: R$ ${totalValue.toFixed(2)} perdidos`,
				period,
				summary: {
					totalItems: wasteData.length,
					totalQuantity,
					totalValue,
					avgDailyWaste: totalValue / period,
					avgItemValue: wasteData.length > 0 ? totalValue / wasteData.length : 0,
				},
				categoryAnalysis,
				recommendations,
				recentWaste: wasteData.slice(0, 10), // 10 mais recentes
			}
		} catch (error) {
			return { success: false, message: `Erro ao gerar relatório: ${error}` }
		}
	},
}
