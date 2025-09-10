import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Entrada automática no estoque baseada em compra
export async function POST(request: Request) {
	try {
		const { purchaseId, items } = await request.json();

		if (!purchaseId || !items || !Array.isArray(items)) {
			return NextResponse.json(
				{ error: "ID da compra e itens são obrigatórios" },
				{ status: 400 },
			);
		}

		const createdStockItems = [];

		for (const item of items) {
			const {
				productId,
				quantity,
				unitPrice,
				expirationDate,
				location = "Despensa",
				batchNumber,
			} = item;

			if (!productId || !quantity) continue;

			// Buscar produto para verificar configurações
			const product = await prisma.product.findUnique({
				where: { id: productId },
			});

			if (!product) continue;

			// Calcular data de validade se produto tem prazo padrão
			let calculatedExpirationDate = null;
			if (expirationDate) {
				calculatedExpirationDate = new Date(expirationDate);
			} else if (product.hasExpiration && product.defaultShelfLifeDays) {
				calculatedExpirationDate = new Date();
				calculatedExpirationDate.setDate(
					calculatedExpirationDate.getDate() + product.defaultShelfLifeDays,
				);
			}

			// Verificar se já existe item similar no estoque (mesmo produto, lote, localização)
			const existingStockItem = await prisma.stockItem.findFirst({
				where: {
					productId,
					location,
					batchNumber: batchNumber || null,
					expirationDate: calculatedExpirationDate,
					isExpired: false,
				},
			});

			if (existingStockItem) {
				// Atualizar item existente
				const updatedItem = await prisma.stockItem.update({
					where: { id: existingStockItem.id },
					data: {
						quantity: existingStockItem.quantity + quantity,
						unitCost: (existingStockItem.unitCost || 0 + unitPrice) / 2, // Média dos preços
						isLowStock:
							product.hasStock && product.minStock
								? existingStockItem.quantity + quantity <= product.minStock
								: false,
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

				// Registrar movimento
				await prisma.stockMovement.create({
					data: {
						stockItemId: existingStockItem.id,
						type: "ENTRADA",
						quantity,
						reason: "Compra automática",
						notes: `Compra ID: ${purchaseId}`,
						purchaseItemId: item.purchaseItemId,
					},
				});

				createdStockItems.push(updatedItem);
			} else {
				// Criar novo item de estoque
				const stockItem = await prisma.stockItem.create({
					data: {
						productId,
						quantity,
						expirationDate: calculatedExpirationDate,
						batchNumber,
						location,
						unitCost: unitPrice,
						notes: `Entrada automática da compra ${purchaseId}`,
						isLowStock:
							product.hasStock && product.minStock
								? quantity <= product.minStock
								: false,
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

				// Registrar movimento de entrada
				await prisma.stockMovement.create({
					data: {
						stockItemId: stockItem.id,
						type: "ENTRADA",
						quantity,
						reason: "Compra automática",
						notes: `Compra ID: ${purchaseId}`,
						purchaseItemId: item.purchaseItemId,
					},
				});

				createdStockItems.push(stockItem);
			}
		}

		return NextResponse.json({
			success: true,
			itemsProcessed: createdStockItems.length,
			stockItems: createdStockItems,
		});
	} catch (error) {
		console.error("Erro na entrada automática:", error);
		return NextResponse.json(
			{ error: "Erro na entrada automática do estoque" },
			{ status: 500 },
		);
	}
}
