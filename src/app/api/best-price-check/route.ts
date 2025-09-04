import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { productId, currentPrice } = await request.json()

    if (!productId || !currentPrice) {
      return NextResponse.json(
        { error: 'Product ID and current price are required' },
        { status: 400 }
      )
    }

    // Buscar todos os preços históricos deste produto
    const historicalPrices = await prisma.purchaseItem.findMany({
      where: { 
        productId: productId,
        unitPrice: { gt: 0 }
      },
      orderBy: {
        unitPrice: 'asc'
      }
    })

    if (historicalPrices.length === 0) {
      return NextResponse.json({
        isBestPrice: true,
        isFirstRecord: true,
        totalRecords: 0
      })
    }

    // Encontrar o menor preço histórico
    const lowestHistoricalPrice = historicalPrices[0].unitPrice
    const totalRecords = historicalPrices.length

    // Verificar se o preço atual é o menor
    const isBestPrice = currentPrice <= lowestHistoricalPrice

    // Se é o menor preço e há registros anteriores
    if (isBestPrice && totalRecords > 0) {
      return NextResponse.json({
        isBestPrice: true,
        isFirstRecord: false,
        totalRecords: totalRecords,
        previousBestPrice: lowestHistoricalPrice,
        currentPrice: currentPrice,
        savings: lowestHistoricalPrice - currentPrice
      })
    }

    return NextResponse.json({
      isBestPrice: false,
      totalRecords: totalRecords,
      lowestPrice: lowestHistoricalPrice,
      currentPrice: currentPrice
    })

  } catch (error) {
    console.error('Best price check error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar melhor preço' },
      { status: 500 }
    )
  }
}