import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { type = 'weekly', includeUrgent = true, includeRegular = true } = await request.json()

    // Buscar padrões de consumo diretamente
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const purchases = await prisma.purchaseItem.findMany({
      where: {
        purchase: {
          purchaseDate: { gte: sixMonthsAgo }
        },
        productId: { not: null }
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true
          }
        },
        purchase: true
      },
      orderBy: {
        purchase: {
          purchaseDate: 'asc'
        }
      }
    })

    // Processar padrões (mesmo código da API consumption-patterns)
    const productConsumption = purchases.reduce((acc: any, item) => {
      const productId = item.productId!
      if (!acc[productId]) {
        acc[productId] = {
          product: item.product,
          purchases: [],
          totalQuantity: 0
        }
      }
      
      acc[productId].purchases.push({
        date: item.purchase.purchaseDate,
        quantity: item.quantity,
        daysSinceEpoch: Math.floor(item.purchase.purchaseDate.getTime() / (1000 * 60 * 60 * 24))
      })
      acc[productId].totalQuantity += item.quantity
      
      return acc
    }, {})

    const patterns = Object.values(productConsumption).map((product: any) => {
      const purchases = product.purchases.sort((a: any, b: any) => a.daysSinceEpoch - b.daysSinceEpoch)
      
      if (purchases.length < 2) return null

      const intervals = []
      for (let i = 1; i < purchases.length; i++) {
        intervals.push(purchases[i].daysSinceEpoch - purchases[i-1].daysSinceEpoch)
      }

      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      const avgQuantity = product.totalQuantity / purchases.length
      const lastPurchase = purchases[purchases.length - 1]
      const daysSinceLastPurchase = Math.floor(Date.now() / (1000 * 60 * 60 * 24)) - lastPurchase.daysSinceEpoch
      const nextPurchaseExpected = lastPurchase.daysSinceEpoch + avgInterval
      const daysUntilNextPurchase = nextPurchaseExpected - Math.floor(Date.now() / (1000 * 60 * 60 * 24))
      const urgency = Math.max(0, Math.min(100, ((avgInterval - daysUntilNextPurchase) / avgInterval) * 100))
      
      const isRegularPurchase = purchases.length >= 3
      const hasRegularPattern = intervals.length > 0 && 
        (Math.max(...intervals) - Math.min(...intervals)) / avgInterval < 0.5

      return {
        product: product.product,
        consumption: {
          totalPurchases: purchases.length,
          avgIntervalDays: Math.round(avgInterval),
          avgQuantityPerPurchase: avgQuantity,
          lastPurchaseDate: lastPurchase.date,
          daysSinceLastPurchase,
          daysUntilNextPurchase: Math.round(daysUntilNextPurchase),
          urgency: Math.round(urgency),
          isRegularPurchase,
          hasRegularPattern,
          confidence: isRegularPurchase && hasRegularPattern ? 
            Math.min(95, 60 + (purchases.length * 5)) : 30
        }
      }
    }).filter(pattern => pattern !== null)

    const patternsData = { patterns }

    if (!patternsData.patterns) {
      return NextResponse.json({
        success: false,
        message: 'Não há dados suficientes para gerar lista automática'
      })
    }

    // Filtrar produtos para incluir na lista
    const candidateProducts = patternsData.patterns.filter((pattern: any) => {
      const consumption = pattern.consumption
      
      // Incluir produtos urgentes (próximos de acabar)
      if (includeUrgent && consumption.shouldReplenish && consumption.urgency >= 60) {
        return true
      }

      // Incluir produtos com padrão regular baseado no tipo de lista
      if (includeRegular && consumption.hasRegularPattern) {
        if (type === 'weekly') {
          // Para lista semanal: produtos com intervalo <= 10 dias
          return consumption.avgIntervalDays <= 10 && consumption.daysUntilNextPurchase <= 3
        } else if (type === 'monthly') {
          // Para lista mensal: produtos com intervalo <= 35 dias
          return consumption.avgIntervalDays <= 35 && consumption.daysUntilNextPurchase <= 7
        }
      }

      return false
    })

    // Organizar por categorias
    const itemsByCategory = candidateProducts.reduce((acc: any, pattern: any) => {
      const categoryName = pattern.product.category?.name || 'Outros'
      
      if (!acc[categoryName]) {
        acc[categoryName] = []
      }
      
      acc[categoryName].push({
        productId: pattern.product.id,
        productName: pattern.product.name,
        brandName: pattern.product.brand?.name,
        unit: pattern.product.unit,
        suggestedQuantity: Math.ceil(pattern.consumption.avgQuantityPerPurchase),
        urgency: pattern.consumption.urgency,
        confidence: pattern.consumption.confidence,
        lastPurchased: pattern.consumption.lastPurchaseDate,
        expectedNextPurchase: pattern.consumption.nextPurchaseExpected,
        daysUntilNext: pattern.consumption.daysUntilNextPurchase
      })
      
      return acc
    }, {})

    // Ordenar itens dentro de cada categoria por urgência
    Object.keys(itemsByCategory).forEach(category => {
      itemsByCategory[category].sort((a: any, b: any) => b.urgency - a.urgency)
    })

    // Criar sugestões inteligentes adicionais
    const suggestions = []

    // Analisar produtos frequentes que não foram comprados recentemente
    const frequentProducts = patternsData.patterns
      .filter((p: any) => p.consumption.totalPurchases >= 5 && p.consumption.daysSinceLastPurchase > 30)
      .slice(0, 3)

    if (frequentProducts.length > 0) {
      suggestions.push({
        type: 'forgotten_favorites',
        title: 'Favoritos Esquecidos',
        description: 'Produtos que você comprava frequentemente',
        items: frequentProducts.map((p: any) => ({
          productId: p.product.id,
          productName: p.product.name,
          lastPurchased: p.consumption.lastPurchaseDate,
          daysSince: p.consumption.daysSinceLastPurchase,
          totalPurchases: p.consumption.totalPurchases
        }))
      })
    }

    // Sugerir produtos sazonais ou de estoque
    const seasonalSuggestions = await getSeasonalSuggestions()
    if (seasonalSuggestions.length > 0) {
      suggestions.push({
        type: 'seasonal',
        title: 'Sugestões Sazonais',
        description: 'Produtos típicos para esta época',
        items: seasonalSuggestions
      })
    }

    const totalItems = Object.values(itemsByCategory).reduce((sum: number, items: any) => sum + items.length, 0)

    return NextResponse.json({
      success: true,
      listType: type,
      totalItems,
      itemsByCategory,
      suggestions,
      metadata: {
        generatedAt: new Date(),
        basedOnPurchases: patternsData.patterns.length,
        confidence: candidateProducts.length > 0 ? 
          Math.round(candidateProducts.reduce((sum: number, p: any) => sum + p.consumption.confidence, 0) / candidateProducts.length) : 0
      }
    })

  } catch (error) {
    console.error('Erro ao gerar lista automática:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar lista automática' },
      { status: 500 }
    )
  }
}

async function getSeasonalSuggestions() {
  try {
    const currentMonth = new Date().getMonth() + 1
    
    // Produtos sazonais simples baseados no mês
    const seasonalMap: { [key: number]: string[] } = {
      12: ['panetone', 'uva', 'tender', 'champagne'], // Dezembro
      1: ['protetor solar', 'água', 'frutas'], // Janeiro
      6: ['chocolate quente', 'sopa', 'vinho'], // Junho
      // Adicionar mais conforme necessário
    }

    const seasonalKeywords = seasonalMap[currentMonth] || []
    
    if (seasonalKeywords.length === 0) return []

    // Buscar produtos que contenham as palavras-chave sazonais
    const seasonalProducts = await prisma.product.findMany({
      where: {
        OR: seasonalKeywords.map(keyword => ({
          name: {
            contains: keyword,
            mode: 'insensitive'
          }
        }))
      },
      include: {
        brand: true,
        category: true
      },
      take: 5
    })

    return seasonalProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      brandName: product.brand?.name,
      reason: 'Produto sazonal típico para esta época'
    }))
  } catch (error) {
    console.error('Erro ao buscar sugestões sazonais:', error)
    return []
  }
}