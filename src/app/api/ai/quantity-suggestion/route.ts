import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const { productId, listId, itemId } = await request.json()

		if (!productId || !listId || !itemId) {
			return NextResponse.json({ error: "productId, listId e itemId são obrigatórios." }, { status: 400 })
		}

		// 1. Buscar histórico de compras para o produto
		const sixMonthsAgo = new Date()
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

		const purchases = await prisma.purchaseItem.findMany({
			where: {
				productId,
				purchase: { purchaseDate: { gte: sixMonthsAgo } },
			},
			orderBy: { purchase: { purchaseDate: "asc" } },
		})

		// 2. Analisar o padrão de consumo
		if (purchases.length < 3) {
			// Precisamos de pelo menos 3 compras para um padrão minimamente confiável
			return NextResponse.json({ suggestion: null })
		}

		const intervals: number[] = []
		for (let i = 1; i < purchases.length; i++) {
			const diff =
				(new Date(purchases[i].purchase.purchaseDate).getTime() -
					new Date(purchases[i - 1].purchase.purchaseDate).getTime()) /
				(1000 * 60 * 60 * 24)
			if (diff > 0) intervals.push(diff)
		}

		const avgIntervalDays = intervals.reduce((sum, i) => sum + i, 0) / intervals.length
		const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0)
		const avgQuantityPerPurchase = Math.ceil(totalQuantity / purchases.length)

		const lastPurchaseDate = new Date(purchases[purchases.length - 1].purchase.purchaseDate)
		const daysSinceLastPurchase = Math.floor((Date.now() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))

		if (daysSinceLastPurchase > avgIntervalDays * 0.8 && avgQuantityPerPurchase > 1) {
			const currentItem = await prisma.shoppingListItem.findUnique({
				where: { id: itemId },
			})

			if (!currentItem || currentItem.quantity >= avgQuantityPerPurchase) {
				return NextResponse.json({ suggestion: null })
			}

			return NextResponse.json({
				suggestion: {
					message: `Você costuma comprar ${avgQuantityPerPurchase} unidades deste produto a cada ${Math.round(avgIntervalDays)} dias. Que tal atualizar a quantidade para não faltar?`,
					actionLabel: `Sim, atualizar para ${avgQuantityPerPurchase}`,
					payload: {
						itemId: itemId,
						newQuantity: avgQuantityPerPurchase,
					},
				},
			})
		}

		return NextResponse.json({ suggestion: null })
	} catch (error) {
		return handleApiError(error)
	}
}
