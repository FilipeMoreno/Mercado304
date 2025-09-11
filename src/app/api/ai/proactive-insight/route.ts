import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const { productId, price } = await request.json();

		if (!productId || typeof price !== "number" || price <= 0) {
			return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
		}

		// 1. Buscar histórico de preços de AMBAS as fontes
		const [historicalPurchases, historicalRecords] = await Promise.all([
			prisma.purchaseItem.findMany({
				where: { productId },
				select: { unitPrice: true },
			}),
			prisma.priceRecord.findMany({
				where: { productId },
				select: { price: true },
			}),
		]);

		// 2. Combinar todos os preços históricos
		const allPrices = [
			...historicalPurchases.map((p) => p.unitPrice),
			...historicalRecords.map((r) => r.price),
		];

		if (allPrices.length < 2) {
			return NextResponse.json({ suggestion: null }); // Não há dados suficientes para uma comparação útil
		}

		// 3. Calcular o preço médio e o preço mínimo com base nos dados combinados
		const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
		const _minPrice = Math.min(...allPrices);

		// 4. Definir o gatilho: se o preço atual é 20% mais caro que a média
		if (price > avgPrice * 1.2) {
			// 5. Buscar a melhor alternativa em AMBAS as tabelas
			const [cheapestPurchase] = await prisma.purchaseItem.findMany({
				where: {
					productId,
					unitPrice: { lt: price },
				},
				include: { purchase: { include: { market: true } } },
				orderBy: { unitPrice: "asc" },
				take: 1,
			});

			const [cheapestRecord] = await prisma.priceRecord.findMany({
				where: {
					productId,
					price: { lt: price },
				},
				include: { market: true },
				orderBy: { price: "asc" },
				take: 1,
			});
			
			// Determinar qual é a melhor sugestão (a mais barata de todas)
			let bestSuggestion = null;

			if (cheapestPurchase && cheapestRecord) {
				bestSuggestion =
					cheapestPurchase.unitPrice < cheapestRecord.price
						? { price: cheapestPurchase.unitPrice, market: cheapestPurchase.purchase.market }
						: { price: cheapestRecord.price, market: cheapestRecord.market };
			} else if (cheapestPurchase) {
				bestSuggestion = { price: cheapestPurchase.unitPrice, market: cheapestPurchase.purchase.market };
			} else if (cheapestRecord) {
				bestSuggestion = { price: cheapestRecord.price, market: cheapestRecord.market };
			}

			if (bestSuggestion) {
				return NextResponse.json({
					suggestion: {
						type: "cheaper_same_product",
						message: `Notei que o preço de R$ ${price.toFixed(2)} está acima da média. Encontrei este produto por R$ ${bestSuggestion.price.toFixed(2)} no mercado ${bestSuggestion.market.name}.`,
						actionLabel: "Ver alternativa",
						payload: {
							marketName: bestSuggestion.market.name,
							price: bestSuggestion.price,
						},
					},
				});
			}
		}

		// Se nenhuma sugestão for gerada, retorna nulo
		return NextResponse.json({ suggestion: null });
	} catch (error) {
		console.error("Erro na análise proativa:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}