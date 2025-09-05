import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { listId, marketIds } = await request.json();

    if (!listId || !marketIds || !Array.isArray(marketIds) || marketIds.length < 2) {
      return NextResponse.json(
        { error: 'ID da lista e pelo menos 2 mercados são obrigatórios' },
        { status: 400 }
      );
    }

    const shoppingList = await prisma.shoppingList.findUnique({
      where: { id: listId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!shoppingList) {
      return NextResponse.json(
        { error: 'Lista não encontrada' },
        { status: 404 }
      );
    }

    const markets = await prisma.market.findMany({
      where: { id: { in: marketIds } },
    });

    if (markets.length !== marketIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais mercados não foram encontrados' },
        { status: 404 }
      );
    }

    // --- CORREÇÃO APLICADA AQUI ---
    // Mapeia e depois filtra para garantir que não há IDs nulos
    const productIds = shoppingList.items
      .map((item) => item.productId)
      .filter((id): id is string => !!id);

    const productsWithPrices = await Promise.all(
      productIds.map(async (productId) => {
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { brand: true },
        });

        const prices = await Promise.all(
          marketIds.map(async (marketId) => {
            const purchaseItem = await prisma.purchaseItem.findFirst({
              where: {
                productId,
                purchase: {
                  marketId,
                },
              },
              orderBy: {
                purchase: {
                  purchaseDate: 'desc',
                },
              },
              select: {
                unitPrice: true,
                purchase: { select: { purchaseDate: true } },
              },
            });

            return {
              marketId,
              price: purchaseItem ? purchaseItem.unitPrice : null,
              lastPurchase: purchaseItem ? purchaseItem.purchase.purchaseDate : null,
            };
          })
        );

        return {
          product,
          prices,
        };
      })
    );

    const productsToCompare = productsWithPrices.map((productData) => {
      const cheapestPrice = productData.prices.reduce((cheapest, current) => {
        if (current.price === null) return cheapest;
        if (cheapest.price === null || current.price < cheapest.price) {
          return current;
        }
        return cheapest;
      }, { price: null as number | null, marketId: null });

      const priceComparison = productData.prices.map(priceInfo => {
        const saving = cheapestPrice.price !== null && priceInfo.price !== null
          ? priceInfo.price - cheapestPrice.price
          : 0;

        return {
          ...priceInfo,
          isCheapest: priceInfo.marketId === cheapestPrice.marketId,
          saving: saving > 0 ? saving : 0
        };
      });

      return {
        product: productData.product,
        comparison: priceComparison
      };
    });

    return NextResponse.json({
      listId,
      listName: shoppingList.name,
      markets: markets.map(m => ({ id: m.id, name: m.name, location: m.location })),
      products: productsToCompare,
    });

  } catch (error) {
    console.error('Erro ao realizar comparação de lista detalhada:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar comparação de lista detalhada' },
      { status: 500 }
    );
  }
}