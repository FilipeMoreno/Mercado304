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

    // Agrupar por mercado e calcular estatísticas
    const marketPrices = purchaseItems.reduce((acc: any, item) => {
      const marketId = item.purchase.market.id
      
      if (!acc[marketId]) {
        acc[marketId] = {
          market: item.purchase.market,
          prices: [],
          quantities: []
        }
      }
      
      acc[marketId].prices.push(item.unitPrice)
      acc[marketId].quantities.push(item.quantity)
      
      return acc
    }, {})

    // Calcular preços médios e tendências para cada mercado
    const markets = Object.values(marketPrices).map((marketData: any) => {
      const prices = marketData.prices
      const market = marketData.market
      
      // Preço mais recente (última compra)
      const currentPrice = prices[0]
      
      // Calcular tendência de preço (comparar últimos 30 dias vs 30 dias anteriores)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const recentPurchases = purchaseItems.filter(item => 
        item.purchase.market.id === market.id && 
        item.purchase.purchaseDate >= thirtyDaysAgo
      )
      
      const olderPurchases = purchaseItems.filter(item => 
        item.purchase.market.id === market.id && 
        item.purchase.purchaseDate < thirtyDaysAgo
      )
      
      let priceTrend: 'up' | 'down' | 'stable' = 'stable'
      let priceChange = 0
      
      if (recentPurchases.length > 0 && olderPurchases.length > 0) {
        const recentAvg = recentPurchases.reduce((sum, item) => sum + item.unitPrice, 0) / recentPurchases.length
        const olderAvg = olderPurchases.reduce((sum, item) => sum + item.unitPrice, 0) / olderPurchases.length
        
        priceChange = ((recentAvg - olderAvg) / olderAvg) * 100
        
        if (Math.abs(priceChange) > 5) {
          priceTrend = priceChange > 0 ? 'up' : 'down'
        }
      }
      
      // Última compra neste mercado
      const lastPurchase = purchaseItems.find(item => item.purchase.market.id === market.id)
      
      return {
        marketId: market.id,
        marketName: market.name,
        location: market.location,
        currentPrice: currentPrice,
        lastPurchase: lastPurchase?.purchase.purchaseDate || new Date(),
        priceTrend,
        priceChange: Math.abs(priceChange),
        totalPurchases: prices.length,
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