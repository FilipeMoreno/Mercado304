import { getDay, parseISO } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const { productId } = await request.json();

		if (!productId) {
			return NextResponse.json(
				{ error: "Product ID é obrigatório" },
				{ status: 400 },
			);
		}

		// Buscar todas as compras do produto
		const purchaseItems = await prisma.purchaseItem.findMany({
			where: { productId },
			include: {
				purchase: true,
			},
			orderBy: {
				purchase: {
					purchaseDate: "asc",
				},
			},
		});

		if (purchaseItems.length === 0) {
			return NextResponse.json({
				message: "Não há histórico de compras para este produto.",
			});
		}

		const dayAnalysis = purchaseItems.reduce((acc: any, item) => {
			const dayOfWeek = getDay(
				parseISO(item.purchase.purchaseDate.toISOString()),
			); // 0 = Domingo, 1 = Segunda, etc.

			if (!acc[dayOfWeek]) {
				acc[dayOfWeek] = {
					day: dayOfWeek,
					totalPrice: 0,
					totalQuantity: 0,
					purchaseCount: 0,
				};
			}

			acc[dayOfWeek].totalPrice += item.unitPrice;
			acc[dayOfWeek].totalQuantity += item.quantity;
			acc[dayOfWeek].purchaseCount++;

			return acc;
		}, {});

		// Calcular a média de preço por dia
		const results = Object.values(dayAnalysis)
			.map((dayData: any) => ({
				dayOfWeek: dayData.day,
				averagePrice: dayData.totalPrice / dayData.purchaseCount,
				purchaseCount: dayData.purchaseCount,
			}))
			.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

		return NextResponse.json(results);
	} catch (error) {
		console.error("Erro ao analisar dia da semana:", error);
		return NextResponse.json(
			{ error: "Erro ao analisar dia da semana" },
			{ status: 500 },
		);
	}
}
