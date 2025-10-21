import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

// GET - Buscar histórico geral de movimentações do estoque
export async function GET(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(request.url)
		const search = searchParams.get("search") || ""
		const type = searchParams.get("type") as string
		const location = searchParams.get("location") || ""
		const startDate = searchParams.get("startDate")
		const endDate = searchParams.get("endDate")
		const page = parseInt(searchParams.get("page") || "1", 10)
		const limit = parseInt(searchParams.get("limit") || "50", 10)
		const skip = (page - 1) * limit

		// Construir filtros para movimentações do estoque
		const whereConditions: Record<string, any> = {}

		if (search) {
			whereConditions.OR = [
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
				{
					stockItem: {
						product: {
							name: {
								contains: search,
								mode: "insensitive",
							},
						},
					},
				},
			]
		}

		if (type && type !== "all") {
			whereConditions.type = type
		}

		if (location && location !== "all") {
			whereConditions.stockItem = {
				location: location,
			}
		}

		if (startDate) {
			whereConditions.date = {
				...whereConditions.date,
				gte: new Date(startDate),
			}
		}

		if (endDate) {
			whereConditions.date = {
				...whereConditions.date,
				lte: new Date(endDate),
			}
		}

		// Buscar histórico de movimentações do estoque
		const [historyRecords, total] = await Promise.all([
			prisma.stockMovement.findMany({
				where: whereConditions,
				include: {
					stockItem: {
						include: {
							product: {
								include: {
									brand: true,
									category: true,
								},
							},
						},
					},
				},
				orderBy: { date: "desc" },
				skip,
				take: limit,
			}),
			prisma.stockMovement.count({ where: whereConditions }),
		])

		// Se o filtro inclui VENCIMENTO ou DESPERDICIO, buscar também registros de desperdício
		let wasteRecords: any[] = []
		let wasteTotal = 0

		if (type === "VENCIMENTO" || type === "DESPERDICIO" || type === "all") {
			const wasteWhereConditions: Record<string, any> = {}

			if (search) {
				wasteWhereConditions.OR = [
					{
						productName: {
							contains: search,
							mode: "insensitive",
						},
					},
					{
						wasteReason: {
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
				]
			}

			if (location && location !== "all") {
				wasteWhereConditions.location = location
			}

			if (startDate) {
				wasteWhereConditions.wasteDate = {
					...wasteWhereConditions.wasteDate,
					gte: new Date(startDate),
				}
			}

			if (endDate) {
				wasteWhereConditions.wasteDate = {
					...wasteWhereConditions.wasteDate,
					lte: new Date(endDate),
				}
			}

			// Filtrar por tipo de desperdício se necessário
			if (type === "VENCIMENTO") {
				wasteWhereConditions.wasteReason = "EXPIRED"
			} else if (type === "DESPERDICIO") {
				wasteWhereConditions.wasteReason = {
					not: "EXPIRED",
				}
			}

			const [wasteData, wasteCount] = await Promise.all([
				prisma.wasteRecord.findMany({
					where: wasteWhereConditions,
					orderBy: { wasteDate: "desc" },
					skip,
					take: limit,
				}),
				prisma.wasteRecord.count({ where: wasteWhereConditions }),
			])

			wasteRecords = wasteData
			wasteTotal = wasteCount
		}

		// Calcular estatísticas
		const stats = await prisma.stockMovement.aggregate({
			where: whereConditions,
			_sum: {
				quantity: true,
			},
			_count: {
				id: true,
			},
		})

		// Estatísticas por tipo
		const typeStats = await prisma.stockMovement.groupBy({
			by: ["type"],
			where: whereConditions,
			_sum: {
				quantity: true,
			},
			_count: {
				id: true,
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
		})

		// Produtos mais movimentados
		const topProducts = await prisma.stockMovement.groupBy({
			by: ["stockItemId"],
			where: whereConditions,
			_count: {
				id: true,
			},
			_sum: {
				quantity: true,
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
			take: 10,
		})

		// Buscar informações dos produtos
		const topProductsWithInfo = await Promise.all(
			topProducts.map(async (item) => {
				const stockItem = await prisma.stockItem.findUnique({
					where: { id: item.stockItemId },
					include: {
						product: {
							include: {
								brand: true,
								category: true,
							},
						},
					},
				})
				return {
					productName: stockItem?.product.name || "Produto não encontrado",
					brand: stockItem?.product.brand?.name,
					category: stockItem?.product.category?.name,
					movementCount: item._count.id,
					totalQuantity: item._sum.quantity,
				}
			}),
		)

		// Localizações mais utilizadas
		const topLocations = await prisma.stockMovement.groupBy({
			by: ["stockItemId"],
			where: whereConditions,
			_count: {
				id: true,
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
			take: 5,
		})

		// Buscar informações das localizações
		const topLocationsWithInfo = await Promise.all(
			topLocations.map(async (item) => {
				const stockItem = await prisma.stockItem.findUnique({
					where: { id: item.stockItemId },
					select: { location: true },
				})
				return {
					location: stockItem?.location || "Localização não encontrada",
					movementCount: item._count.id,
				}
			}),
		)

		// Combinar e ordenar registros de movimento e desperdício
		const combinedRecords = [
			...historyRecords.map((record) => ({
				...record,
				isWaste: false,
				recordType: "movement",
			})),
			...wasteRecords.map((record) => ({
				id: record.id,
				type: record.wasteReason === "EXPIRED" ? "VENCIMENTO" : "DESPERDICIO",
				quantity: record.quantity,
				reason: record.wasteReason,
				notes: record.notes,
				date: record.wasteDate,
				stockItem: {
					id: record.stockItemId || "unknown",
					location: record.location,
					product: {
						id: record.productId || "unknown",
						name: record.productName,
						unit: record.unit,
						brand: record.brand ? { name: record.brand } : undefined,
						category: record.category ? { name: record.category } : undefined,
					},
				},
				isWaste: true,
				recordType: "waste",
			})),
		].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

		return NextResponse.json({
			historyRecords: combinedRecords,
			pagination: {
				page,
				limit,
				total: total + wasteTotal,
				totalPages: Math.ceil((total + wasteTotal) / limit),
			},
			stats: {
				totalMovements: stats._count.id || 0,
				totalQuantity: stats._sum.quantity || 0,
				totalValue: 0, // StockMovement não tem totalValue
				byType: typeStats,
				topProducts: topProductsWithInfo,
				topLocations: topLocationsWithInfo,
			},
		})
	} catch (error) {
		console.error("Erro ao buscar histórico de estoque:", error)
		return NextResponse.json({ error: "Erro ao buscar histórico de estoque" }, { status: 500 })
	}
}

// POST - Registrar nova entrada no histórico geral
export async function POST(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const data = await request.json()
		const { type, productId, productName, quantity, reason, location, unitCost, totalValue, notes, purchaseItemId } =
			data

		// Validações básicas
		if (!type || !productName || quantity === undefined) {
			return NextResponse.json({ error: "Dados obrigatórios: type, productName e quantity" }, { status: 400 })
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
		})

		return NextResponse.json(historyRecord, { status: 201 })
	} catch (error) {
		console.error("Erro ao registrar no histórico:", error)
		return NextResponse.json({ error: "Erro ao registrar no histórico" }, { status: 500 })
	}
}
