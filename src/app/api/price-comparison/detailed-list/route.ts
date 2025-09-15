import { NextResponse } from "next/server"
import { getLatestPrice } from "@/lib/price-utils"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const { listId, marketIds } = await request.json()

		if (!listId || !marketIds || !Array.isArray(marketIds) || marketIds.length < 2) {
			return NextResponse.json({ error: "ID da lista e pelo menos 2 mercados são obrigatórios" }, { status: 400 })
		}

		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: listId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
		}

		const markets = await prisma.market.findMany({
			where: { id: { in: marketIds } },
		})

		if (markets.length !== marketIds.length) {
			return NextResponse.json({ error: "Um ou mais mercados não foram encontrados" }, { status: 404 })
		}

		// --- CORREÇÃO APLICADA AQUI ---
		// Mapeia e depois filtra para garantir que não há IDs nulos
		const productIds = shoppingList.items.map((item) => item.productId).filter((id): id is string => !!id)

		const productsWithPrices = await Promise.all(
			productIds.map(async (productId) => {
				const product = await prisma.product.findUnique({
					where: { id: productId },
					include: { brand: true },
				})

				const prices = await Promise.all(
					marketIds.map(async (marketId) => {
						const latestPrice = await getLatestPrice(productId, marketId)

						return {
							marketId,
							price: latestPrice?.price || null,
							lastPurchase: latestPrice?.date || null,
							source: latestPrice?.source || null,
						}
					}),
				)

				return {
					product,
					prices,
				}
			}),
		)

		const productsToCompare = productsWithPrices.map((productData) => {
			const cheapestPrice = productData.prices.reduce(
				(cheapest, current) => {
					if (current.price === null) return cheapest
					if (cheapest.price === null || current.price < cheapest.price) {
						return current
					}
					return cheapest
				},
				{ price: null as number | null, marketId: null },
			)

			// Garantir que os preços estão na mesma ordem dos marketIds
			const priceComparison = marketIds.map((marketId) => {
				const priceInfo = productData.prices.find((p) => p.marketId === marketId)!
				const saving =
					cheapestPrice.price !== null && priceInfo.price !== null ? priceInfo.price - cheapestPrice.price : 0

				return {
					...priceInfo,
					isCheapest: priceInfo.marketId === cheapestPrice.marketId,
					saving: saving > 0 ? saving : 0,
				}
			})

			return {
				product: productData.product,
				comparison: priceComparison,
			}
		})

		// Garantir que os mercados estão na mesma ordem dos marketIds enviados
		const orderedMarkets = marketIds.map((id) => {
			const market = markets.find((m) => m.id === id)
			return { id: market!.id, name: market!.name, location: market!.location }
		})

		return NextResponse.json({
			listId,
			listName: shoppingList.name,
			markets: orderedMarkets,
			products: productsToCompare,
		})
	} catch (error) {
		console.error("Erro ao realizar comparação de lista detalhada:", error)
		return NextResponse.json({ error: "Erro ao realizar comparação de lista detalhada" }, { status: 500 })
	}
}
