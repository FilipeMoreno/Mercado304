import { prisma } from "@/lib/prisma"

/**
 * Busca o preço mais recente de um produto em um mercado específico
 * Considera tanto compras quanto registros de preços manuais
 */
export async function getLatestPrice(productId: string, marketId: string) {
	// Buscar o preço mais recente de compras
	const purchaseItem = await prisma.purchaseItem.findFirst({
		where: {
			productId,
			purchase: {
				marketId,
			},
		},
		orderBy: {
			purchase: {
				purchaseDate: "desc",
			},
		},
		select: {
			unitPrice: true,
			purchase: {
				select: {
					purchaseDate: true,
					id: true,
				},
			},
		},
	})

	// Buscar o registro de preço manual mais recente
	const priceRecord = await prisma.priceRecord.findFirst({
		where: {
			productId,
			marketId,
		},
		orderBy: {
			recordDate: "desc",
		},
		select: {
			price: true,
			recordDate: true,
			id: true,
		},
	})

	// Comparar as datas e retornar o mais recente
	if (!purchaseItem && !priceRecord) {
		return null
	}

	if (!purchaseItem) {
		return {
			price: priceRecord?.price,
			date: priceRecord?.recordDate,
			source: "record" as const,
			id: priceRecord?.id,
		}
	}

	if (!priceRecord) {
		return {
			price: purchaseItem.unitPrice,
			date: purchaseItem.purchase.purchaseDate,
			source: "purchase" as const,
			id: purchaseItem.purchase.id,
		}
	}

	// Ambos existem, retornar o mais recente
	const purchaseDate = new Date(purchaseItem.purchase.purchaseDate)
	const recordDate = new Date(priceRecord.recordDate)

	if (purchaseDate >= recordDate) {
		return {
			price: purchaseItem.unitPrice,
			date: purchaseItem.purchase.purchaseDate,
			source: "purchase" as const,
			id: purchaseItem.purchase.id,
		}
	} else {
		return {
			price: priceRecord.price,
			date: priceRecord.recordDate,
			source: "record" as const,
			id: priceRecord.id,
		}
	}
}

/**
 * Busca todos os preços de um produto em todos os mercados
 * Considera tanto compras quanto registros de preços manuais
 */
export async function getAllProductPrices(productId: string, marketIds?: string[]) {
	const marketFilter = marketIds ? { in: marketIds } : {}

	// Buscar todos os mercados disponíveis se não especificado
	const markets = await prisma.market.findMany({
		where: marketIds ? { id: marketFilter } : {},
		select: { id: true, name: true, location: true },
	})

	const pricesWithMarkets = await Promise.all(
		markets.map(async (market) => {
			const latestPrice = await getLatestPrice(productId, market.id)

			return {
				marketId: market.id,
				marketName: market.name,
				location: market.location,
				price: latestPrice?.price || null,
				lastUpdate: latestPrice?.date || null,
				source: latestPrice?.source || null,
			}
		}),
	)

	return pricesWithMarkets
}

/**
 * Busca histórico completo de preços de um produto em um mercado
 * Inclui tanto compras quanto registros manuais em ordem cronológica
 */
export async function getProductPriceHistory(productId: string, marketId: string, limit?: number) {
	// Buscar compras
	const purchases = await prisma.purchaseItem.findMany({
		where: {
			productId,
			purchase: {
				marketId,
			},
		},
		select: {
			unitPrice: true,
			purchase: {
				select: {
					purchaseDate: true,
					id: true,
				},
			},
		},
		orderBy: {
			purchase: {
				purchaseDate: "desc",
			},
		},
		...(limit ? { take: limit } : {}),
	})

	// Buscar registros manuais
	const records = await prisma.priceRecord.findMany({
		where: {
			productId,
			marketId,
		},
		select: {
			price: true,
			recordDate: true,
			notes: true,
			id: true,
		},
		orderBy: {
			recordDate: "desc",
		},
		...(limit ? { take: limit } : {}),
	})

	// Combinar e ordenar por data
	const allPrices = [
		...purchases.map((p) => ({
			price: p.unitPrice,
			date: p.purchase.purchaseDate,
			source: "purchase" as const,
			id: p.purchase.id,
			notes: null,
		})),
		...records.map((r) => ({
			price: r.price,
			date: r.recordDate,
			source: "record" as const,
			id: r.id,
			notes: r.notes,
		})),
	].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

	return limit ? allPrices.slice(0, limit) : allPrices
}
