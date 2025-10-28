import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { QuoteComparison } from "@/types"

// POST /api/quotes/compare - Comparar múltiplos orçamentos
export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { quoteIds } = body

		if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length < 2) {
			return NextResponse.json(
				{ error: "É necessário fornecer ao menos 2 orçamentos para comparar" },
				{ status: 400 },
			)
		}

		// Buscar orçamentos com seus itens
		const quotes = await prisma.quote.findMany({
			where: {
				id: { in: quoteIds },
			},
			include: {
				market: true,
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		if (quotes.length < 2) {
			return NextResponse.json(
				{ error: "Orçamentos não encontrados" },
				{ status: 404 },
			)
		}

		// Encontrar orçamento mais barato e mais caro
		const cheapest = quotes.reduce((prev, current) =>
			prev.finalEstimated < current.finalEstimated ? prev : current,
		)

		const mostExpensive = quotes.reduce((prev, current) =>
			prev.finalEstimated > current.finalEstimated ? prev : current,
		)

		const savings = mostExpensive.finalEstimated - cheapest.finalEstimated
		const savingsPercentage =
			mostExpensive.finalEstimated > 0
				? (savings / mostExpensive.finalEstimated) * 100
				: 0

		// Comparar itens por produto
		const itemsByProduct = new Map<
			string,
			{
				productName: string
				prices: Array<{
					quoteId: string
					quoteName: string
					price: number
				}>
			}
		>()

		for (const quote of quotes) {
			for (const item of quote.items) {
				const key = item.productId || item.productName
				if (!itemsByProduct.has(key)) {
					itemsByProduct.set(key, {
						productName: item.productName,
						prices: [],
					})
				}

				itemsByProduct.get(key)?.prices.push({
					quoteId: quote.id,
					quoteName: quote.name,
					price: item.finalPrice,
				})
			}
		}

		// Calcular item mais barato e mais caro para cada produto
		const itemComparison = Array.from(itemsByProduct.values()).map(
			(item) => {
				const cheapestItem = item.prices.reduce((prev, current) =>
					prev.price < current.price ? prev : current,
				)

				const mostExpensiveItem = item.prices.reduce((prev, current) =>
					prev.price > current.price ? prev : current,
				)

				return {
					productName: item.productName,
					prices: item.prices,
					cheapest: {
						quoteId: cheapestItem.quoteId,
						price: cheapestItem.price,
					},
					mostExpensive: {
						quoteId: mostExpensiveItem.quoteId,
						price: mostExpensiveItem.price,
					},
				}
			},
		)

				const comparison: QuoteComparison = {
			quotes: quotes as any,
			comparison: {
				cheapest: cheapest as any,
				mostExpensive: mostExpensive as any,
				savings,
				savingsPercentage,
				itemComparison,
			},
		}

		return NextResponse.json(comparison)
	} catch (error) {
		console.error("[BUDGETS_COMPARE]", error)
		return NextResponse.json(
			{ error: "Erro ao comparar orçamentos" },
			{ status: 500 },
		)
	}
}
