// src/app/api/dashboard/payment-stats/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = {}
    
    // Filtros de data
    if (dateFrom || dateTo) {
      where.purchaseDate = {}
      if (dateFrom) {
        where.purchaseDate.gte = new Date(`${dateFrom}T00:00:00.000Z`)
      }
      if (dateTo) {
        where.purchaseDate.lte = new Date(`${dateTo}T23:59:59.999Z`)
      }
    }

    // Estatísticas por método de pagamento
    const paymentStats = await prisma.purchase.groupBy({
      by: ['paymentMethod'],
      where,
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      },
      _avg: {
        totalAmount: true
      }
    })

    // Estatísticas mensais por método de pagamento
    const monthlyStats = await prisma.$queryRaw`
      SELECT 
        "paymentMethod",
        DATE_TRUNC('month', "purchaseDate") as month,
        COUNT(*) as count,
        SUM("totalAmount") as total
      FROM purchases 
      ${dateFrom || dateTo ? `WHERE "purchaseDate" BETWEEN ${dateFrom ? `'${dateFrom}T00:00:00.000Z'` : '\'1970-01-01\''} AND ${dateTo ? `'${dateTo}T23:59:59.999Z'` : 'NOW()'}` : ''}
      GROUP BY "paymentMethod", DATE_TRUNC('month', "purchaseDate")
      ORDER BY month DESC, "paymentMethod"
    ` as any[]

    // Comparação com período anterior
    let previousPeriodStats = null
    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom)
      const endDate = new Date(dateTo)
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      
      const previousStartDate = new Date(startDate)
      previousStartDate.setDate(previousStartDate.getDate() - daysDiff)
      const previousEndDate = new Date(startDate)
      previousEndDate.setDate(previousEndDate.getDate() - 1)

      previousPeriodStats = await prisma.purchase.groupBy({
        by: ['paymentMethod'],
        where: {
          purchaseDate: {
            gte: previousStartDate,
            lte: previousEndDate
          }
        },
        _count: {
          id: true
        },
        _sum: {
          totalAmount: true
        }
      })
    }

    // Método de pagamento mais usado por mercado
    const paymentByMarket = await prisma.purchase.groupBy({
      by: ['marketId', 'paymentMethod'],
      where,
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    })

    // Buscar informações dos mercados
    const marketIds = [...new Set(paymentByMarket.map(p => p.marketId))]
    const markets = await prisma.market.findMany({
      where: { id: { in: marketIds } },
      select: { id: true, name: true }
    })

    // Mapear métodos de pagamento por mercado
    const paymentByMarketWithNames = paymentByMarket.map(stat => {
      const market = markets.find(m => m.id === stat.marketId)
      return {
        ...stat,
        marketName: market?.name || 'Mercado Desconhecido'
      }
    })

    // Estatísticas totais
    const totalTransactions = paymentStats.reduce((sum, stat) => sum + stat._count.id, 0)
    const totalAmount = paymentStats.reduce((sum, stat) => sum + (stat._sum.totalAmount || 0), 0)

    // Formatação dos labels dos métodos de pagamento
    const paymentMethodLabels: { [key: string]: string } = {
      'MONEY': '💵 Dinheiro',
      'DEBIT': '💳 Cartão de Débito',
      'CREDIT': '💳 Cartão de Crédito',
      'PIX': '📱 PIX',
      'VOUCHER': '🎫 Vale Alimentação/Refeição',
      'CHECK': '📄 Cheque',
      'OTHER': '🔄 Outros'
    }

    // Formatação dos dados para gráficos
    const formattedStats = paymentStats.map(stat => ({
      paymentMethod: stat.paymentMethod,
      label: paymentMethodLabels[stat.paymentMethod] || stat.paymentMethod,
      count: stat._count.id,
      totalAmount: stat._sum.totalAmount || 0,
      averageAmount: stat._avg.totalAmount || 0,
      percentage: totalTransactions > 0 ? (stat._count.id / totalTransactions) * 100 : 0
    }))

    return NextResponse.json({
      paymentStats: formattedStats,
      monthlyStats: monthlyStats.map((stat: any) => ({
        ...stat,
        label: paymentMethodLabels[stat.paymentMethod] || stat.paymentMethod,
        month: stat.month,
        count: Number(stat.count),
        total: Number(stat.total)
      })),
      paymentByMarket: paymentByMarketWithNames,
      previousPeriodStats,
      summary: {
        totalTransactions,
        totalAmount,
        averageTransactionValue: totalTransactions > 0 ? totalAmount / totalTransactions : 0,
        mostUsedMethod: formattedStats.reduce((prev, current) => 
          (prev.count > current.count) ? prev : current, formattedStats[0]
        ),
        highestValueMethod: formattedStats.reduce((prev, current) => 
          (prev.totalAmount > current.totalAmount) ? prev : current, formattedStats[0]
        )
      }
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas de pagamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}