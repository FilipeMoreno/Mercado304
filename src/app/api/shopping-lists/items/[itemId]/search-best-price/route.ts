// src/app/api/shopping-lists/items/[itemId]/search-best-price/route.ts
import { NextResponse } from "next/server"
import { getAllProductPrices } from "@/lib/price-utils"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: { itemId: string } }) {
	try {
		const { itemId } = params

		// Buscar o item da lista de compras
		const item = await prisma.shoppingListItem.findUnique({
			where: { id: itemId },
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					},
				},
			},
		})

		if (!item) {
			return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
		}

		// Se o item está vinculado a um produto
		if (item.productId) {
			// Buscar todos os preços deste produto em todos os mercados
			const allPrices = await getAllProductPrices(item.productId)

			// Filtrar apenas os que têm preço e ordenar por preço
			const pricesWithValues = allPrices
				.filter((p) => p.price !== null && p.price !== undefined)
				.sort((a, b) => (a.price || 0) - (b.price || 0))

			// Buscar também os preços mais recentes de cada mercado com mais detalhes
			const detailedPrices = await Promise.all(
				pricesWithValues.map(async (priceInfo) => {
					if (!item.productId) {
						return {
							marketId: priceInfo.marketId,
							marketName: priceInfo.marketName,
							location: priceInfo.location,
							price: priceInfo.price || 0,
							lastUpdate: priceInfo.lastUpdate || new Date().toISOString(),
							source: "unknown",
						}
					}

					// Buscar o último registro de compra
					const lastPurchase = await prisma.purchaseItem.findFirst({
						where: {
							productId: item.productId,
							purchase: {
								marketId: priceInfo.marketId,
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

					// Buscar o último registro manual de preço
					const lastPriceRecord = await prisma.priceRecord.findFirst({
						where: {
							productId: item.productId,
							marketId: priceInfo.marketId,
						},
						include: {
							market: true,
						},
						orderBy: {
							recordDate: "desc",
						},
					})

					// Determinar qual é o mais recente
					let source = "unknown"
					let date = priceInfo.lastUpdate || new Date().toISOString()

					if (lastPurchase && lastPriceRecord) {
						const purchaseDate = new Date(lastPurchase.purchase.purchaseDate)
						const recordDate = new Date(lastPriceRecord.recordDate)
						source = purchaseDate >= recordDate ? "purchase" : "record"
						date = purchaseDate >= recordDate ? lastPurchase.purchase.purchaseDate : lastPriceRecord.recordDate
					} else if (lastPurchase) {
						source = "purchase"
						date = lastPurchase.purchase.purchaseDate
					} else if (lastPriceRecord) {
						source = "record"
						date = lastPriceRecord.recordDate
					}

					return {
						marketId: priceInfo.marketId,
						marketName: priceInfo.marketName,
						location: priceInfo.location,
						price: priceInfo.price || 0,
						lastUpdate: date,
						source,
					}
				}),
			)

			return NextResponse.json({
				type: "product",
				productName: item.product?.name || "",
				productId: item.productId,
				brand: item.product?.brand?.name,
				category: item.product?.category?.name,
				prices: detailedPrices,
				lowestPrice: detailedPrices.length > 0 ? detailedPrices[0] : null,
				averagePrice:
					detailedPrices.length > 0
						? detailedPrices.reduce((sum, p) => sum + p.price, 0) / detailedPrices.length
						: null,
			})
		} else {
			// Item é texto livre - retornar informações para buscar no Nota Paraná
			return NextResponse.json({
				type: "text",
				searchTerm: item.productName,
				brand: item.brand,
				category: item.category,
				message: "Use a API do Nota Paraná para buscar este produto",
			})
		}
	} catch (error) {
		console.error("Erro ao buscar menor preço:", error)
		return NextResponse.json({ error: "Erro ao buscar menor preço" }, { status: 500 })
	}
}
