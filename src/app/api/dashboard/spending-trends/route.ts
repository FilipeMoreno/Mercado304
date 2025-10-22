import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const now = new Date()
		const currentWeekStart = new Date(now)
		currentWeekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
		currentWeekStart.setHours(0, 0, 0, 0)

		const lastWeekStart = new Date(currentWeekStart)
		lastWeekStart.setDate(currentWeekStart.getDate() - 7)
		const lastWeekEnd = new Date(currentWeekStart)
		lastWeekEnd.setSeconds(-1)

		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
		const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

		// This week spending
		const thisWeekPurchases = await prisma.purchase.findMany({
			where: {
				createdAt: {
					gte: currentWeekStart,
					lte: now,
				},
			},
			include: {
				items: true,
			},
		})

		// Last week spending  
		const lastWeekPurchases = await prisma.purchase.findMany({
			where: {
				createdAt: {
					gte: lastWeekStart,
					lt: lastWeekEnd,
				},
			},
			include: {
				items: true,
			},
		})

		// This month spending
		const thisMonthPurchases = await prisma.purchase.findMany({
			where: {
				createdAt: {
					gte: currentMonthStart,
					lte: now,
				},
			},
			include: {
				items: true,
			},
		})

		// Last month spending
		const lastMonthPurchases = await prisma.purchase.findMany({
			where: {
				createdAt: {
					gte: lastMonthStart,
					lt: lastMonthEnd,
				},
			},
			include: {
				items: true,
			},
		})

		// Calculate totals
		const thisWeek = thisWeekPurchases.reduce((total, purchase) => 
			total + purchase.items.reduce((sum, item) => sum + item.totalPrice, 0), 0
		)

		const lastWeek = lastWeekPurchases.reduce((total, purchase) => 
			total + purchase.items.reduce((sum, item) => sum + item.totalPrice, 0), 0
		)

		const thisMonth = thisMonthPurchases.reduce((total, purchase) => 
			total + purchase.items.reduce((sum, item) => sum + item.totalPrice, 0), 0
		)

		const lastMonth = lastMonthPurchases.reduce((total, purchase) => 
			total + purchase.items.reduce((sum, item) => sum + item.totalPrice, 0), 0
		)

		// Calculate changes
		const weeklyChange = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0
		const monthlyChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0

		// Determine trend
		let trend: "up" | "down" | "stable" = "stable"
		if (monthlyChange > 5) trend = "up"
		else if (monthlyChange < -5) trend = "down"

		return NextResponse.json({
			thisWeek,
			lastWeek,
			thisMonth,
			lastMonth,
			trend,
			weeklyChange,
			monthlyChange,
		})
	} catch (error) {
		console.error("Erro ao buscar tendências de gastos:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}