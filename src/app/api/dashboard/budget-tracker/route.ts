import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const searchParams = request.nextUrl.searchParams
		const monthlyBudget = parseFloat(searchParams.get("budget") || "1500") // Default 1500

		const now = new Date()
		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
		const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
		const daysInMonth = currentMonthEnd.getDate()
		const currentDay = now.getDate()
		const daysLeft = daysInMonth - currentDay

		// Get this month's purchases
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

		// Calculate total spent this month
		const spent = thisMonthPurchases.reduce((total, purchase) => 
			total + purchase.items.reduce((sum, item) => sum + item.totalPrice, 0), 0
		)

		const remaining = Math.max(0, monthlyBudget - spent)
		const percentage = spent > 0 ? (spent / monthlyBudget) * 100 : 0
		const dailyAverage = spent / currentDay
		const projectedSpending = dailyAverage * daysInMonth

		// Calculate recommended daily budget for remaining days
		const recommendedDailyBudget = daysLeft > 0 ? remaining / daysLeft : 0

		return NextResponse.json({
			monthly: monthlyBudget,
			spent,
			remaining,
			percentage,
			daysLeft,
			dailyAverage,
			projectedSpending,
			recommendedDailyBudget,
			currentDay,
			daysInMonth,
		})
	} catch (error) {
		console.error("Erro ao buscar dados do orçamento:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}