// src/app/api/products/healthy-alternatives/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const excludeProductId = searchParams.get('excludeProductId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!categoryId) {
      return NextResponse.json({ alternatives: [] });
    }

    // Buscar produtos da mesma categoria que têm informações nutricionais
    const productsWithNutrition = await prisma.product.findMany({
      where: {
        categoryId,
        nutritionalInfo: {
          isNot: null
        },
        ...(excludeProductId ? { 
          id: { not: excludeProductId } 
        } : {})
      },
      include: {
        nutritionalInfo: true,
        brand: true,
        category: true
      }
    });

    if (productsWithNutrition.length === 0) {
      return NextResponse.json({ alternatives: [] });
    }

    // Calcular score de saúde para cada produto
    const productsWithHealthScore = productsWithNutrition.map(product => {
      const nutrition = product.nutritionalInfo!;
      let healthScore = 100;

      // Penalidades baseadas em critérios nutricionais
      // Calorias por 100g/ml
      if (nutrition.calories) {
        if (nutrition.calories > 400) healthScore -= 20;
        else if (nutrition.calories > 300) healthScore -= 10;
        else if (nutrition.calories < 150) healthScore += 10;
      }

      // Sódio (mg por 100g/ml)
      if (nutrition.sodium) {
        if (nutrition.sodium > 600) healthScore -= 25;
        else if (nutrition.sodium > 400) healthScore -= 15;
        else if (nutrition.sodium > 200) healthScore -= 5;
        else if (nutrition.sodium < 100) healthScore += 10;
      }

      // Açúcares totais
      if (nutrition.totalSugars) {
        if (nutrition.totalSugars > 20) healthScore -= 20;
        else if (nutrition.totalSugars > 10) healthScore -= 10;
        else if (nutrition.totalSugars < 5) healthScore += 10;
      }

      // Gorduras saturadas
      if (nutrition.saturatedFat) {
        if (nutrition.saturatedFat > 10) healthScore -= 20;
        else if (nutrition.saturatedFat > 5) healthScore -= 10;
        else if (nutrition.saturatedFat < 2) healthScore += 10;
      }

      // Gorduras trans (muito prejudicial)
      if (nutrition.transFat) {
        if (nutrition.transFat > 0.5) healthScore -= 30;
        else if (nutrition.transFat > 0) healthScore -= 15;
      }

      // Bônus por nutrientes benéficos
      // Fibras
      if (nutrition.fiber) {
        if (nutrition.fiber > 10) healthScore += 20;
        else if (nutrition.fiber > 6) healthScore += 15;
        else if (nutrition.fiber > 3) healthScore += 10;
      }

      // Proteínas
      if (nutrition.proteins) {
        if (nutrition.proteins > 20) healthScore += 15;
        else if (nutrition.proteins > 12) healthScore += 10;
        else if (nutrition.proteins > 6) healthScore += 5;
      }

      // Alérgenos reduzem o score se houver muitos
      const totalAllergens = nutrition.allergensContains.length + nutrition.allergensMayContain.length;
      if (totalAllergens > 5) healthScore -= 10;
      else if (totalAllergens > 3) healthScore -= 5;

      return {
        ...product,
        healthScore: Math.max(0, Math.min(100, healthScore))
      };
    });

    // Ordenar por score de saúde (maior para menor)
    const sortedProducts = productsWithHealthScore
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, limit);

    // Buscar preços médios dos últimos 3 meses para cada produto
    const threeMontshAgo = new Date();
    threeMontshAgo.setMonth(threeMontshAgo.getMonth() - 3);

    const productsWithPrices = await Promise.all(
      sortedProducts.map(async (product) => {
        const averagePrice = await prisma.purchaseItem.aggregate({
          where: {
            productId: product.id,
            purchase: {
              purchaseDate: {
                gte: threeMontshAgo
              }
            }
          },
          _avg: {
            unitPrice: true
          },
          _count: {
            id: true
          }
        });

        return {
          id: product.id,
          name: product.name,
          unit: product.unit,
          barcode: product.barcode,
          brand: product.brand,
          category: product.category,
          healthScore: product.healthScore,
          nutritionalInfo: {
            calories: product.nutritionalInfo?.calories,
            proteins: product.nutritionalInfo?.proteins,
            carbohydrates: product.nutritionalInfo?.carbohydrates,
            totalFat: product.nutritionalInfo?.totalFat,
            saturatedFat: product.nutritionalInfo?.saturatedFat,
            transFat: product.nutritionalInfo?.transFat,
            fiber: product.nutritionalInfo?.fiber,
            sodium: product.nutritionalInfo?.sodium,
            totalSugars: product.nutritionalInfo?.totalSugars,
            servingSize: product.nutritionalInfo?.servingSize,
            allergensContains: product.nutritionalInfo?.allergensContains || [],
            allergensMayContain: product.nutritionalInfo?.allergensMayContain || []
          },
          averagePrice: averagePrice._avg.unitPrice || null,
          purchaseCount: averagePrice._count || 0,
          
          // Razões pelas quais é mais saudável
          healthReasons: getHealthReasons(product.nutritionalInfo!, product.healthScore)
        };
      })
    );

    return NextResponse.json({ 
      alternatives: productsWithPrices,
      categoryName: sortedProducts[0]?.category?.name || 'Produtos'
    });

  } catch (error) {
    console.error('[Healthy Alternatives API]', error);
    return handleApiError(error);
  }
}

function getHealthReasons(nutrition: any, healthScore: number): string[] {
  const reasons: string[] = [];

  // Razões positivas
  if (nutrition.fiber && nutrition.fiber > 6) {
    reasons.push(`Rico em fibras (${nutrition.fiber}g)`);
  }

  if (nutrition.proteins && nutrition.proteins > 12) {
    reasons.push(`Rico em proteínas (${nutrition.proteins}g)`);
  }

  if (nutrition.sodium && nutrition.sodium < 200) {
    reasons.push(`Baixo sódio (${nutrition.sodium}mg)`);
  }

  if (nutrition.saturatedFat && nutrition.saturatedFat < 3) {
    reasons.push(`Baixo em gordura saturada (${nutrition.saturatedFat}g)`);
  }

  if (nutrition.totalSugars && nutrition.totalSugars < 5) {
    reasons.push(`Baixo açúcar (${nutrition.totalSugars}g)`);
  }

  if (nutrition.transFat === 0 || !nutrition.transFat) {
    reasons.push('Sem gordura trans');
  }

  if (nutrition.calories && nutrition.calories < 200) {
    reasons.push(`Baixas calorias (${nutrition.calories} kcal)`);
  }

  // Se não houver razões específicas, adicionar razão geral baseada no score
  if (reasons.length === 0) {
    if (healthScore >= 80) {
      reasons.push('Excelente perfil nutricional');
    } else if (healthScore >= 70) {
      reasons.push('Bom perfil nutricional');
    } else if (healthScore >= 60) {
      reasons.push('Perfil nutricional moderado');
    }
  }

  return reasons.slice(0, 3); // Máximo 3 razões
}