// src/app/api/best-price-check/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { productId, currentPrice } = await request.json()

    if (!productId || currentPrice === undefined) {
      return NextResponse.json(
        { error: 'ProductId e currentPrice são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar todos os preços históricos para este produto, excluindo o preço atual
    const historicalPrices = await prisma.purchaseItem.findMany({
      where: {
        productId: productId,
        unitPrice: {
          not: currentPrice // Exclui o preço exato que está a ser verificado
        }
      },
      orderBy: {
        unitPrice: 'asc' // Ordena para encontrar o menor preço facilmente
      },
      take: 1 // Só precisamos do menor preço
    })

    const totalRecords = await prisma.purchaseItem.count({
      where: { productId }
    })
    
    // Se não há histórico, o preço atual é o primeiro registo
    if (totalRecords === 0) {
      return NextResponse.json({
        isBestPrice: true,
        isFirstRecord: true,
        previousBestPrice: null
      })
    }

    const previousBestPrice = historicalPrices[0]?.unitPrice

    // Se não há outro preço registado ou o preço atual é menor que o melhor preço anterior
    if (!previousBestPrice || currentPrice < previousBestPrice) {
      return NextResponse.json({
        isBestPrice: true,
        isFirstRecord: false,
        previousBestPrice: previousBestPrice || 0,
        totalRecords: totalRecords
      })
    }

    return NextResponse.json({
      isBestPrice: false,
      isFirstRecord: false,
      previousBestPrice: previousBestPrice,
      totalRecords: totalRecords
    })

  } catch (error) {
    console.error('Erro ao verificar melhor preço:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar o melhor preço histórico' },
      { status: 500 }
    )
  }
}