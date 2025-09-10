import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
	try {
		const { productName, marketName, price, notes } = await request.json();

		// Validações básicas
		if (!productName || !marketName || price === undefined) {
			return NextResponse.json(
				{
					success: false,
					error: "Produto, mercado e preço são obrigatórios",
				},
				{ status: 400 },
			);
		}

		if (typeof price !== "number" || price < 0) {
			return NextResponse.json(
				{
					success: false,
					error: "Preço deve ser um número válido maior ou igual a zero",
				},
				{ status: 400 },
			);
		}

		// Buscar ou criar produto
		let product = await prisma.product.findFirst({
			where: { name: { equals: productName, mode: "insensitive" } },
		});

		if (!product) {
			product = await prisma.product.create({
				data: { name: productName },
			});
		}

		// Buscar ou criar mercado
		let market = await prisma.market.findFirst({
			where: { name: { equals: marketName, mode: "insensitive" } },
		});

		if (!market) {
			market = await prisma.market.create({
				data: { name: marketName },
			});
		}

		// Registrar o preço
		const priceRecord = await prisma.priceRecord.create({
			data: {
				productId: product.id,
				marketId: market.id,
				price,
				notes,
				recordDate: new Date(),
			},
			include: {
				product: true,
				market: true,
			},
		});

		return NextResponse.json({
			success: true,
			message: `Preço de ${productName} registrado: R$ ${price.toFixed(2)} no ${marketName}`,
			priceRecord: {
				id: priceRecord.id,
				product: priceRecord.product.name,
				market: priceRecord.market.name,
				price: priceRecord.price,
				recordDate: priceRecord.recordDate,
				notes: priceRecord.notes,
			},
		});
	} catch (error) {
		console.error("Erro ao registrar preço:", error);
		return handleApiError(error);
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const productName = searchParams.get("product");
		const marketName = searchParams.get("market");
		const limit = parseInt(searchParams.get("limit") || "50");

		// Construir filtros
		const where: any = {};

		if (productName) {
			where.product = {
				name: { contains: productName, mode: "insensitive" },
			};
		}

		if (marketName) {
			where.market = {
				name: { contains: marketName, mode: "insensitive" },
			};
		}

		// Buscar registros de preços
		const priceRecords = await prisma.priceRecord.findMany({
			where,
			include: {
				product: true,
				market: true,
			},
			orderBy: { recordDate: "desc" },
			take: limit,
		});

		return NextResponse.json({
			success: true,
			priceRecords: priceRecords.map((record) => ({
				id: record.id,
				product: record.product.name,
				market: record.market.name,
				price: record.price,
				recordDate: record.recordDate,
				notes: record.notes,
			})),
			total: priceRecords.length,
		});
	} catch (error) {
		console.error("Erro ao buscar preços:", error);
		return handleApiError(error);
	}
}
