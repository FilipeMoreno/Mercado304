import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const marketId = params.id

    // Verificar se o mercado existe
    const market = await prisma.market.findUnique({
      where: { id: marketId }
    })

    if (!market) {
      return NextResponse.json(
        { error: 'Mercado não encontrado' },
        { status: 404 }
      )
    }

    // Buscar estatísticas básicas
    const [
      totalPurchases,
      totalSpent,
      lastPurchase,
      recentPurchases,
      topProducts,
      averageTicket,
      categoryStats
    ] = await Promise.all([
      // Total de compras
      prisma.purchase.count({
        where: { marketId }
      }),

      // Total gasto
      prisma.purchase.aggregate({
        where: { marketId },
        _sum: { totalAmount: true }
      }),

      // Última compra
      prisma.purchase.findFirst({
        where: { marketId },
        orderBy: { purchaseDate: 'desc' },
        include: {
          items: {
            include: {
              product: {
                include: { 
                  brand: true,
                  category: true
                }
              }
            }
          }
        }
      }),

      // Compras recentes (últimas 10)
      prisma.purchase.findMany({
        where: { marketId },
        orderBy: { purchaseDate: 'desc' },
        take: 10,
        include: {
          items: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true
                }
              }
            }
          }
        }
      }),

      // Produtos mais comprados
      prisma.purchaseItem.groupBy({
        by: ['productId'],
        where: {
          purchase: { marketId }
        },
        _count: { productId: true },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10
      }),

      // Ticket médio
      prisma.purchase.aggregate({
        where: { marketId },
        _avg: { totalAmount: true }
      }),

      // Estatísticas por categoria para este mercado
      prisma.$queryRaw`
        SELECT 
          c.name as "categoryName",
          c.id as "categoryId",
          c.icon as "icon",
          c.color as "color",
          SUM(pi.quantity * pi."unitPrice") as "totalSpent",
          COUNT(DISTINCT pi."purchaseId") as "totalPurchases",
          SUM(pi.quantity) as "totalQuantity",
          AVG(pi."unitPrice") as "averagePrice"
        FROM "purchase_items" pi
        JOIN "purchases" p ON pi."purchaseId" = p.id
        LEFT JOIN "products" prod ON pi."productId" = prod.id
        LEFT JOIN "categories" c ON prod."categoryId" = c.id
        WHERE p."marketId" = ${marketId} AND c.name IS NOT NULL
        GROUP BY c.id, c.name, c.icon, c.color
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `
    ])

    // Evolução mensal simples (últimos 6 meses)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyPurchases = await prisma.purchase.findMany({
      where: {
        marketId,
        purchaseDate: { gte: sixMonthsAgo }
      },
      orderBy: { purchaseDate: 'asc' }
    })

    // Agrupar por mês
    const priceEvolution = monthlyPurchases.reduce((acc: any[], purchase) => {
      const monthKey = purchase.purchaseDate.toISOString().slice(0, 7) // YYYY-MM
      const existing = acc.find(item => item.month === monthKey)
      
      if (existing) {
        existing.total += purchase.totalAmount
        existing.count += 1
        existing.avg_amount = existing.total / existing.count
      } else {
        acc.push({
          month: monthKey + '-01', // Adicionar dia para parsing
          total: purchase.totalAmount,
          count: 1,
          avg_amount: purchase.totalAmount
        })
      }
      return acc
    }, [])

    // Buscar informações dos produtos mais comprados
    const productIds = topProducts.map(item => item.productId).filter((id): id is string => id !== null)
    const productsInfo = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { 
        brand: true,
        category: true
      }
    })

    // Combinar dados dos produtos
    const topProductsWithInfo = topProducts.map(item => {
      const product = productsInfo.find(p => p.id === item.productId)
      return {
        ...item,
        product
      }
    })

    // Comparação com outros mercados (buscar todos os mercados)
    const otherMarkets = await prisma.market.findMany({
      where: { id: { not: marketId } },
      include: {
        purchases: {
          where: {
            purchaseDate: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // 3 meses
          },
          include: {
            items: true
          }
        }
      }
    })

    const priceComparison = otherMarkets
      .filter(market => market.purchases.length >= 3)
      .map(market => {
        const totalItems = market.purchases.reduce((sum, purchase) => 
          sum + purchase.items.reduce((itemSum, item) => itemSum + Number(item.unitPrice), 0), 0
        )
        const itemCount = market.purchases.reduce((sum, purchase) => sum + purchase.items.length, 0)
        
        return {
          id: market.id,
          name: market.name,
          avg_price: itemCount > 0 ? totalItems / itemCount : 0,
          purchase_count: market.purchases.length
        }
      })
      .sort((a, b) => a.avg_price - b.avg_price)

    // Converter BigInt para Number nos dados de retorno
    const serializedTopProducts = topProductsWithInfo.map(item => ({
      ...item,
      _count: {
        productId: Number(item._count.productId)
      },
      _sum: {
        quantity: Number(item._sum.quantity || 0),
        totalPrice: Number(item._sum.totalPrice || 0)
      }
    }))

    // Processar estatísticas por categoria
    const categoryStatsProcessed = (categoryStats as any[]).map((cat: any) => ({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      icon: cat.icon,
      color: cat.color,
      totalSpent: parseFloat(cat.totalSpent || '0'),
      totalPurchases: parseInt(cat.totalPurchases || '0'),
      totalQuantity: parseFloat(cat.totalQuantity || '0'),
      averagePrice: parseFloat(cat.averagePrice || '0')
    }))

    return NextResponse.json({
      market,
      stats: {
        totalPurchases: Number(totalPurchases),
        totalSpent: Number(totalSpent._sum.totalAmount || 0),
        averageTicket: Number(averageTicket._avg.totalAmount || 0)
      },
      lastPurchase,
      recentPurchases,
      topProducts: serializedTopProducts,
      priceEvolution,
      priceComparison,
      categoryStats: categoryStatsProcessed
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas do mercado:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}