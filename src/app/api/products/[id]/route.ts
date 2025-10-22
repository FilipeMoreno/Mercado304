import { NextResponse } from "next/server"
import { getProductPriceHistory } from "@/lib/price-utils"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const productId = params.id
		const { searchParams } = new URL(request.url)
		const includeStats = searchParams.get("includeStats") === "true"

		const product = await prisma.product.findUnique({
			where: { id: productId },
			include: {
				brand: true,
				category: true,
			},
		})

		if (!product) {
			return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
		}

		if (!includeStats) {
			return NextResponse.json(product)
		}

		// Include stats if requested - now combining purchases and price records
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

		// Get all markets that have data for this product
		const marketsWithPurchases = await prisma.market.findMany({
			where: {
				OR: [{ purchases: { some: { items: { some: { productId } } } } }, { priceRecords: { some: { productId } } }],
			},
			select: { id: true, name: true, location: true },
		})

		// Get all price data combining purchases and records
		const allPricesData = await Promise.all(
			marketsWithPurchases.map(async (market) => {
				const priceHistory = await getProductPriceHistory(productId, market.id, 50)
				return priceHistory.map((price) => ({
					...price,
					marketId: market.id,
					marketName: market.name,
				}))
			}),
		)

		const allPrices = allPricesData.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		const totalPurchases = purchaseItems.length
		const totalRecords = allPrices.filter((p) => p.source === "record").length
		const totalEntries = allPrices.length
		const _totalSpent = purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
		const averagePrice = totalEntries > 0 ? allPrices.reduce((sum, price) => sum + price.price, 0) / totalEntries : 0

		const lastPriceDate = allPrices.length > 0 ? allPrices[0]!.date : null

		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		const recentPrices = allPrices.filter((price) => new Date(price.date) >= thirtyDaysAgo)
		const olderPrices = allPrices.filter((price) => new Date(price.date) < thirtyDaysAgo)

		const _recentAveragePrice =
			recentPrices.length > 0 ? recentPrices.reduce((sum, price) => sum + price.price, 0) / recentPrices.length : 0
		const _olderAveragePrice =
			olderPrices.length > 0 ? olderPrices.reduce((sum, price) => sum + price.price, 0) / olderPrices.length : 0

		// Calculate price change using more reliable logic
		let priceChange = 0
		if (allPrices.length >= 2) {
			// Get the most recent price and compare with previous prices
			const latestPrice = allPrices[0]!.price

			if (olderPrices.length > 0) {
				const olderAveragePrice = olderPrices.reduce((sum, price) => sum + price.price, 0) / olderPrices.length
				priceChange = ((latestPrice - olderAveragePrice) / olderAveragePrice) * 100
			} else {
				// If no older prices, compare with second most recent price
				const secondPrice = allPrices[1]!.price
				priceChange = ((latestPrice - secondPrice) / secondPrice) * 100
			}
		}

		const marketStats = new Map()
		allPrices.forEach((price) => {
			const marketId = price.marketId
			const marketName = price.marketName

			if (!marketStats.has(marketId)) {
				marketStats.set(marketId, {
					marketId,
					marketName,
					prices: [],
					purchaseCount: 0,
					recordCount: 0,
				})
			}

			const marketData = marketStats.get(marketId)
			marketData.prices.push(price.price)
			if (price.source === "purchase") {
				marketData.purchaseCount++
			} else {
				marketData.recordCount++
			}
		})

		const marketComparison = Array.from(marketStats.values())
			.map((market) => ({
				...market,
				averagePrice: market.prices.reduce((sum: number, price: number) => sum + price, 0) / market.prices.length,
				totalEntries: market.purchaseCount + market.recordCount,
			}))
			.sort((a, b) => a.averagePrice - b.averagePrice)

		const recentPriceEntries = allPrices.slice(0, 20).map((price) => ({
			id: price.id,
			date: price.date,
			price: price.price,
			source: price.source,
			notes: price.notes,
			marketId: price.marketId,
			marketName: price.marketName,
		}))

		const threeMonthsAgo = new Date()
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

		const recentPriceHistory = allPrices.filter((price) => new Date(price.date) >= threeMonthsAgo)

		const priceHistoryByMarket = new Map()

		recentPriceHistory.forEach((price) => {
			const marketId = price.marketId
			const marketName = price.marketName
			const date = new Date(price.date)
			// Calculate proper week number
			const yearStart = new Date(date.getFullYear(), 0, 1)
			const weekNumber = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7)
			const weekKey = `${date.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`

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
					prices: [],
					fullDate: date,
				})
			}

			marketData.data.get(weekKey).prices.push(price.price)
		})

		const priceHistory: any[] = []
		const allWeeks = new Set<string>()

		priceHistoryByMarket.forEach((marketData) => {
			marketData.data.forEach((_weekData: any, weekKey: string) => {
				allWeeks.add(weekKey)
			})
		})

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

		let stockAlerts = null
		if (product.hasStock) {
			// Calculate actual current stock from stock items
			const stockItems = await prisma.stockItem.findMany({
				where: { productId },
				select: { quantity: true },
			})

			const currentStock = stockItems.reduce((total, item) => total + item.quantity, 0)
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
			totalRecords,
			totalEntries,
			averagePrice,
			lastPriceDate,
			priceChange,
		}

		return NextResponse.json({
			product,
			stats,
			priceHistory,
			marketComparison: marketComparison.slice(0, 5),
			recentPrices: recentPriceEntries,
			stockAlerts,
		})
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 })
	}
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const body = await request.json()
		const {
			name,
			categoryId,
			brandId,
			unit,
			packageSize,
			barcode,
			hasStock,
			minStock,
			maxStock,
			hasExpiration,
			defaultShelfLifeDays,
			nutritionalInfo, // Objeto completo vindo do frontend
		} = body

		if (!name) {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
		}

		// Verificar se o código de barras já existe em outro produto
		if (barcode) {
			const existingProduct = await prisma.product.findUnique({
				where: { barcode },
				select: { id: true, name: true },
			})

			if (existingProduct && existingProduct.id !== params.id) {
				return NextResponse.json(
					{
						error: `Código de barras já cadastrado para o produto: ${existingProduct.name}`,
					},
					{ status: 409 },
				)
			}
		}
		let cleanNutritionalInfoData = null
		if (nutritionalInfo) {
			const {
				servingSize,
				servingsPerPackage,
				calories,
				proteins,
				totalFat,
				saturatedFat,
				transFat,
				carbohydrates,
				totalSugars,
				addedSugars,
				fiber,
				sodium,
				// Novos campos adicionados
				lactose,
				galactose,
				omega3,
				omega6,
				monounsaturatedFat,
				polyunsaturatedFat,
				cholesterol,
				epa,
				dha,
				linolenicAcid,
				// Outros campos opcionais existentes
				taurine,
				caffeine,
				alcoholContent,
				// Vitaminas
				vitaminA,
				vitaminC,
				vitaminD,
				vitaminE,
				vitaminK,
				thiamine,
				riboflavin,
				niacin,
				vitaminB6,
				folate,
				vitaminB12,
				biotin,
				pantothenicAcid,
				// Minerais
				calcium,
				iron,
				magnesium,
				phosphorus,
				potassium,
				zinc,
				copper,
				manganese,
				selenium,
				iodine,
				chromium,
				molybdenum,
				// Alérgenos
				allergensContains,
				allergensMayContain,
			} = nutritionalInfo

			cleanNutritionalInfoData = {
				servingSize,
				servingsPerPackage,
				calories,
				proteins,
				totalFat,
				saturatedFat,
				transFat,
				carbohydrates,
				totalSugars,
				addedSugars,
				fiber,
				sodium,
				// Vitaminas
				vitaminA,
				vitaminC,
				vitaminD,
				vitaminE,
				vitaminK,
				thiamine,
				riboflavin,
				niacin,
				vitaminB6,
				folate,
				vitaminB12,
				biotin,
				pantothenicAcid,
				// Outros
				taurine,
				caffeine,
				lactose,
				galactose,
				alcoholContent,
				// Ácidos graxos e gorduras especiais
				omega3,
				omega6,
				monounsaturatedFat,
				polyunsaturatedFat,
				cholesterol,
				epa,
				dha,
				linolenicAcid,
				// Minerais
				calcium,
				iron,
				magnesium,
				phosphorus,
				potassium,
				zinc,
				copper,
				manganese,
				selenium,
				iodine,
				chromium,
				molybdenum,
				// Alérgenos
				allergensContains,
				allergensMayContain,
			}
		}

		const product = await prisma.product.update({
			where: { id: params.id },
			data: {
				name,
				categoryId: categoryId || null,
				brandId: brandId || null,
				unit: unit || "unidade",
				packageSize: packageSize || null,
				barcode: barcode || null,
				hasStock,
				minStock,
				maxStock,
				hasExpiration,
				defaultShelfLifeDays,
				...(cleanNutritionalInfoData && {
					nutritionalInfo: {
						upsert: {
							create: cleanNutritionalInfoData,
							update: cleanNutritionalInfoData,
						},
					},
				}),
			},
			include: {
				brand: true,
				category: true,
				nutritionalInfo: true,
			},
		})

		return NextResponse.json(product)
	} catch (error) {
		console.error("Erro ao atualizar produto:", error)
		return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
	}
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		// Verificar se o produto está vinculado a algum kit
		const kitCheck = await prisma.productKitItem.findFirst({
			where: { productId: params.id },
			include: {
				kit: {
					include: {
						kitProduct: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		})

		if (kitCheck) {
			return NextResponse.json(
				{
					error: `Este produto está sendo usado no kit "${kitCheck.kit.kitProduct.name}". Remova-o do kit antes de excluir.`,
					kitName: kitCheck.kit.kitProduct.name,
					kitId: kitCheck.kit.kitProductId,
				},
				{ status: 400 },
			)
		}

		// Verificar se o produto é um kit (produto principal de um kit)
		const isKitProduct = await prisma.productKit.findUnique({
			where: { kitProductId: params.id },
			select: {
				id: true,
			},
		})

		if (isKitProduct) {
			return NextResponse.json(
				{
					error: "Este produto é um kit. Exclua o kit pela página de Kits.",
					isKit: true,
				},
				{ status: 400 },
			)
		}

		// Se não está em nenhum kit, pode deletar
		await prisma.product.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ message: "Produto excluído com sucesso" })
	} catch (error) {
		console.error("Erro ao excluir produto:", error)
		return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 })
	}
}
