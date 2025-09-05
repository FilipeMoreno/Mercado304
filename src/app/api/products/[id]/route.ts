import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    const { searchParams } = new URL(request.url)
    const includeStats = searchParams.get('includeStats') === 'true'

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        brand: true,
        category: true
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    if (!includeStats) {
      return NextResponse.json(product)
    }

    // Include stats if requested
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: { productId },
      include: {
        purchase: {
          include: {
            market: true
          }
        }
      },
      orderBy: {
        purchase: {
          purchaseDate: 'desc'
        }
      }
    })

    const totalPurchases = purchaseItems.length
    const totalSpent = purchaseItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const averagePrice = totalPurchases > 0 ? totalSpent / purchaseItems.reduce((sum, item) => sum + item.quantity, 0) : 0
    
    const lastPurchaseDate = purchaseItems.length > 0 ? purchaseItems[0].purchase.purchaseDate : null

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentItems = purchaseItems.filter(item => new Date(item.purchase.purchaseDate) >= thirtyDaysAgo)
    const olderItems = purchaseItems.filter(item => new Date(item.purchase.purchaseDate) < thirtyDaysAgo)
    
    const recentAveragePrice = recentItems.length > 0 ? 
      recentItems.reduce((sum, item) => sum + item.unitPrice, 0) / recentItems.length : 0
    const olderAveragePrice = olderItems.length > 0 ? 
      olderItems.reduce((sum, item) => sum + item.unitPrice, 0) / olderItems.length : 0
    
    const priceChange = olderAveragePrice > 0 ? 
      ((recentAveragePrice - olderAveragePrice) / olderAveragePrice) * 100 : 0

    const marketStats = new Map()
    purchaseItems.forEach(item => {
      const marketId = item.purchase.market.id
      const marketName = item.purchase.market.name
      
      if (!marketStats.has(marketId)) {
        marketStats.set(marketId, {
          marketId,
          marketName,
          prices: [],
          purchaseCount: 0
        })
      }
      
      const marketData = marketStats.get(marketId)
      marketData.prices.push(item.unitPrice)
      marketData.purchaseCount++
    })

    const marketComparison = Array.from(marketStats.values()).map(market => ({
      ...market,
      averagePrice: market.prices.reduce((sum: number, price: number) => sum + price, 0) / market.prices.length
    })).sort((a, b) => a.averagePrice - b.averagePrice)

    const recentPurchases = purchaseItems.slice(0, 20).map(item => ({
      id: item.id,
      purchaseDate: item.purchase.purchaseDate,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      market: {
        id: item.purchase.market.id,
        name: item.purchase.market.name
      }
    }))

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const recentPriceHistory = purchaseItems.filter(item => 
      new Date(item.purchase.purchaseDate) >= threeMonthsAgo
    )

    const priceHistoryByMarket = new Map()
    
    recentPriceHistory.forEach(item => {
      const marketId = item.purchase.market.id
      const marketName = item.purchase.market.name
      const date = new Date(item.purchase.purchaseDate)
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}-${date.getMonth()}`
      
      if (!priceHistoryByMarket.has(marketId)) {
        priceHistoryByMarket.set(marketId, {
          marketName,
          data: new Map()
        })
      }
      
      const marketData = priceHistoryByMarket.get(marketId)
      if (!marketData.data.has(weekKey)) {
        marketData.data.set(weekKey, {
          date: date,
          prices: [],
          fullDate: date
        })
      }
      
      marketData.data.get(weekKey).prices.push(item.unitPrice)
    })

    const priceHistory: any[] = []
    const allWeeks = new Set<string>()
    
    priceHistoryByMarket.forEach(marketData => {
      marketData.data.forEach((weekData: any, weekKey: string) => {
        allWeeks.add(weekKey)
      })
    })
    
    Array.from(allWeeks).sort().forEach(weekKey => {
      const dataPoint: any = { week: '' }
      let hasData = false
      
      priceHistoryByMarket.forEach((marketData, marketId) => {
        if (marketData.data.has(weekKey)) {
          const weekData = marketData.data.get(weekKey)
          const averagePrice = weekData.prices.reduce((sum: number, price: number) => sum + price, 0) / weekData.prices.length
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
      const currentStock = 0
      const status = product.minStock && currentStock < product.minStock ? 'low' : 'ok'
      
      stockAlerts = {
        currentStock,
        status,
        minStock: product.minStock,
        maxStock: product.maxStock
      }
    }

    const stats = {
      totalPurchases,
      averagePrice,
      lastPurchaseDate,
      priceChange
    }

    return NextResponse.json({
      product,
      stats,
      priceHistory,
      marketComparison: marketComparison.slice(0, 5),
      recentPurchases,
      stockAlerts
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } },
) {
	try {
		const body = await request.json();
		const {
			name,
			categoryId,
			brandId,
			unit,
			barcode,
			hasStock,
			minStock,
			maxStock,
			hasExpiration,
			defaultShelfLifeDays,
			nutritionalInfo, // Objeto completo vindo do frontend
		} = body;

		if (!name) {
			return NextResponse.json(
				{ error: "Nome é obrigatório" },
				{ status: 400 },
			);
		}
		let cleanNutritionalInfoData = null;
		if (nutritionalInfo) {
			const {
				servingSize,
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
				allergensContains,
				allergensMayContain,
			} = nutritionalInfo;

			cleanNutritionalInfoData = {
				servingSize,
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
				allergensContains,
				allergensMayContain,
			};
		}

		const product = await prisma.product.update({
			where: { id: params.id },
			data: {
				name,
				categoryId: categoryId || null,
				brandId: brandId || null,
				unit: unit || "unidade",
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
		});

		return NextResponse.json(product);
	} catch (error) {
		console.error("Erro ao atualizar produto:", error);
		return NextResponse.json(
			{ error: "Erro ao atualizar produto" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Produto excluído com sucesso' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    )
  }
}