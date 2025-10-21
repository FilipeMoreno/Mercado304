import { endOfMonth, startOfMonth, subMonths } from "date-fns"
import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: NextRequest) {
	try {
		const now = new Date()
		const currentMonthStart = startOfMonth(now)
		const currentMonthEnd = endOfMonth(now)
		const previousMonthStart = startOfMonth(subMonths(now, 1))
		const previousMonthEnd = endOfMonth(subMonths(now, 1))

		// Buscar dados de desperdício do mês atual
		const currentMonthWaste = await prisma.wasteRecord.findMany({
			where: {
				wasteDate: {
					gte: currentMonthStart,
					lte: currentMonthEnd,
				},
			},
			orderBy: {
				wasteDate: "desc",
			},
		})

		// Buscar dados do mês anterior para comparação
		const previousMonthWaste = await prisma.wasteRecord.findMany({
			where: {
				wasteDate: {
					gte: previousMonthStart,
					lte: previousMonthEnd,
				},
			},
		})

		// Calcular estatísticas
		const totalWasteItems = currentMonthWaste.length
		const totalWasteValue = currentMonthWaste.reduce((sum, waste) => {
			return sum + (waste.totalValue || 0)
		}, 0)

		const previousMonthItems = previousMonthWaste.length
		const wasteTrend = totalWasteItems > previousMonthItems ? "up" : "down"

		// Encontrar categoria mais desperdiçada
		const categoryWaste = currentMonthWaste.reduce(
			(acc, waste) => {
				const categoryName = waste.category || "Sem categoria"
				acc[categoryName] = (acc[categoryName] || 0) + 1
				return acc
			},
			{} as Record<string, number>,
		)

		const topWasteCategory = Object.entries(categoryWaste).sort(([, a], [, b]) => b - a)[0]?.[0]

		// Histórico recente (últimos 20 registros)
		const recentWaste = currentMonthWaste.slice(0, 20).map((waste) => ({
			productName: waste.productName,
			brand: waste.brand,
			category: waste.category,
			quantity: waste.quantity,
			unit: waste.unit,
			wasteReason: waste.wasteReason,
			value: waste.totalValue,
			date: waste.wasteDate,
			notes: waste.notes,
		}))

		// Estatísticas por motivo
		const wasteByReason = currentMonthWaste.reduce(
			(acc, waste) => {
				const reason = waste.wasteReason || "Não especificado"
				acc[reason] = (acc[reason] || 0) + 1
				return acc
			},
			{} as Record<string, number>,
		)

		// Estatísticas por categoria
		const wasteByCategoryStats = Object.entries(categoryWaste)
			.map(([category, count]) => ({
				category,
				count,
				percentage: ((count / totalWasteItems) * 100).toFixed(1),
			}))
			.sort((a, b) => b.count - a.count)

		// Desperdício por semana do mês atual
		const wasteByWeek = Array.from({ length: 4 }, (_, weekIndex) => {
			const weekStart = new Date(currentMonthStart)
			weekStart.setDate(weekStart.getDate() + weekIndex * 7)
			const weekEnd = new Date(weekStart)
			weekEnd.setDate(weekEnd.getDate() + 6)

			const weekWaste = currentMonthWaste.filter((waste) => {
				const wasteDate = new Date(waste.wasteDate)
				return wasteDate >= weekStart && wasteDate <= weekEnd
			})

			return {
				week: `Sem ${weekIndex + 1}`,
				items: weekWaste.length,
				value: weekWaste.reduce((sum, waste) => sum + (waste.totalValue || 0), 0),
			}
		})

		const response = {
			totalWasteItems,
			totalWasteValue,
			topWasteCategory,
			wasteTrend,
			recentWaste,
			wasteByReason: Object.entries(wasteByReason)
				.map(([reason, count]) => ({
					reason,
					count,
					percentage: ((count / totalWasteItems) * 100).toFixed(1),
				}))
				.sort((a, b) => b.count - a.count),
			wasteByCategory: wasteByCategoryStats,
			wasteByWeek,
			comparison: {
				currentMonth: totalWasteItems,
				previousMonth: previousMonthItems,
				difference: totalWasteItems - previousMonthItems,
				percentageChange:
					previousMonthItems > 0
						? (((totalWasteItems - previousMonthItems) / previousMonthItems) * 100).toFixed(1)
						: "0",
			},
		}

		return NextResponse.json(response)
	} catch (error) {
		console.error("Erro ao buscar estatísticas de desperdício:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
