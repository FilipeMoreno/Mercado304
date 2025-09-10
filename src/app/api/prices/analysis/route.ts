import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const marketId = searchParams.get('marketId');
    const days = parseInt(searchParams.get('days') || '90');

    // Data de corte
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Base query conditions
    const whereConditions: any = {
      recordDate: { gte: startDate }
    };

    if (productId) whereConditions.productId = productId;
    if (marketId) whereConditions.marketId = marketId;

    // Buscar registros de preços
    const priceRecords = await prisma.priceRecord.findMany({
      where: whereConditions,
      include: {
        product: {
          include: {
            brand: true,
            category: true
          }
        },
        market: true
      },
      orderBy: { recordDate: 'desc' }
    });

    // Buscar compras para complementar dados
    const purchaseItems = await prisma.purchaseItem.findMany({
      where: {
        ...(productId && { productId }),
        purchase: {
          ...(marketId && { marketId }),
          purchaseDate: { gte: startDate }
        }
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true
          }
        },
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

    // Combinar dados de preços
    const combinedPriceData = [
      ...priceRecords.map(record => ({
        id: record.id,
        productId: record.productId,
        productName: record.product.name,
        productBrand: record.product.brand?.name,
        productCategory: record.product.category?.name,
        marketId: record.marketId,
        marketName: record.market.name,
        marketLocation: record.market.location,
        price: record.price,
        date: record.recordDate,
        source: 'price_record' as const,
        notes: record.notes
      })),
      ...purchaseItems.map(item => ({
        id: item.id,
        productId: item.productId!,
        productName: item.product?.name || item.productName,
        productBrand: item.product?.brand?.name || item.brandName,
        productCategory: item.product?.category?.name || item.productCategory,
        marketId: item.purchase.marketId,
        marketName: item.purchase.market.name,
        marketLocation: item.purchase.market.location,
        price: item.unitPrice,
        date: item.purchase.purchaseDate,
        source: 'purchase' as const,
        notes: null,
        quantity: item.quantity
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Análises
    const analysis = {
      totalRecords: combinedPriceData.length,
      priceRecordsCount: priceRecords.length,
      purchasesCount: purchaseItems.length,
      
      // Análise por produto
      byProduct: {} as Record<string, any>,
      
      // Análise por mercado  
      byMarket: {} as Record<string, any>,
      
      // Tendências gerais
      trends: {
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        priceRange: 0,
        mostCommonMarket: '',
        mostCommonProduct: '',
        recentTrend: 'stable' as 'up' | 'down' | 'stable'
      }
    };

    if (combinedPriceData.length > 0) {
      const prices = combinedPriceData.map(item => item.price);
      analysis.trends.avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      analysis.trends.minPrice = Math.min(...prices);
      analysis.trends.maxPrice = Math.max(...prices);
      analysis.trends.priceRange = analysis.trends.maxPrice - analysis.trends.minPrice;

      // Produto mais comum
      const productCounts = combinedPriceData.reduce((acc, item) => {
        if (item.productName) {
          acc[item.productName] = (acc[item.productName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);
      analysis.trends.mostCommonProduct = Object.keys(productCounts).reduce((a, b) => 
        productCounts[a] > productCounts[b] ? a : b
      );

      // Mercado mais comum
      const marketCounts = combinedPriceData.reduce((acc, item) => {
        acc[item.marketName] = (acc[item.marketName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      analysis.trends.mostCommonMarket = Object.keys(marketCounts).reduce((a, b) => 
        marketCounts[a] > marketCounts[b] ? a : b
      );

      // Análise de tendência (últimos 30 dias vs 30-60 dias atrás)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const recentPrices = combinedPriceData.filter(item => new Date(item.date) >= thirtyDaysAgo);
      const olderPrices = combinedPriceData.filter(item => 
        new Date(item.date) >= sixtyDaysAgo && new Date(item.date) < thirtyDaysAgo
      );

      if (recentPrices.length > 0 && olderPrices.length > 0) {
        const recentAvg = recentPrices.reduce((sum, item) => sum + item.price, 0) / recentPrices.length;
        const olderAvg = olderPrices.reduce((sum, item) => sum + item.price, 0) / olderPrices.length;
        
        const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;
        
        if (Math.abs(changePercent) > 5) {
          analysis.trends.recentTrend = changePercent > 0 ? 'up' : 'down';
        }
      }
    }

    // Análise por produto
    const productGroups = combinedPriceData.reduce((acc, item) => {
      const key = `${item.productId}-${item.productName}`;
      if (!acc[key]) {
        acc[key] = {
          productId: item.productId,
          productName: item.productName,
          productBrand: item.productBrand,
          productCategory: item.productCategory,
          prices: [],
          markets: new Set(),
          sources: { price_record: 0, purchase: 0 }
        };
      }
      
      acc[key].prices.push({ price: item.price, date: item.date, market: item.marketName });
      acc[key].markets.add(item.marketName);
      acc[key].sources[item.source]++;
      
      return acc;
    }, {} as Record<string, any>);

    Object.keys(productGroups).forEach(key => {
      const product = productGroups[key];
      const prices = product.prices.map((p: any) => p.price);
      
      analysis.byProduct[key] = {
        ...product,
        markets: Array.from(product.markets),
        stats: {
          count: prices.length,
          avgPrice: prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          priceRange: Math.max(...prices) - Math.min(...prices)
        }
      };
    });

    // Análise por mercado
    const marketGroups = combinedPriceData.reduce((acc, item) => {
      const key = `${item.marketId}-${item.marketName}`;
      if (!acc[key]) {
        acc[key] = {
          marketId: item.marketId,
          marketName: item.marketName,
          marketLocation: item.marketLocation,
          prices: [],
          products: new Set(),
          sources: { price_record: 0, purchase: 0 }
        };
      }
      
      acc[key].prices.push({ price: item.price, date: item.date, product: item.productName });
      acc[key].products.add(item.productName);
      acc[key].sources[item.source]++;
      
      return acc;
    }, {} as Record<string, any>);

    Object.keys(marketGroups).forEach(key => {
      const market = marketGroups[key];
      const prices = market.prices.map((p: any) => p.price);
      
      analysis.byMarket[key] = {
        ...market,
        products: Array.from(market.products),
        stats: {
          count: prices.length,
          avgPrice: prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length,
          minPrice: Math.min(...prices),
          maxPrice: Math.max(...prices),
          priceRange: Math.max(...prices) - Math.min(...prices)
        }
      };
    });

    // Previsões e insights
    const insights = [];
    
    if (analysis.trends.recentTrend === 'up') {
      insights.push({
        type: 'warning',
        title: 'Tendência de Alta',
        message: `Os preços estão subindo nos últimos 30 dias. Considere comprar em breve.`,
        confidence: 0.8
      });
    } else if (analysis.trends.recentTrend === 'down') {
      insights.push({
        type: 'success',
        title: 'Tendência de Baixa',
        message: `Os preços estão caindo. É um bom momento para comprar.`,
        confidence: 0.8
      });
    }

    if (analysis.trends.priceRange > analysis.trends.avgPrice * 0.3) {
      insights.push({
        type: 'info',
        title: 'Grande Variação de Preços',
        message: `Há uma diferença significativa de preços entre mercados. Vale a pena pesquisar.`,
        confidence: 0.9
      });
    }

    return NextResponse.json({
      success: true,
      data: combinedPriceData,
      analysis,
      insights
    });

  } catch (error) {
    console.error('Erro na análise de preços:', error);
    return handleApiError(error);
  }
}