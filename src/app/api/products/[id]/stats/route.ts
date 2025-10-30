
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const productId = resolvedParams.id

		// Verificar se o produto existe
		const product = await prisma.product.findUnique({
			where: { id: productId },
		})

		if (!product) {
			return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
		}

		// Buscar estatísticas básicas
		const purchaseItems = await prisma.purchaseItem.findMany({
			where: { productId },
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

		// Calcular estatísticas
		const totalPurchases = purchaseItems.length
		const totalSpent = purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
		const averagePrice =
			totalPurchases > 0 ? totalSpent / purchaseItems.reduce((sum, item) => sum + item.quantity, 0) : 0

		// Última compra
		const lastPurchaseDate = purchaseItems.length > 0 ? purchaseItems[0].purchase.purchaseDate : null

		// Calcular variação de preço (últimos 30 dias vs anteriores)
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		const recentItems = purchaseItems.filter((item) => new Date(item.purchase.purchaseDate) >= thirtyDaysAgo)
		const olderItems = purchaseItems.filter((item) => new Date(item.purchase.purchaseDate) < thirtyDaysAgo)

		const recentAveragePrice =
			recentItems.length > 0 ? recentItems.reduce((sum, item) => sum + item.unitPrice, 0) / recentItems.length : 0
		const olderAveragePrice =
			olderItems.length > 0 ? olderItems.reduce((sum, item) => sum + item.unitPrice, 0) / olderItems.length : 0

		const priceChange = olderAveragePrice > 0 ? ((recentAveragePrice - olderAveragePrice) / olderAveragePrice) * 100 : 0

		// Comparação entre mercados
		const marketStats = new Map()
		purchaseItems.forEach((item) => {
			const marketId = item.purchase.market.id
			const marketName = item.purchase.market.name

			if (!marketStats.has(marketId)) {
				marketStats.set(marketId, {
					marketId,
					marketName,
					prices: [],
					purchaseCount: 0,
				})
			}

			const marketData = marketStats.get(marketId)
			marketData.prices.push(item.unitPrice)
			marketData.purchaseCount++
		})

		const marketComparison = Array.from(marketStats.values())
			.map((market) => ({
				...market,
				averagePrice: market.prices.reduce((sum: number, price: number) => sum + price, 0) / market.prices.length,
			}))
			.sort((a, b) => a.averagePrice - b.averagePrice)

		// Compras recentes (últimas 20 para paginação)
		const recentPurchases = purchaseItems.slice(0, 20).map((item) => ({
			id: item.id,
			purchaseDate: item.purchase.purchaseDate,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			totalPrice: item.finalPrice || (item.unitPrice * item.quantity),
			market: {
				id: item.purchase.market.id,
				name: item.purchase.market.name,
			},
		}))

		// Histórico de preços para gráfico (últimos 3 meses, agrupado por semana)
		const threeMonthsAgo = new Date()
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

		const recentPriceHistory = purchaseItems.filter((item) => new Date(item.purchase.purchaseDate) >= threeMonthsAgo)

		// Agrupar por mercado e semana para criar linhas no gráfico
		const priceHistoryByMarket = new Map()

		recentPriceHistory.forEach((item) => {
			const marketId = item.purchase.market.id
			const marketName = item.purchase.market.name
			const date = new Date(item.purchase.purchaseDate)
			const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}-${date.getMonth()}`

			if (!priceHistoryByMarket.has(marketId)) {
				priceHistoryByMarket.set(marketId, {
					marketName,
					data: new Map(),
				})
			}

			const marketData = priceHistoryByMarket.get(marketId)
			if (!marketData.data.has(weekKey)) {
				marketData.data.set(weekKey, {
					date: date,
					// date: format(date, 'dd/MM', { locale: ptBR }),
					prices: [],
					fullDate: date,
				})
			}

			marketData.data.get(weekKey).prices.push(item.unitPrice)
		})

		// Converter para formato do gráfico
		const priceHistory: any[] = []
		const allWeeks = new Set<string>()

		// Coletar todas as semanas
		priceHistoryByMarket.forEach((marketData) => {
			marketData.data.forEach((_weekData: any, weekKey: string) => {
				allWeeks.add(weekKey)
			})
		})

		// Criar dados do gráfico
		Array.from(allWeeks)
			.sort()
			.forEach((weekKey) => {
				const dataPoint: any = { week: "" }
				let hasData = false

				priceHistoryByMarket.forEach((marketData, _marketId) => {
					if (marketData.data.has(weekKey)) {
						const weekData = marketData.data.get(weekKey)
						const averagePrice =
							weekData.prices.reduce((sum: number, price: number) => sum + price, 0) / weekData.prices.length
						dataPoint[marketData.marketName] = parseFloat(averagePrice.toFixed(2))
						dataPoint.week = weekData.date
						hasData = true
					}
				})

				if (hasData) {
					priceHistory.push(dataPoint)
				}
			})

		// Status do estoque (se aplicável)
		let stockAlerts = null
		if (product.hasStock) {
			// Aqui você poderia implementar a lógica para buscar o estoque atual
			// Por enquanto, vamos simular
			const currentStock = 0 // Implementar busca real do estoque
			const status = product.minStock && currentStock < product.minStock ? "low" : "ok"

			stockAlerts = {
				currentStock,
				status,
				minStock: product.minStock,
				maxStock: product.maxStock,
			}
		}

		const stats = {
			totalPurchases,
			averagePrice,
			lastPurchaseDate,
			priceChange,
		}

		return NextResponse.json({
			stats,
			priceHistory,
			marketComparison: marketComparison.slice(0, 5), // Top 5 mercados
			recentPurchases,
			stockAlerts,
		})
	} catch (error) {
		console.error("Error fetching product stats:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
