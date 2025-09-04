// src/app/api/price-comparison/list/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { listId } = await request.json()

    if (!listId) {
      return NextResponse.json(
        { error: 'List ID é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar a lista com seus itens
    const shoppingList = await prisma.shoppingList.findUnique({
      where: { id: listId },
      include: {
        items: {
          include: {
            product: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    })

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      )
    }

    // Buscar todos os mercados
    const markets = await prisma.market.findMany()

    // Buscar preços dos últimos 3 meses para todos os produtos da lista
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const productIds = shoppingList.items
      .filter(item => item.productId)
      .map(item => item.productId!)

    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        productId: { in: productIds },
        purchase: {
          purchaseDate: { gte: threeMonthsAgo }
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

    // Calcular preços por mercado
    const marketComparisons = markets.map(market => {
      const marketItems = shoppingList.items.map(listItem => {
        if (!listItem.productId) return null

        // Buscar o preço mais recente deste produto neste mercado
        const recentPurchase = purchaseItems.find(purchase => 
          purchase.productId === listItem.productId && 
          purchase.purchase.market.id === market.id
        )

        if (!recentPurchase) {
          return {
            listItemId: listItem.id,
            productId: listItem.productId,
            productName: listItem.product?.name || listItem.productName,
            quantity: listItem.quantity,
            unitPrice: null,
            totalPrice: 0,
            available: false,
            lastSeen: null
          }
        }

        return {
          listItemId: listItem.id,
          productId: listItem.productId,
          productName: listItem.product?.name || listItem.productName,
          quantity: listItem.quantity,
          unitPrice: recentPurchase.unitPrice,
          totalPrice: listItem.quantity * recentPurchase.unitPrice,
          available: true,
          lastSeen: recentPurchase.purchase.purchaseDate
        }
      }).filter(item => item !== null)

      const availableItems = marketItems.filter(item => item!.available)
      const missingItems = marketItems.filter(item => !item!.available)
      
      const totalPrice = availableItems.reduce((sum, item) => sum + item!.totalPrice, 0)

      return {
        marketId: market.id,
        marketName: market.name,
        location: market.location,
        totalPrice,
        availableItems: availableItems.length,
        missingItems: missingItems.length,
        items: marketItems,
        completionRate: (availableItems.length / marketItems.length) * 100
      }
    })
    
    // Filtra mercados que não têm itens disponíveis para calcular o preço mais barato
    const marketsWithData = marketComparisons.filter(m => m.availableItems > 0);
    const cheapestTotal = marketsWithData.length > 0 ? Math.min(...marketsWithData.map(m => m.totalPrice)) : 0;

    const marketsWithSavings = marketComparisons.map(market => ({
      ...market,
      savings: market.totalPrice > 0 ? market.totalPrice - cheapestTotal : 0
    }))
    
    const bestMarket = marketsWithData.length > 0 ? marketsWithData.find(m => m.totalPrice === cheapestTotal) : null;

    return NextResponse.json({
      listId: shoppingList.id,
      listName: shoppingList.name,
      totalItems: shoppingList.items.length,
      markets: marketsWithSavings.sort((a, b) => {
          if (a.availableItems === 0 && b.availableItems > 0) return 1;
          if (a.availableItems > 0 && b.availableItems === 0) return -1;
          return a.totalPrice - b.totalPrice;
      }),
      analysis: {
        bestMarket,
        maxSavings: Math.max(...marketsWithSavings.map(m => m.savings)),
        avgCompletionRate: marketsWithSavings.reduce((sum, m) => sum + m.completionRate, 0) / marketsWithSavings.length
      }
    })

  } catch (error) {
    console.error('Erro ao comparar preços da lista:', error)
    return NextResponse.json(
      { error: 'Erro ao comparar preços da lista' },
      { status: 500 }
    )
  }
}