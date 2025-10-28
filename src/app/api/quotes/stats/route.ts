import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/quotes/stats - Estatísticas de orçamentos
export async function GET() {
	try {
		// Buscar todos os orçamentos
		const quotes = await prisma.quote.findMany({
			include: {
				items: true,
				market: true,
			},
		})

		// Estatísticas gerais
		const totalBudgets = quotes.length
		const totalValue = quotes.reduce((sum, b) => sum + b.finalEstimated, 0)
		const averageValue = totalBudgets > 0 ? totalValue / totalBudgets : 0

		// Por status
		const byStatus = quotes.reduce(
			(acc, quote) => {
				acc[quote.status] = (acc[quote.status] || 0) + 1
				return acc
			},
			{} as Record<string, number>,
		)

		// Orçamentos convertidos vs não convertidos
		const convertedBudgets = quotes.filter((b) => b.status === "CONVERTED")
		const conversionRate =
			totalBudgets > 0 ? (convertedBudgets.length / totalBudgets) * 100 : 0

		// Total economizado (desconto)
		const totalSavings = quotes.reduce((sum, b) => sum + b.totalDiscount, 0)

		// Média de itens por orçamento
		const totalItems = quotes.reduce(
			(sum, b) => sum + (b.items?.length || 0),
			0,
		)
		const averageItems = totalBudgets > 0 ? totalItems / totalBudgets : 0

		// Orçamentos por mercado
		const byMarket = quotes.reduce(
			(acc, quote) => {
				if (quote.market) {
					const key = quote.market.id
					if (!acc[key]) {
						acc[key] = {
							marketId: quote.market.id,
							marketName: quote.market.name,
							count: 0,
							totalValue: 0,
						}
					}
					acc[key].count += 1
					acc[key].totalValue += quote.finalEstimated
				}
				return acc
			},
			{} as Record<
				string,
				{
					marketId: string
					marketName: string
					count: number
					totalValue: number
				}
			>,
		)

		// Orçamentos recentes (últimos 30 dias)
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
		const recentBudgets = quotes.filter(
			(b) => new Date(b.createdAt) >= thirtyDaysAgo,
		)

		// Tendência mensal (últimos 6 meses)
		const sixMonthsAgo = new Date()
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

		const monthlyTrend = quotes
			.filter((b) => new Date(b.createdAt) >= sixMonthsAgo)
			.reduce(
				(acc, quote) => {
					const date = new Date(quote.createdAt)
					const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

					if (!acc[monthKey]) {
						acc[monthKey] = {
							month: monthKey,
							count: 0,
							totalValue: 0,
							totalSavings: 0,
						}
					}

					acc[monthKey].count += 1
					acc[monthKey].totalValue += quote.finalEstimated
					acc[monthKey].totalSavings += quote.totalDiscount

					return acc
				},
				{} as Record<
					string,
					{
						month: string
						count: number
						totalValue: number
						totalSavings: number
					}
				>,
			)

		// Top 5 maiores orçamentos
		const topBudgets = quotes
			.sort((a, b) => b.finalEstimated - a.finalEstimated)
			.slice(0, 5)
			.map((b) => ({
				id: b.id,
				name: b.name,
				value: b.finalEstimated,
				marketName: b.market?.name,
				status: b.status,
				itemCount: b.items?.length || 0,
			}))

		// Estatísticas de conversão
		const convertedValue = convertedBudgets.reduce(
			(sum, b) => sum + b.finalEstimated,
			0,
		)
		const convertedSavings = convertedBudgets.reduce(
			(sum, b) => sum + b.totalDiscount,
			0,
		)

		// Por tipo
		const byType = quotes.reduce(
			(acc, quote) => {
				const type = quote.type || "BY_ITEMS"
				if (!acc[type]) {
					acc[type] = {
						count: 0,
						totalValue: 0,
						totalSavings: 0,
					}
				}
				acc[type].count += 1
				acc[type].totalValue += quote.finalEstimated
				acc[type].totalSavings += quote.totalDiscount
				return acc
			},
			{} as Record<
				string,
				{ count: number; totalValue: number; totalSavings: number }
			>,
		)

		return NextResponse.json({
			overview: {
				totalBudgets,
				totalValue,
				averageValue,
				totalSavings,
				averageItems,
				recentCount: recentBudgets.length,
			},
			byStatus,
			byType,
			conversion: {
				converted: convertedBudgets.length,
				total: totalBudgets,
				rate: conversionRate,
				convertedValue,
				convertedSavings,
			},
			byMarket: Object.values(byMarket).sort((a, b) => b.count - a.count),
			monthlyTrend: Object.values(monthlyTrend).sort((a, b) =>
				a.month.localeCompare(b.month),
			),
			topBudgets,
		})
	} catch (error) {
		console.error("[BUDGETS_STATS]", error)
		return NextResponse.json(
			{ error: "Erro ao buscar estatísticas de orçamentos" },
			{ status: 500 },
		)
	}
}
