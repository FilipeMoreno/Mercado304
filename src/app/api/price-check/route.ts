import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const { productId, currentPrice, currentMarketId } = await request.json();

		if (!productId || !currentPrice || !currentMarketId) {
			return NextResponse.json(
				{
					error: "Dados obrigatórios: productId, currentPrice, currentMarketId",
				},
				{ status: 400 },
			);
		}

		// Buscar histórico de preços dos últimos 3 meses
		const threeMonthsAgo = new Date();
		threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

		const historicalPrices = await prisma.purchaseItem.findMany({
			where: {
				productId,
				purchase: {
					purchaseDate: { gte: threeMonthsAgo },
					marketId: { not: currentMarketId }, // Excluir o mercado atual
				},
			},
			include: {
				purchase: {
					include: {
						market: true,
					},
				},
			},
			orderBy: {
				purchase: {
					purchaseDate: "desc",
				},
			},
		});

		if (historicalPrices.length === 0) {
			return NextResponse.json({
				hasAlert: false,
				message: "Não há histórico de preços para comparação",
			});
		}

		// Agrupar por mercado e calcular preço médio
		const marketPrices = historicalPrices.reduce((acc: any, item) => {
			const marketId = item.purchase.marketId;
			if (!acc[marketId]) {
				acc[marketId] = {
					market: item.purchase.market,
					prices: [],
					totalPurchases: 0,
				};
			}
			acc[marketId].prices.push(item.unitPrice);
			acc[marketId].totalPurchases++;
			return acc;
		}, {});

		// Calcular preços médios por mercado
		const marketAverages = Object.values(marketPrices).map((market: any) => ({
			market: market.market,
			avgPrice:
				market.prices.reduce((sum: number, price: number) => sum + price, 0) /
				market.prices.length,
			totalPurchases: market.totalPurchases,
			lastPrice: market.prices[0], // Preço mais recente
		}));

		// Encontrar o mercado com melhor preço
		const cheapestMarket = marketAverages.reduce((prev: any, current: any) =>
			prev.avgPrice < current.avgPrice ? prev : current,
		);

		// Verificar se há oportunidade de economia significativa (>5%)
		const priceDifference = currentPrice - cheapestMarket.avgPrice;
		const percentageDifference = (priceDifference / currentPrice) * 100;

		if (percentageDifference > 5) {
			return NextResponse.json({
				hasAlert: true,
				alertType: "price_warning",
				message: `Este produto pode estar mais barato no ${cheapestMarket.market.name}`,
				details: {
					currentPrice,
					suggestedPrice: cheapestMarket.avgPrice,
					savings: priceDifference,
					savingsPercent: percentageDifference,
					suggestedMarket: cheapestMarket.market,
					totalComparisons: marketAverages.length,
					historicalPurchases: cheapestMarket.totalPurchases,
				},
			});
		}

		// Verificar se o preço está muito acima da média geral
		const overallAverage =
			marketAverages.reduce((sum, market) => sum + market.avgPrice, 0) /
			marketAverages.length;
		const overallDifference =
			((currentPrice - overallAverage) / currentPrice) * 100;

		if (overallDifference > 15) {
			return NextResponse.json({
				hasAlert: true,
				alertType: "high_price",
				message: `Preço acima da média histórica`,
				details: {
					currentPrice,
					averagePrice: overallAverage,
					difference: currentPrice - overallAverage,
					percentDifference: overallDifference,
					marketComparisons: marketAverages.length,
				},
			});
		}

		return NextResponse.json({
			hasAlert: false,
			message: "Preço dentro da faixa normal",
			details: {
				currentPrice,
				averagePrice: overallAverage,
				marketComparisons: marketAverages.length,
			},
		});
	} catch (error) {
		console.error("Erro ao verificar preços:", error);
		return NextResponse.json(
			{ error: "Erro ao verificar preços históricos" },
			{ status: 500 },
		);
	}
}
