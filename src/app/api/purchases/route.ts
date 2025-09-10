import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const marketId = searchParams.get("marketId");
		const searchTerm = searchParams.get("search") || "";
		const sort = searchParams.get("sort") || "date-desc";
		const dateFrom = searchParams.get("dateFrom");
		const dateTo = searchParams.get("dateTo");
		const page = parseInt(searchParams.get("page") || "1");
		const itemsPerPage = parseInt(searchParams.get("itemsPerPage") || "12");

		const where: any = {};
		if (marketId && marketId !== "all") {
			where.marketId = marketId;
		}

		if (dateFrom || dateTo) {
			where.purchaseDate = {};
			if (dateFrom) {
				where.purchaseDate.gte = new Date(`${dateFrom}T00:00:00.000Z`);
			}
			if (dateTo) {
				const endDate = new Date(`${dateTo}T00:00:00.000Z`);
				where.purchaseDate.lt = addDays(endDate, 1);
			}
		}

		if (searchTerm) {
			where.items = {
				some: {
					OR: [
						{ productName: { contains: searchTerm, mode: "insensitive" } },
						{
							product: { name: { contains: searchTerm, mode: "insensitive" } },
						},
					],
				},
			};
		}

		const orderBy: any = {};
		switch (sort) {
			case "date-asc":
				orderBy.purchaseDate = "asc";
				break;
			case "date-desc":
				orderBy.purchaseDate = "desc";
				break;
			case "value-asc":
				orderBy.totalAmount = "asc";
				break;
			case "value-desc":
				orderBy.totalAmount = "desc";
				break;
			default:
				orderBy.purchaseDate = "desc";
				break;
		}

		const [purchases, totalCount] = await prisma.$transaction([
			prisma.purchase.findMany({
				where,
				include: {
					market: true,
					items: {
						include: {
							product: {
								include: {
									brand: true,
								},
							},
						},
					},
				},
				orderBy,
				skip: (page - 1) * itemsPerPage,
				take: itemsPerPage,
			}),
			prisma.purchase.count({ where }),
		]);

		return NextResponse.json({ purchases, totalCount });
	} catch (error) {
		console.error("Erro ao buscar compras:", error);
		return NextResponse.json(
			{ error: "Erro ao buscar compras" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { marketId, items, purchaseDate, paymentMethod } = body;

		if (!marketId || !items || items.length === 0) {
			return NextResponse.json(
				{ error: "Mercado e itens são obrigatórios" },
				{ status: 400 },
			);
		}

		const totalAmount = items.reduce(
			(sum: number, item: any) => sum + item.quantity * item.unitPrice,
			0,
		);

		const productIds = items.map((item: any) => item.productId);
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
		});

		const purchase = await prisma.$transaction(async (tx) => {
			const newPurchase = await tx.purchase.create({
				data: {
					marketId,
					totalAmount,
					purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
					paymentMethod: paymentMethod || "MONEY",
					items: {
						create: items.map((item: any) => {
							const product = products.find((p) => p.id === item.productId);
							return {
								productId: item.productId,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
								totalPrice: item.quantity * item.unitPrice,
								productName: product?.name,
								productUnit: product?.unit,
							};
						}),
					},
				},
				include: { items: true },
			});

			for (const item of items) {
				const product = products.find((p) => p.id === item.productId);
				if (item.addToStock && product && product.hasStock) {
					const entriesToCreate =
						item.stockEntries && item.stockEntries.length > 0
							? item.stockEntries
							: [
									{
										quantity: item.quantity,
										location: "Despensa",
										expirationDate: item.expirationDate,
									},
								];

					for (const entry of entriesToCreate) {
						const stockItem = await tx.stockItem.create({
							data: {
								productId: item.productId,
								quantity: entry.quantity || 1, // Cada entrada é uma unidade
								unitCost: item.unitPrice,
								location: entry.location || "Despensa",
								expirationDate: entry.expirationDate
									? new Date(entry.expirationDate)
									: null,
								batchNumber: entry.batchNumber || null,
								notes:
									entry.notes || `Compra #${newPurchase.id.substring(0, 8)}`,
								isLowStock:
									product.hasStock && product.minStock
										? (entry.quantity || 1) <= product.minStock
										: false,
							},
						});

						await tx.stockMovement.create({
							data: {
								stockItemId: stockItem.id,
								purchaseItemId: newPurchase.items.find(
									(pi) => pi.productId === item.productId,
								)?.id,
								type: "ENTRADA",
								quantity: entry.quantity || 1,
								reason: "Registro de compra",
							},
						});
					}
				}
			}

			return tx.purchase.findUnique({
				where: { id: newPurchase.id },
				include: { market: true, items: { include: { product: true } } },
			});
		});

		return NextResponse.json(purchase, { status: 201 });
	} catch (error) {
		console.error("Erro ao criar compra:", error);
		return NextResponse.json(
			{ error: "Erro ao criar compra" },
			{ status: 500 },
		);
	}
}
