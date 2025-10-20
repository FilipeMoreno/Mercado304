// src/app/api/shopping-lists/[id]/optimize-route/route.ts

import { PrismaClient } from "@prisma/client"
import { type NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const listId = params.id

		// Buscar a lista com itens e suas relações
		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: listId },
			include: {
				items: {
					include: {
						product: {
							include: {
								priceRecords: {
									include: {
										market: true,
									},
									orderBy: {
										recordDate: "desc",
									},
								},
							},
						},
					},
				},
			},
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista de compras não encontrada" }, { status: 404 })
		}

		// Buscar todos os mercados
		const markets = await prisma.market.findMany()

		// Otimizar roteiro baseado nos preços históricos
		const optimizedRoute = optimizeShoppingRoute(shoppingList.items, markets)

		return NextResponse.json({
			listName: shoppingList.name,
			optimizedRoute,
			totalEstimatedSavings: optimizedRoute.reduce((sum, market) => sum + market.estimatedSavings, 0),
			summary: {
				totalMarkets: optimizedRoute.length,
				totalItems: shoppingList.items.length,
				itemsDistributed: optimizedRoute.reduce((sum, market) => sum + market.items.length, 0),
			},
		})
	} catch (error) {
		console.error("Erro ao otimizar roteiro:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

interface ShoppingListItem {
	id: string
	quantity: number
	estimatedPrice?: number | null
	product?: {
		id: string
		name: string
		unit: string
		priceRecords: Array<{
			id: string
			price: number
			recordDate: Date
			market: {
				id: string
				name: string
				location?: string | null
			}
		}>
	} | null
}

interface Market {
	id: string
	name: string
	location?: string | null
}

interface OptimizedMarket {
	marketId: string
	marketName: string
	marketLocation?: string | null
	items: Array<{
		itemId: string
		productId: string
		productName: string
		quantity: number
		bestPrice: number
		estimatedTotal: number
		averagePrice?: number
		savings?: number
	}>
	totalCost: number
	estimatedSavings: number
	itemCount: number
}

function optimizeShoppingRoute(items: ShoppingListItem[], markets: Market[]): OptimizedMarket[] {
	const marketItems: { [marketId: string]: OptimizedMarket } = {}

	// Inicializar estrutura dos mercados
	markets.forEach((market) => {
		marketItems[market.id] = {
			marketId: market.id,
			marketName: market.name,
			marketLocation: market.location,
			items: [],
			totalCost: 0,
			estimatedSavings: 0,
			itemCount: 0,
		}
	})

	// Para cada item, encontrar o melhor mercado
	items.forEach((item) => {
		if (!item.product || !item.product.priceRecords.length) {
			return // Pular itens sem produto ou sem histórico de preços
		}

		// Calcular preço médio mais recente por mercado
		const marketPrices: {
			[marketId: string]: { price: number; recordCount: number }
		} = {}

		item.product.priceRecords.forEach((record) => {
			const marketId = record.market.id
			if (!marketPrices[marketId]) {
				marketPrices[marketId] = { price: 0, recordCount: 0 }
			}
			marketPrices[marketId].price += record.price
			marketPrices[marketId].recordCount += 1
		})

		// Calcular preços médios
		Object.keys(marketPrices).forEach((marketId) => {
			marketPrices[marketId].price = marketPrices[marketId].price / marketPrices[marketId].recordCount
		})

		// Encontrar o mercado com o menor preço
		let bestMarketId: string | null = null
		let bestPrice = Infinity
		let averagePrice = 0
		let priceCount = 0

		Object.entries(marketPrices).forEach(([marketId, data]) => {
			averagePrice += data.price
			priceCount += 1

			if (data.price < bestPrice) {
				bestPrice = data.price
				bestMarketId = marketId
			}
		})

		averagePrice = priceCount > 0 ? averagePrice / priceCount : 0

		if (bestMarketId && marketItems[bestMarketId]) {
			const estimatedTotal = item.quantity * bestPrice
			const savings = averagePrice > 0 ? (averagePrice - bestPrice) * item.quantity : 0

			marketItems[bestMarketId].items.push({
				itemId: item.id,
				productId: item.product.id,
				productName: item.product.name,
				quantity: item.quantity,
				bestPrice,
				estimatedTotal,
				averagePrice,
				savings,
			})

			marketItems[bestMarketId].totalCost += estimatedTotal
			marketItems[bestMarketId].estimatedSavings += savings
			marketItems[bestMarketId].itemCount += 1
		}
	})

	// Filtrar apenas mercados com itens e ordenar por economia
	return Object.values(marketItems)
		.filter((market) => market.items.length > 0)
		.sort((a, b) => b.estimatedSavings - a.estimatedSavings)
}
