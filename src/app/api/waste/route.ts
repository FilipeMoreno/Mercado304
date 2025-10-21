import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

// GET /api/waste - Listar registros de desperdício
export async function GET(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get("page") || "1", 10)
		const limit = parseInt(searchParams.get("limit") || "10", 10)
		const search = searchParams.get("search") || ""
		const reason = searchParams.get("reason") || ""
		const startDate = searchParams.get("startDate")
		const endDate = searchParams.get("endDate")

		const skip = (page - 1) * limit

		// Filtros
		const where: any = {}

		if (search) {
			where.productName = {
				contains: search,
				mode: "insensitive",
			}
		}

		if (reason && reason !== "all") {
			where.wasteReason = reason
		}

		if (startDate) {
			where.wasteDate = {
				...where.wasteDate,
				gte: new Date(startDate),
			}
		}

		if (endDate) {
			where.wasteDate = {
				...where.wasteDate,
				lte: new Date(endDate),
			}
		}

		const [wasteRecords, totalCount] = await Promise.all([
			prisma.wasteRecord.findMany({
				where,
				orderBy: { wasteDate: "desc" },
				skip,
				take: limit,
			}),
			prisma.wasteRecord.count({ where }),
		])

		// Calcular estatísticas
		const stats = await prisma.wasteRecord.aggregate({
			where: {},
			_sum: {
				totalValue: true,
				quantity: true,
			},
			_count: {
				id: true,
			},
		})

		// Motivos mais comuns
		const reasonStats = await prisma.wasteRecord.groupBy({
			by: ["wasteReason"],
			_count: {
				wasteReason: true,
			},
			orderBy: {
				_count: {
					wasteReason: "desc",
				},
			},
			take: 5,
		})

		return NextResponse.json({
			wasteRecords,
			pagination: {
				page,
				limit,
				total: totalCount,
				totalPages: Math.ceil(totalCount / limit),
			},
			stats: {
				totalValue: stats._sum.totalValue || 0,
				totalQuantity: stats._sum.quantity || 0,
				totalCount: stats._count.id || 0,
				reasonStats,
			},
		})
	} catch (error) {
		console.error("Error fetching waste records:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

// POST /api/waste - Criar novo registro de desperdício
export async function POST(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		const {
			productId,
			productName,
			quantity,
			unit,
			wasteReason,
			wasteDate,
			expirationDate,
			location,
			unitCost,
			totalValue,
			notes,
			category,
			brand,
			batchNumber,
			stockItemId,
		} = body

		// Validações
		if (!productName || !quantity || !unit || !wasteReason) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
		}

		// Criar registro de desperdício
		const wasteRecord = await prisma.wasteRecord.create({
			data: {
				productId,
				productName,
				quantity: parseFloat(quantity),
				unit,
				wasteReason,
				wasteDate: wasteDate ? new Date(wasteDate) : new Date(),
				expirationDate: expirationDate ? new Date(expirationDate) : null,
				location,
				unitCost: unitCost ? parseFloat(unitCost) : null,
				totalValue: totalValue ? parseFloat(totalValue) : null,
				notes,
				category,
				brand,
				batchNumber,
				stockItemId,
				userId: session.user.id,
			},
		})

		// Se há stockItemId, atualizar o estoque
		if (stockItemId) {
			await prisma.stockItem.update({
				where: { id: stockItemId },
				data: {
					quantity: {
						decrement: parseFloat(quantity),
					},
				},
			})

			// Criar movimentação no estoque
			await prisma.stockMovement.create({
				data: {
					stockItemId,
					type: "DESPERDICIO",
					quantity: -parseFloat(quantity),
					reason: `Desperdício: ${wasteReason}`,
					notes,
				},
			})
		}

		// Registrar no histórico geral
		await prisma.stockHistory.create({
			data: {
				type: "DESPERDICIO",
				productId,
				productName,
				quantity: -parseFloat(quantity),
				reason: `Desperdício: ${wasteReason}`,
				location,
				unitCost: unitCost ? parseFloat(unitCost) : null,
				totalValue: totalValue ? parseFloat(totalValue) : null,
				notes,
				userId: session.user.id,
			},
		})

		return NextResponse.json(wasteRecord, { status: 201 })
	} catch (error) {
		console.error("Error creating waste record:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
