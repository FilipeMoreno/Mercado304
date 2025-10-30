import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth-server"

// GET /api/budgets/[id] - Buscar orçamento específico
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const session = await getSession()
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const budget = await prisma.budget.findUnique({
			where: { id: resolvedParams.id },
		})

		if (!budget) {
			return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 })
		}

		// Calcular gastos
		let spent = 0
		let target: any = null
		let purchases: any[] = []

		if (budget.type === "CATEGORY") {
			const category = await prisma.category.findUnique({
				where: { id: budget.targetId },
			})

			if (category) {
				target = {
					id: category.id,
					name: category.name,
					type: "category" as const,
				}

				const items = await prisma.purchaseItem.findMany({
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
					include: {
						purchase: {
							include: {
								market: true,
							},
						},
						product: true,
					},
					orderBy: {
						purchase: {
							purchaseDate: "desc",
						},
					},
				})

				spent = items.reduce((sum, item) => sum + item.finalPrice, 0)
				purchases = items.map((item) => ({
					id: item.id,
					productName: item.productName || item.product?.name,
					quantity: item.quantity,
					finalPrice: item.finalPrice,
					purchaseDate: item.purchase.purchaseDate,
					marketName: item.purchase.market?.name,
				}))
			}
		} else if (budget.type === "MARKET") {
			const market = await prisma.market.findUnique({
				where: { id: budget.targetId },
			})

			if (market) {
				target = {
					id: market.id,
					name: market.name,
					type: "market" as const,
				}

				const marketPurchases = await prisma.purchase.findMany({
					where: {
						marketId: budget.targetId,
						purchaseDate: {
							gte: budget.startDate,
							lte: budget.endDate,
						},
					},
					include: {
						market: true,
						items: true,
					},
					orderBy: {
						purchaseDate: "desc",
					},
				})

				spent = marketPurchases.reduce((sum, p) => sum + p.finalAmount, 0)
				purchases = marketPurchases.map((p) => ({
					id: p.id,
					itemCount: p.items.length,
					finalAmount: p.finalAmount,
					purchaseDate: p.purchaseDate,
					marketName: p.market?.name,
				}))
			}
		} else if (budget.type === "PRODUCT") {
			const product = await prisma.product.findUnique({
				where: { id: budget.targetId },
				include: {
					brand: true,
					category: true,
				},
			})

			if (product) {
				target = {
					id: product.id,
					name: product.name,
					type: "product" as const,
					brand: product.brand?.name,
					category: product.category?.name,
				}

				const items = await prisma.purchaseItem.findMany({
					where: {
						productId: budget.targetId,
						purchase: {
							purchaseDate: {
								gte: budget.startDate,
								lte: budget.endDate,
							},
						},
					},
					include: {
						purchase: {
							include: {
								market: true,
							},
						},
					},
					orderBy: {
						purchase: {
							purchaseDate: "desc",
						},
					},
				})

				spent = items.reduce((sum, item) => sum + item.finalPrice, 0)
				purchases = items.map((item) => ({
					id: item.id,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					finalPrice: item.finalPrice,
					purchaseDate: item.purchase.purchaseDate,
					marketName: item.purchase.market?.name,
				}))
			}
		}

		const remaining = budget.limitAmount - spent
		const percentage = (spent / budget.limitAmount) * 100
		const isOverBudget = spent > budget.limitAmount

		return NextResponse.json({
			...budget,
			spent,
			remaining,
			percentage,
			isOverBudget,
			target,
			purchases,
		})
	} catch (error) {
		console.error("[BUDGET_GET]", error)
		return NextResponse.json({ error: "Erro ao buscar orçamento" }, { status: 500 })
	}
}

// PATCH /api/budgets/[id] - Atualizar orçamento
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const session = await getSession()
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const body = await request.json()

		const budget = await prisma.budget.update({
			where: { id: resolvedParams.id },
			data: {
				...body,
				limitAmount: body.limitAmount ? Number.parseFloat(body.limitAmount) : undefined,
				alertAt: body.alertAt ? Number.parseFloat(body.alertAt) : undefined,
				startDate: body.startDate ? new Date(body.startDate) : undefined,
				endDate: body.endDate ? new Date(body.endDate) : undefined,
			},
		})

		return NextResponse.json(budget)
	} catch (error) {
		console.error("[BUDGET_PATCH]", error)
		return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 500 })
	}
}

// DELETE /api/budgets/[id] - Deletar orçamento
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const session = await getSession()
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		await prisma.budget.delete({
			where: { id: resolvedParams.id },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("[BUDGET_DELETE]", error)
		return NextResponse.json({ error: "Erro ao deletar orçamento" }, { status: 500 })
	}
}
