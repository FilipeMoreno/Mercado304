import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

// GET - Buscar histórico geral de movimentações do estoque
export async function GET(request: NextRequest) {
	try {
		const session = await getSession();

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const type = searchParams.get("type") as any;
		const location = searchParams.get("location") || "";
		const startDate = searchParams.get("startDate");
		const endDate = searchParams.get("endDate");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "50");
		const skip = (page - 1) * limit;

		// Construir filtros para histórico geral
		const whereConditions: any = {};

		if (search) {
			whereConditions.OR = [
				{
					productName: {
						contains: search,
						mode: "insensitive",
					},
				},
				{
					reason: {
						contains: search,
						mode: "insensitive",
					},
				},
				{
					notes: {
						contains: search,
						mode: "insensitive",
					},
				},
			];
		}

		if (type && type !== "all") {
			whereConditions.type = type;
		}

		if (location && location !== "all") {
			whereConditions.location = location;
		}

		if (startDate) {
			whereConditions.date = {
				...whereConditions.date,
				gte: new Date(startDate),
			};
		}

		if (endDate) {
			whereConditions.date = {
				...whereConditions.date,
				lte: new Date(endDate),
			};
		}

		// Buscar histórico geral
		const [historyRecords, total] = await Promise.all([
			prisma.stockHistory.findMany({
				where: whereConditions,
				orderBy: { date: "desc" },
				skip,
				take: limit,
			}),
			prisma.stockHistory.count({ where: whereConditions }),
		]);

		// Calcular estatísticas
		const stats = await prisma.stockHistory.aggregate({
			where: whereConditions,
			_sum: {
				totalValue: true,
				quantity: true,
			},
			_count: {
				id: true,
			},
		});

		// Estatísticas por tipo
		const typeStats = await prisma.stockHistory.groupBy({
			by: ["type"],
			where: whereConditions,
			_sum: {
				quantity: true,
				totalValue: true,
			},
			_count: {
				id: true,
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
		});

		// Produtos mais movimentados
		const topProducts = await prisma.stockHistory.groupBy({
			by: ["productName"],
			where: {
				...whereConditions,
				productName: {
					not: null,
				},
			},
			_count: {
				id: true,
			},
			_sum: {
				quantity: true,
				totalValue: true,
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
			take: 10,
		});

		// Localizações mais utilizadas
		const topLocations = await prisma.stockHistory.groupBy({
			by: ["location"],
			where: {
				...whereConditions,
				location: {
					not: null,
				},
			},
			_count: {
				location: true,
			},
			orderBy: {
				_count: {
					location: "desc",
				},
			},
			take: 5,
		});

		return NextResponse.json({
			historyRecords,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
			stats: {
				totalMovements: stats._count.id || 0,
				totalQuantity: stats._sum.quantity || 0,
				totalValue: stats._sum.totalValue || 0,
				byType: typeStats,
				topProducts,
				topLocations,
			},
		});
	} catch (error) {
		console.error("Erro ao buscar histórico de estoque:", error);
		return NextResponse.json(
			{ error: "Erro ao buscar histórico de estoque" },
			{ status: 500 },
		);
	}
}

// POST - Registrar nova entrada no histórico geral
export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await request.json();
		const {
			type,
			productId,
			productName,
			quantity,
			reason,
			location,
			unitCost,
			totalValue,
			notes,
			purchaseItemId,
		} = data;

		// Validações básicas
		if (!type || !productName || quantity === undefined) {
			return NextResponse.json(
				{ error: "Dados obrigatórios: type, productName e quantity" },
				{ status: 400 },
			);
		}

		// Criar entrada no histórico geral
		const historyRecord = await prisma.stockHistory.create({
			data: {
				type,
				productId,
				productName,
				quantity: parseFloat(quantity),
				reason,
				location,
				unitCost: unitCost ? parseFloat(unitCost) : null,
				totalValue: totalValue ? parseFloat(totalValue) : null,
				notes,
				purchaseItemId,
				userId: session.user.id,
			},
		});

		return NextResponse.json(historyRecord, { status: 201 });
	} catch (error) {
		console.error("Erro ao registrar no histórico:", error);
		return NextResponse.json(
			{ error: "Erro ao registrar no histórico" },
			{ status: 500 },
		);
	}
}
