import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-server"

// GET /api/budgets/stats - Estatísticas de orçamentos
export async function GET(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const budgets = await prisma.budget.findMany({
			where: {
				isActive: true,
			},
		})

		// Calcular gastos para todos os budgets
		const budgetsWithSpent = await Promise.all(
			budgets.map(async (budget) => {
				let spent = 0

				if (budget.type === "CATEGORY") {
					const purchases = await prisma.purchaseItem.findMany({
						where: {
							product: {
								categoryId: budget.targetId,
							},
							purchase: {
								purchaseDate: {
									gte: budget.startDate,
									lte: budget.endDate,
								},
							},
						},
					})
					spent = purchases.reduce((sum, item) => sum + item.finalPrice, 0)
				} else if (budget.type === "MARKET") {
					const purchases = await prisma.purchase.findMany({
						where: {
							marketId: budget.targetId,
							purchaseDate: {
								gte: budget.startDate,
								lte: budget.endDate,
							},
						},
					})
					spent = purchases.reduce((sum, p) => sum + p.finalAmount, 0)
				} else if (budget.type === "PRODUCT") {
					const purchases = await prisma.purchaseItem.findMany({
						where: {
							productId: budget.targetId,
							purchase: {
								purchaseDate: {
									gte: budget.startDate,
									lte: budget.endDate,
								},
							},
						},
					})
					spent = purchases.reduce((sum, item) => sum + item.finalPrice, 0)
				}

				const percentage = (spent / budget.limitAmount) * 100
				const isOverBudget = spent > budget.limitAmount
				const isNearLimit = percentage >= budget.alertAt * 100

				return {
					...budget,
					spent,
					percentage,
					isOverBudget,
					isNearLimit,
				}
			}),
		)

		// Estatísticas gerais
		const totalBudgets = budgetsWithSpent.length
		const totalLimit = budgetsWithSpent.reduce((sum, b) => sum + b.limitAmount, 0)
		const totalSpent = budgetsWithSpent.reduce((sum, b) => sum + b.spent, 0)
		const totalRemaining = totalLimit - totalSpent

		// Contar budgets por status
		const overBudget = budgetsWithSpent.filter((b) => b.isOverBudget).length
		const nearLimit = budgetsWithSpent.filter((b) => b.isNearLimit && !b.isOverBudget).length
		const healthy = budgetsWithSpent.filter((b) => !b.isNearLimit && !b.isOverBudget).length

		// Por tipo
		const byType = budgetsWithSpent.reduce(
			(acc, budget) => {
				if (!acc[budget.type]) {
					acc[budget.type] = {
						count: 0,
						totalLimit: 0,
						totalSpent: 0,
						overBudget: 0,
					}
				}
				acc[budget.type].count += 1
				acc[budget.type].totalLimit += budget.limitAmount
				acc[budget.type].totalSpent += budget.spent
				if (budget.isOverBudget) acc[budget.type].overBudget += 1
				return acc
			},
			{} as Record<string, { count: number; totalLimit: number; totalSpent: number; overBudget: number }>,
		)

		// Budgets em alerta (acima do limite ou próximo dele)
		const alerts = budgetsWithSpent
			.filter((b) => b.isOverBudget || b.isNearLimit)
			.sort((a, b) => b.percentage - a.percentage)
			.slice(0, 10)

		return NextResponse.json({
			overview: {
				totalBudgets,
				totalLimit,
				totalSpent,
				totalRemaining,
				percentageUsed: (totalSpent / totalLimit) * 100,
			},
			status: {
				healthy,
				nearLimit,
				overBudget,
			},
			byType,
			alerts: alerts.map((b) => ({
				id: b.id,
				name: b.name,
				type: b.type,
				limitAmount: b.limitAmount,
				spent: b.spent,
				percentage: b.percentage,
				isOverBudget: b.isOverBudget,
			})),
		})
	} catch (error) {
		console.error("[BUDGETS_STATS]", error)
		return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
	}
}
