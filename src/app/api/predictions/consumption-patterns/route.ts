import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function getSeason(month: number): "summer" | "autumn" | "winter" | "spring" {
	if (month >= 12 || month <= 2) return "summer" // Verão (Dez-Fev)
	if (month >= 3 && month <= 5) return "autumn" // Outono (Mar-Mai)
	if (month >= 6 && month <= 8) return "winter" // Inverno (Jun-Ago)
	return "spring" // Primavera (Set-Nov)
}

export async function GET() {
	try {
		// Analisar últimos 6 meses para padrões mais precisos
		const sixMonthsAgo = new Date()
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

		// Buscar todas as compras dos últimos 6 meses
		const purchases = await prisma.purchaseItem.findMany({
			where: {
				purchase: {
					purchaseDate: { gte: sixMonthsAgo },
				},
				productId: { not: null },
			},
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					},
				},
				purchase: true,
			},
			orderBy: {
				purchase: {
					purchaseDate: "asc",
				},
			},
		})

		// Agrupar por produto
		const productConsumption = purchases.reduce((acc: any, item) => {
			const productId = item.productId!
			if (!acc[productId]) {
				acc[productId] = {
					product: item.product,
					purchases: [],
					totalQuantity: 0,
					avgQuantityPerPurchase: 0,
				}
			}

			acc[productId].purchases.push({
				date: item.purchase.purchaseDate,
				quantity: item.quantity,
				daysSinceEpoch: Math.floor(item.purchase.purchaseDate.getTime() / (1000 * 60 * 60 * 24)),
			})
			acc[productId].totalQuantity += item.quantity

			return acc
		}, {})

		// Calcular padrões para cada produto
		const patterns = Object.values(productConsumption)
			.map((product: any) => {
				const purchases = product.purchases.sort((a: any, b: any) => a.daysSinceEpoch - b.daysSinceEpoch)

				if (purchases.length < 2) return null

				// Calcular intervalos entre compras
				const intervals = []
				for (let i = 1; i < purchases.length; i++) {
					intervals.push(purchases[i].daysSinceEpoch - purchases[i - 1].daysSinceEpoch)
				}

				// Estatísticas do produto
				const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
				const avgQuantity = product.totalQuantity / purchases.length
				const lastPurchase = purchases[purchases.length - 1]
				const daysSinceLastPurchase = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) - lastPurchase.daysSinceEpoch

				// Predição: próxima compra esperada
				const nextPurchaseExpected = lastPurchase.daysSinceEpoch + avgInterval
				const daysUntilNextPurchase = nextPurchaseExpected - Math.floor(Date.now() / (1000 * 60 * 60 * 24))

				// Calcular urgência (0-100)
				const urgencyFactor = Math.max(0, (avgInterval - daysSinceLastPurchase) / avgInterval)
				let urgency = Math.round(urgencyFactor * 100)

				// Aprimoramento 1: Ajustar urgência com base na sazonalidade
				const currentMonth = new Date().getMonth() + 1
				const lastPurchaseMonth = new Date(lastPurchase.date).getMonth() + 1
				const currentSeason = getSeason(currentMonth)
				const lastPurchaseSeason = getSeason(lastPurchaseMonth)

				// Se a última compra foi em uma estação diferente da atual, a confiança pode ser menor.
				if (currentSeason !== lastPurchaseSeason) {
					urgency = Math.max(0, urgency - 20) // Reduz a urgência se a compra foi em outra estação
				} else {
					urgency = Math.min(100, urgency + 10) // Aumenta a urgência se a compra foi na mesma estação
				}

				// Aprimoramento 2: Considerar o estoque mínimo para produtos com controle de estoque
				if (product.product.hasStock && product.product.minStock) {
					// Para simplificar, assumimos que o estoque atual é 0 para o cálculo da lista
					// Uma implementação mais completa exigiria verificar o estoque real
					urgency = Math.min(100, urgency + 25) // Aumenta a urgência se o produto tem controle de estoque
				}

				// Considerar produto para reposição se:
				// 1. Comprou pelo menos 3 vezes
				// 2. Tem padrão regular (variação < 50% do intervalo médio)
				// 3. Está próximo do tempo esperado da próxima compra
				const isRegularPurchase = purchases.length >= 3
				const hasRegularPattern =
					intervals.length > 0 && (Math.max(...intervals) - Math.min(...intervals)) / avgInterval < 0.5
				const isNearRepurchase = daysUntilNextPurchase <= 7 && daysUntilNextPurchase >= -3

				return {
					product: product.product,
					consumption: {
						totalPurchases: purchases.length,
						avgIntervalDays: Math.round(avgInterval),
						avgQuantityPerPurchase: avgQuantity,
						lastPurchaseDate: lastPurchase.date,
						daysSinceLastPurchase,
						nextPurchaseExpected: new Date(nextPurchaseExpected * 24 * 60 * 60 * 1000),
						daysUntilNextPurchase: Math.round(daysUntilNextPurchase),
						urgency,
						isRegularPurchase,
						hasRegularPattern,
						isNearRepurchase,
						shouldReplenish: isRegularPurchase && hasRegularPattern && isNearRepurchase,
						confidence: isRegularPurchase && hasRegularPattern ? Math.min(95, 60 + purchases.length * 5) : 30,
					},
				}
			})
			.filter((pattern) => pattern !== null)

		// Ordenar por urgência
		const sortedPatterns = patterns.sort((a: any, b: any) => b.consumption.urgency - a.consumption.urgency)

		// Produtos que precisam de reposição
		const replenishmentAlerts = sortedPatterns.filter((p: any) => p.consumption.shouldReplenish)

		// Estatísticas gerais
		const stats = {
			totalProductsAnalyzed: patterns.length,
			productsWithRegularPattern: patterns.filter((p: any) => p.consumption.hasRegularPattern).length,
			replenishmentAlertsCount: replenishmentAlerts.length,
			avgConsumptionInterval:
				patterns.length > 0
					? Math.round(
							patterns.reduce((sum: number, p: any) => sum + p.consumption.avgIntervalDays, 0) / patterns.length,
						)
					: 0,
		}

		return NextResponse.json({
			patterns: sortedPatterns.slice(0, 20), // Top 20 produtos
			replenishmentAlerts,
			stats,
			generatedAt: new Date(),
		})
	} catch (error) {
		console.error("Erro ao analisar padrões de consumo:", error)
		return NextResponse.json({ error: "Erro ao analisar padrões de consumo" }, { status: 500 })
	}
}
