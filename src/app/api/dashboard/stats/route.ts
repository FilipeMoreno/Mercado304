import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Calcular comparação mensal
    const currentMonth = new Date()
    currentMonth.setDate(1) // Primeiro dia do mês atual
    
    const lastMonth = new Date(currentMonth)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    const [
      totalPurchases,
      totalSpent,
      totalProducts,
      totalMarkets,
      recentPurchases,
      topProducts,
      marketComparison,
      categoryStats,
      currentMonthStats,
      lastMonthStats
    ] = await Promise.all([
      prisma.purchase.count(),
      
      prisma.purchase.aggregate({
        _sum: { totalAmount: true }
      }),
      
      prisma.product.count(),
      
      prisma.market.count(),
      
      prisma.purchase.findMany({
        include: {
          market: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { purchaseDate: 'desc' },
        take: 10
      }),
      
      prisma.purchaseItem.groupBy({
        by: ['productId'],
        _count: {
          productId: true
        },
        _sum: {
          quantity: true
        },
        _avg: {
          unitPrice: true
        },
        orderBy: {
          _count: {
            productId: 'desc'
          }
        },
        take: 10
      }),
      
      prisma.purchase.groupBy({
        by: ['marketId'],
        _count: {
          id: true
        },
        _avg: {
          totalAmount: true
        },
        orderBy: {
          _avg: {
            totalAmount: 'asc'
          }
        }
      }),

      // Estatísticas por categoria - gastos por categoria
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
        LEFT JOIN "products" p ON pi."productId" = p.id
        LEFT JOIN "categories" c ON p."categoryId" = c.id
        WHERE c.name IS NOT NULL
        GROUP BY c.id, c.name, c.icon, c.color
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `,
      
      // Estatísticas do mês atual
      prisma.purchase.aggregate({
        where: {
          purchaseDate: { gte: currentMonth }
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      
      // Estatísticas por categoria - gastos por categoria
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
        LEFT JOIN "products" p ON pi."productId" = p.id
        LEFT JOIN "categories" c ON p."categoryId" = c.id
        WHERE c.name IS NOT NULL
        GROUP BY c.id, c.name, c.icon, c.color
        ORDER BY "totalSpent" DESC
        LIMIT 10
      `,
      
      // Estatísticas do mês atual
      prisma.purchase.aggregate({
        where: {
          purchaseDate: { gte: currentMonth }
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      }),
      
      // Estatísticas do mês passado
      prisma.purchase.aggregate({
        where: {
          purchaseDate: { 
            gte: lastMonth,
            lt: currentMonth
          }
        },
        _count: { id: true },
        _sum: { totalAmount: true }
      })
    ])

    const topProductsWithNames = await Promise.all(
      topProducts.map(async (item) => {
        const product = item.productId ? await prisma.product.findUnique({
          where: { id: item.productId },
          include: { 
            brand: true,
            category: true
          }
        }) : null
        return {
          productId: item.productId,
          productName: product?.name || 'Produto não encontrado',
          unit: product?.unit || 'unidade',
          totalPurchases: item._count.productId,
          totalQuantity: item._sum.quantity || 0,
          averagePrice: item._avg.unitPrice || 0
        }
      })
    )

    const marketComparisonWithNames = await Promise.all(
      marketComparison.map(async (item) => {
        const market = await prisma.market.findUnique({
          where: { id: item.marketId }
        })
        return {
          marketId: item.marketId,
          marketName: market?.name || 'Mercado não encontrado',
          totalPurchases: item._count.id,
          averagePrice: item._avg.totalAmount || 0
        }
      })
    )

    // Calcular comparação mensal
    const currentMonthTotal = currentMonthStats?._sum?.totalAmount || 0
    const lastMonthTotal = lastMonthStats?._sum?.totalAmount || 0
    const currentMonthPurchases = currentMonthStats?._count?.id || 0
    const lastMonthPurchases = lastMonthStats?._count?.id || 0
    
    const monthlyComparison = {
      currentMonth: {
        totalSpent: currentMonthTotal,
        totalPurchases: currentMonthPurchases,
        averagePerPurchase: currentMonthPurchases > 0 ? currentMonthTotal / currentMonthPurchases : 0
      },
      lastMonth: {
        totalSpent: lastMonthTotal,
        totalPurchases: lastMonthPurchases,
        averagePerPurchase: lastMonthPurchases > 0 ? lastMonthTotal / lastMonthPurchases : 0
      },
      spentChange: lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
      purchasesChange: lastMonthPurchases > 0 ? ((currentMonthPurchases - lastMonthPurchases) / lastMonthPurchases) * 100 : 0
    }

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

    const stats = {
      totalPurchases,
      totalSpent: totalSpent._sum.totalAmount || 0,
      totalProducts,
      totalMarkets,
      recentPurchases,
      topProducts: topProductsWithNames.filter(p => p.productId), // Filtrar produtos nulos
      marketComparison: marketComparisonWithNames,
      monthlyComparison,
      categoryStats: categoryStatsProcessed
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}