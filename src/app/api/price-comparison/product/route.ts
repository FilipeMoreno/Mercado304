import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o produto existe
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

    // Buscar compras dos últimos 6 meses para este produto
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        productId: productId,
        purchase: {
          purchaseDate: { gte: sixMonthsAgo }
        }
      },
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

    // Buscar registros de preços dos últimos 6 meses para este produto
    const priceRecords = await prisma.priceRecord.findMany({
      where: {
        productId: productId,
        recordDate: { gte: sixMonthsAgo }
      },
      include: {
        market: true
      },
      orderBy: {
        recordDate: 'desc'
      }
    })

    // Agrupar por mercado e calcular estatísticas (incluindo registros de preços)
    const marketPrices = purchaseItems.reduce((acc: any, item) => {
      const marketId = item.purchase.market.id
      
      if (!acc[marketId]) {
        acc[marketId] = {
          market: item.purchase.market,
          prices: [],
          quantities: [],
          dates: [],
          sources: []
        }
      }
      
      acc[marketId].prices.push(item.unitPrice)
      acc[marketId].quantities.push(item.quantity)
      acc[marketId].dates.push(item.purchase.purchaseDate)
      acc[marketId].sources.push('purchase')
      
      return acc
    }, {})

    // Adicionar registros de preços ao agrupamento
    priceRecords.forEach(record => {
      const marketId = record.market.id
      
      if (!marketPrices[marketId]) {
        marketPrices[marketId] = {
          market: record.market,
          prices: [],
          quantities: [],
          dates: [],
          sources: []
        }
      }
      
      marketPrices[marketId].prices.push(record.price)
      marketPrices[marketId].quantities.push(1) // Assumindo quantidade 1 para registros
      marketPrices[marketId].dates.push(record.recordDate)
      marketPrices[marketId].sources.push('record')
    })

    // Calcular preços médios e tendências para cada mercado
    const markets = Object.values(marketPrices).map((marketData: any) => {
      const prices = marketData.prices
      const dates = marketData.dates
      const sources = marketData.sources
      const market = marketData.market
      
      // Ordenar por data (mais recente primeiro)
      const sortedData = prices.map((price, index) => ({
        price,
        date: dates[index],
        source: sources[index]
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      // Preço mais recente (última compra ou registro)
      const currentPrice = sortedData[0].price
      const lastUpdate = sortedData[0].date
      const lastSource = sortedData[0].source
      
      // Calcular tendência de preço (comparar últimos 30 dias vs 30 dias anteriores)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentData = sortedData.filter(item => 
        new Date(item.date) >= thirtyDaysAgo
      )
      
      const olderData = sortedData.filter(item => 
        new Date(item.date) < thirtyDaysAgo
      )
      
      let priceTrend: 'up' | 'down' | 'stable' = 'stable'
      let priceChange = 0
      
      if (recentData.length > 0 && olderData.length > 0) {
        const recentAvg = recentData.reduce((sum, item) => sum + item.price, 0) / recentData.length
        const olderAvg = olderData.reduce((sum, item) => sum + item.price, 0) / olderData.length
        
        priceChange = ((recentAvg - olderAvg) / olderAvg) * 100
        
        if (Math.abs(priceChange) > 5) {
          priceTrend = priceChange > 0 ? 'up' : 'down'
        }
      }
      
      // Contar compras vs registros
      const purchaseCount = sources.filter(s => s === 'purchase').length
      const recordCount = sources.filter(s => s === 'record').length
      
      return {
        marketId: market.id,
        marketName: market.name,
        location: market.location,
        currentPrice: currentPrice,
        lastPurchase: lastUpdate,
        lastSource: lastSource === 'purchase' ? 'Compra' : 'Registro',
        priceTrend,
        priceChange: Math.abs(priceChange),
        totalPurchases: purchaseCount,
        totalRecords: recordCount,
        totalData: prices.length,
        avgPrice: prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length
      }
    })

    return NextResponse.json({
      productId: product.id,
      productName: product.name,
      brandName: product.brand?.name,
      unit: product.unit,
      markets: markets.sort((a, b) => a.currentPrice - b.currentPrice)
    })

  } catch (error) {
    console.error('Erro ao comparar preços do produto:', error)
    return NextResponse.json(
      { error: 'Erro ao comparar preços' },
      { status: 500 }
    )
  }
}