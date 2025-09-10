import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: Request) {
  try {
    const { productName } = await request.json();

    if (!productName) {
      return NextResponse.json(
        { success: false, error: 'Nome do produto é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar produto
    const product = await prisma.product.findFirst({
      where: { name: { contains: productName, mode: 'insensitive' } }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        message: `Produto "${productName}" não encontrado`,
        recommendation: {
          bestDay: 'Qualquer dia',
          confidence: 'Baixa',
          reason: 'Produto não encontrado no histórico',
          savings: 0
        }
      });
    }

    // Buscar registros de preços dos últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const priceRecords = await prisma.priceRecord.findMany({
      where: {
        productId: product.id,
        recordDate: { gte: sixMonthsAgo }
      },
      include: {
        market: true
      },
      orderBy: { recordDate: 'desc' }
    });

    // Buscar compras do produto nos últimos 6 meses
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        productId: product.id,
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
        purchase: { purchaseDate: 'desc' }
      }
    });

    // Combinar dados
    const allData = [
      ...priceRecords.map(record => ({
        price: record.price,
        date: record.recordDate,
        market: record.market.name,
        source: 'record' as const
      })),
      ...purchaseItems.map(item => ({
        price: item.unitPrice,
        date: item.purchase.purchaseDate,
        market: item.purchase.market.name,
        source: 'purchase' as const
      }))
    ];

    if (allData.length === 0) {
      return NextResponse.json({
        success: true,
        productName,
        recommendation: {
          bestDay: 'Qualquer dia',
          confidence: 'Baixa',
          reason: 'Não há dados suficientes para análise',
          savings: 0
        },
        dataPoints: 0
      });
    }

    // Análise por dia da semana
    const dayAnalysis = {
      0: { name: 'Domingo', prices: [] as number[], count: 0 },
      1: { name: 'Segunda', prices: [] as number[], count: 0 },
      2: { name: 'Terça', prices: [] as number[], count: 0 },
      3: { name: 'Quarta', prices: [] as number[], count: 0 },
      4: { name: 'Quinta', prices: [] as number[], count: 0 },
      5: { name: 'Sexta', prices: [] as number[], count: 0 },
      6: { name: 'Sábado', prices: [] as number[], count: 0 }
    };

    // Agrupar por dia da semana
    allData.forEach(item => {
      const dayOfWeek = new Date(item.date).getDay();
      dayAnalysis[dayOfWeek as keyof typeof dayAnalysis].prices.push(item.price);
      dayAnalysis[dayOfWeek as keyof typeof dayAnalysis].count++;
    });

    // Calcular médias por dia
    const dayStats = Object.keys(dayAnalysis).map(dayKey => {
      const day = dayAnalysis[parseInt(dayKey) as keyof typeof dayAnalysis];
      const avgPrice = day.prices.length > 0 
        ? day.prices.reduce((sum, price) => sum + price, 0) / day.prices.length 
        : 0;
      
      return {
        day: parseInt(dayKey),
        name: day.name,
        avgPrice,
        count: day.count,
        minPrice: day.prices.length > 0 ? Math.min(...day.prices) : 0,
        maxPrice: day.prices.length > 0 ? Math.max(...day.prices) : 0
      };
    }).filter(stat => stat.count > 0); // Apenas dias com dados

    if (dayStats.length === 0) {
      return NextResponse.json({
        success: true,
        productName,
        recommendation: {
          bestDay: 'Qualquer dia',
          confidence: 'Baixa',
          reason: 'Dados insuficientes para análise por dia da semana',
          savings: 0
        },
        dataPoints: allData.length
      });
    }

    // Encontrar melhor e pior dia
    const sortedDays = dayStats.sort((a, b) => a.avgPrice - b.avgPrice);
    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];
    
    const potentialSavings = worstDay.avgPrice - bestDay.avgPrice;
    const savingsPercentage = ((potentialSavings / worstDay.avgPrice) * 100);

    // Calcular confiança baseada na quantidade de dados e variação
    let confidence = 'Baixa';
    if (bestDay.count >= 5 && savingsPercentage >= 10) {
      confidence = 'Alta';
    } else if (bestDay.count >= 3 && savingsPercentage >= 5) {
      confidence = 'Média';
    }

    // Análise mensal (para capturar sazonalidade)
    const monthlyAnalysis = allData.reduce((acc, item) => {
      const month = new Date(item.date).getMonth();
      if (!acc[month]) {
        acc[month] = { prices: [], count: 0 };
      }
      acc[month].prices.push(item.price);
      acc[month].count++;
      return acc;
    }, {} as Record<number, { prices: number[], count: number }>);

    const monthlyStats = Object.keys(monthlyAnalysis).map(monthKey => {
      const month = monthlyAnalysis[parseInt(monthKey)];
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      return {
        month: parseInt(monthKey),
        name: monthNames[parseInt(monthKey)],
        avgPrice: month.prices.reduce((sum, price) => sum + price, 0) / month.prices.length,
        count: month.count
      };
    }).sort((a, b) => a.avgPrice - b.avgPrice);

    // Insights adicionais
    const insights = [];
    
    if (savingsPercentage >= 10) {
      insights.push(`Você pode economizar até ${savingsPercentage.toFixed(1)}% comprando na ${bestDay.name}`);
    }
    
    if (monthlyStats.length > 1) {
      const bestMonth = monthlyStats[0];
      insights.push(`Historicamente, ${bestMonth.name} tem os melhores preços para este produto`);
    }

    const totalDataPoints = allData.length;
    const recordsPercentage = (priceRecords.length / totalDataPoints * 100);
    
    if (recordsPercentage > 50) {
      insights.push('Análise baseada principalmente em registros de preços coletados');
    } else if (recordsPercentage > 20) {
      insights.push('Análise combina dados de compras e registros de preços');
    } else {
      insights.push('Análise baseada principalmente no histórico de compras');
    }

    return NextResponse.json({
      success: true,
      productName,
      recommendation: {
        bestDay: bestDay.name,
        bestDayNumber: bestDay.day,
        avgPrice: bestDay.avgPrice,
        confidence,
        reason: confidence === 'Alta' 
          ? `Com base em ${bestDay.count} observações, ${bestDay.name} tem consistentemente os melhores preços`
          : confidence === 'Média'
          ? `Dados sugerem que ${bestDay.name} pode ter preços melhores, mas são necessárias mais observações`
          : `Dados limitados, mas ${bestDay.name} aparenta ter preços ligeiramente melhores`,
        savings: potentialSavings,
        savingsPercentage
      },
      analysis: {
        dataPoints: totalDataPoints,
        priceRecords: priceRecords.length,
        purchases: purchaseItems.length,
        dayStats,
        monthlyStats: monthlyStats.slice(0, 3), // Top 3 melhores meses
        priceRange: {
          min: Math.min(...allData.map(d => d.price)),
          max: Math.max(...allData.map(d => d.price)),
          avg: allData.reduce((sum, d) => sum + d.price, 0) / allData.length
        }
      },
      insights
    });

  } catch (error) {
    console.error('Erro ao calcular melhor dia para comprar:', error);
    return handleApiError(error);
  }
}