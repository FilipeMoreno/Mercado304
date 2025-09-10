import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		const now = new Date();
		const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
		const today = new Date(
			now.getFullYear(),
			now.getMonth(),
			now.getDate(),
			23,
			59,
			59,
		);

		// Buscar itens do estoque com data de validade
		const stockItems = await prisma.stockItem.findMany({
			where: {
				expirationDate: { not: null },
				quantity: { gt: 0 },
				isExpired: false,
			},
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					},
				},
			},
			orderBy: {
				expirationDate: "asc",
			},
		});

		// Categorizar por urgência
		const expiredItems = stockItems.filter(
			(item) => item.expirationDate && item.expirationDate <= now,
		);

		const expiringToday = stockItems.filter(
			(item) =>
				item.expirationDate &&
				item.expirationDate > now &&
				item.expirationDate <= today,
		);

		const expiringSoon = stockItems.filter(
			(item) =>
				item.expirationDate &&
				item.expirationDate > today &&
				item.expirationDate <= threeDaysFromNow,
		);

		// Marcar itens vencidos no banco
		if (expiredItems.length > 0) {
			await prisma.stockItem.updateMany({
				where: {
					id: { in: expiredItems.map((item) => item.id) },
				},
				data: {
					isExpired: true,
				},
			});

			// Registrar movimentos de vencimento
			await Promise.all(
				expiredItems.map((item) =>
					prisma.stockMovement.create({
						data: {
							stockItemId: item.id,
							type: "VENCIMENTO",
							quantity: item.quantity,
							reason: "Produto vencido automaticamente",
						},
					}),
				),
			);
		}

		// Buscar alertas de estoque baixo
		const lowStockItems = await prisma.stockItem.findMany({
			where: {
				isLowStock: true,
				quantity: { gt: 0 },
			},
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					},
				},
			},
		});

		// Calcular valor do estoque próximo ao vencimento
		const wasteValue = [
			...expiredItems,
			...expiringToday,
			...expiringSoon,
		].reduce(
			(sum, item) => sum + (item.unitCost ? item.quantity * item.unitCost : 0),
			0,
		);

		// Estatísticas
		const stats = {
			totalAlerts:
				expiredItems.length +
				expiringToday.length +
				expiringSoon.length +
				lowStockItems.length,
			expired: expiredItems.length,
			expiringToday: expiringToday.length,
			expiringSoon: expiringSoon.length,
			lowStock: lowStockItems.length,
			potentialWasteValue: wasteValue,
		};

		// Sugestões de ação
		const actionSuggestions = [];

		if (expiredItems.length > 0) {
			actionSuggestions.push({
				type: "remove_expired",
				title: "Remover Produtos Vencidos",
				description: `${expiredItems.length} item(ns) vencido(s) devem ser removidos`,
				priority: "high",
				items: expiredItems.map((item) => item.id),
			});
		}

		if (expiringToday.length > 0) {
			actionSuggestions.push({
				type: "use_today",
				title: "Usar Hoje",
				description: `${expiringToday.length} item(ns) vencem hoje`,
				priority: "high",
				items: expiringToday.map((item) => ({
					id: item.id,
					name: item.product.name,
					quantity: item.quantity,
					unit: item.product.unit,
				})),
			});
		}

		if (lowStockItems.length > 0) {
			actionSuggestions.push({
				type: "replenish_stock",
				title: "Repor Estoque",
				description: `${lowStockItems.length} produto(s) com estoque baixo`,
				priority: "medium",
				items: lowStockItems.map((item) => item.id),
			});
		}

		return NextResponse.json({
			alerts: {
				expired: expiredItems,
				expiringToday,
				expiringSoon,
				lowStock: lowStockItems,
			},
			stats,
			actionSuggestions,
			lastChecked: now,
		});
	} catch (error) {
		console.error("Erro ao buscar alertas:", error);
		return NextResponse.json(
			{ error: "Erro ao buscar alertas de validade" },
			{ status: 500 },
		);
	}
}

// POST - Processar ações em lote (marcar como usado, remover vencidos, etc)
export async function POST(request: Request) {
	try {
		const { action, itemIds, consumedQuantities } = await request.json();

		switch (action) {
			case "mark_expired":
				await prisma.stockItem.updateMany({
					where: { id: { in: itemIds } },
					data: { isExpired: true },
				});

				// Registrar movimentos
				await Promise.all(
					itemIds.map((id: string) =>
						prisma.stockMovement.create({
							data: {
								stockItemId: id,
								type: "VENCIMENTO",
								quantity: 0, // Será atualizado com a quantidade real
								reason: "Marcado como vencido manualmente",
							},
						}),
					),
				);
				break;

			case "consume_items":
				if (consumedQuantities) {
					await Promise.all(
						Object.entries(consumedQuantities).map(
							async ([itemId, consumed]: [string, any]) => {
								const item = await prisma.stockItem.findUnique({
									where: { id: itemId },
									include: { product: true },
								});

								if (item) {
									const newQuantity = Math.max(0, item.quantity - consumed);

									await prisma.stockItem.update({
										where: { id: itemId },
										data: {
											quantity: newQuantity,
											isLowStock:
												item.product.hasStock && item.product.minStock
													? newQuantity <= item.product.minStock
													: false,
										},
									});

									await prisma.stockMovement.create({
										data: {
											stockItemId: itemId,
											type: "SAIDA",
											quantity: consumed,
											reason: "Consumo antes do vencimento",
										},
									});
								}
							},
						),
					);
				}
				break;

			default:
				return NextResponse.json(
					{ error: "Ação não reconhecida" },
					{ status: 400 },
				);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Erro ao processar ação:", error);
		return NextResponse.json(
			{ error: "Erro ao processar ação" },
			{ status: 500 },
		);
	}
}
