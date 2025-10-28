import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-server"
import { BudgetType } from "@/types"

// GET /api/budgets - Listar orçamentos de controle de gastos
export async function GET(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const type = searchParams.get("type") as BudgetType | null
		const period = searchParams.get("period")
		const isActive = searchParams.get("isActive")

		const where: any = {}

		if (type) where.type = type
		if (period) where.period = period
		if (isActive !== null) where.isActive = isActive === "true"

		const budgets = await prisma.budget.findMany({
			where,
			orderBy: {
				createdAt: "desc",
			},
		})

		// Calcular gastos para cada orçamento
		const budgetsWithSpent = await Promise.all(
			budgets.map(async (budget) => {
				let spent = 0
				let target: any = null

				// Calcular gastos com base no tipo
				if (budget.type === "CATEGORY") {
					// Buscar categoria
					const category = await prisma.category.findUnique({
						where: { id: budget.targetId },
					})

					if (category) {
						target = {
							id: category.id,
							name: category.name,
							type: "category" as const,
						}

						// Buscar compras da categoria no período
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
					}
				} else if (budget.type === "MARKET") {
					// Buscar mercado
					const market = await prisma.market.findUnique({
						where: { id: budget.targetId },
					})

					if (market) {
						target = {
							id: market.id,
							name: market.name,
							type: "market" as const,
						}

						// Buscar compras do mercado no período
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
					}
				} else if (budget.type === "PRODUCT") {
					// Buscar produto
					const product = await prisma.product.findUnique({
						where: { id: budget.targetId },
					})

					if (product) {
						target = {
							id: product.id,
							name: product.name,
							type: "product" as const,
						}

						// Buscar compras do produto no período
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
				}

				const remaining = budget.limitAmount - spent
				const percentage = (spent / budget.limitAmount) * 100
				const isOverBudget = spent > budget.limitAmount

				return {
					...budget,
					spent,
					remaining,
					percentage,
					isOverBudget,
					target,
				}
			}),
		)

		return NextResponse.json({ budgets: budgetsWithSpent })
	} catch (error) {
		console.error("[BUDGETS_GET]", error)
		return NextResponse.json({ error: "Erro ao buscar orçamentos" }, { status: 500 })
	}
}

// POST /api/budgets - Criar novo orçamento de controle
export async function POST(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const body = await request.json()
		const { name, description, type, targetId, limitAmount, period, startDate, endDate, alertAt } = body

		// Validações
		if (!name || !type || !targetId || !limitAmount || !period || !startDate || !endDate) {
			return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
		}

		// Verificar se o alvo existe
		if (type === "CATEGORY") {
			const category = await prisma.category.findUnique({ where: { id: targetId } })
			if (!category) {
				return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
			}
		} else if (type === "MARKET") {
			const market = await prisma.market.findUnique({ where: { id: targetId } })
			if (!market) {
				return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })
			}
		} else if (type === "PRODUCT") {
			const product = await prisma.product.findUnique({ where: { id: targetId } })
			if (!product) {
				return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
			}
		}

		// Criar orçamento
		const budget = await prisma.budget.create({
			data: {
				id: `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
				name,
				description,
				type,
				targetId,
				limitAmount: Number.parseFloat(limitAmount),
				period,
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				alertAt: alertAt ? Number.parseFloat(alertAt) : 0.9,
				isActive: true,
			},
		})

		return NextResponse.json(budget, { status: 201 })
	} catch (error) {
		console.error("[BUDGETS_POST]", error)
		return NextResponse.json({ error: "Erro ao criar orçamento" }, { status: 500 })
	}
}
