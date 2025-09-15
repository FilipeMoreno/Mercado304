import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Buscar estatísticas de desperdício
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const startDate = searchParams.get("startDate")
		const endDate = searchParams.get("endDate")
		const period = searchParams.get("period") || "month" // day, week, month, year

		// Construir filtros de data
		let dateFilter: any = {}

		if (startDate && endDate) {
			dateFilter = {
				date: {
					gte: new Date(startDate),
					lte: new Date(endDate),
				},
			}
		} else {
			// Filtro padrão baseado no período
			const now = new Date()
			const startOfPeriod = new Date()

			switch (period) {
				case "day":
					startOfPeriod.setHours(0, 0, 0, 0)
					break
				case "week":
					startOfPeriod.setDate(now.getDate() - 7)
					break
				case "month":
					startOfPeriod.setMonth(now.getMonth() - 1)
					break
				case "year":
					startOfPeriod.setFullYear(now.getFullYear() - 1)
					break
			}

			dateFilter = {
				wasteDate: {
					gte: startOfPeriod,
				},
			}
		}

		// Estatísticas gerais de desperdício
		const wasteStats = await prisma.wasteRecord.aggregate({
			where: dateFilter,
			_sum: {
				quantity: true,
				totalValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Desperdício por produto
		const wasteByProduct = await prisma.wasteRecord.groupBy({
			by: ["productName"],
			where: dateFilter,
			_sum: {
				quantity: true,
				totalValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Buscar detalhes dos produtos mais desperdiçados
		const topWastedProducts = wasteByProduct
			.sort((a, b) => (b._sum.totalValue || 0) - (a._sum.totalValue || 0))
			.slice(0, 10)
			.map((item) => ({
				productName: item.productName,
				quantity: item._sum.quantity || 0,
				value: item._sum.totalValue || 0,
				count: item._count.id,
			}))

		// Desperdício por motivo
		const wasteByReason = await prisma.wasteRecord.groupBy({
			by: ["wasteReason"],
			where: {
				wasteReason: {
					not: null,
				},
				...dateFilter,
			},
			_sum: {
				quantity: true,
				totalValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Desperdício por categoria de produto
		const wasteByCategory = await prisma.wasteRecord.groupBy({
			by: ["category"],
			where: {
				category: {
					not: null,
				},
				...dateFilter,
			},
			_sum: {
				quantity: true,
				totalValue: true,
			},
			_count: {
				id: true,
			},
			orderBy: {
				_sum: {
					totalValue: "desc",
				},
			},
			take: 10,
		})

		// Desperdício ao longo do tempo (para gráficos)
		const wasteOverTime = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', wr.waste_date) as date,
        COUNT(wr.id) as waste_count,
        SUM(wr.quantity) as total_quantity,
        SUM(wr.total_value) as total_value
      FROM waste_records wr
      WHERE wr.waste_date >= ${dateFilter.wasteDate?.gte || new Date(0)}
        ${dateFilter.wasteDate?.lte ? `AND wr.waste_date <= ${dateFilter.wasteDate.lte}` : ""}
      GROUP BY DATE_TRUNC('day', wr.waste_date)
      ORDER BY date ASC
    `

		// Comparar com período anterior
		const previousPeriod = new Date(dateFilter.wasteDate?.gte || new Date())
		const periodLength = (dateFilter.wasteDate?.lte || new Date()).getTime() - (dateFilter.wasteDate?.gte || new Date()).getTime()
		previousPeriod.setTime(previousPeriod.getTime() - periodLength)

		const previousWasteStats = await prisma.wasteRecord.aggregate({
			where: {
				wasteDate: {
					gte: previousPeriod,
					lt: dateFilter.wasteDate?.gte || new Date(),
				},
			},
			_sum: {
				quantity: true,
				totalValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Calcular variação percentual
		const currentValue = wasteStats._sum.totalValue || 0
		const previousValue = previousWasteStats._sum.totalValue || 0
		const percentChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0

		return NextResponse.json({
			summary: {
				totalWasteEvents: wasteStats._count.id || 0,
				totalQuantityWasted: wasteStats._sum.quantity || 0,
				totalValueWasted: wasteStats._sum.totalValue || 0,
				percentChangeFromPrevious: percentChange,
			},
			topWastedProducts,
			wasteByReason: wasteByReason.map((item) => ({
				reason: item.wasteReason,
				count: item._count.id,
				quantity: item._sum.quantity || 0,
				value: item._sum.totalValue || 0,
			})),
			wasteByCategory,
			wasteOverTime,
			period: {
				start: dateFilter.wasteDate?.gte,
				end: dateFilter.wasteDate?.lte || new Date(),
			},
		})
	} catch (error) {
		console.error("Erro ao buscar estatísticas de desperdício:", error)
		return NextResponse.json({ error: "Erro ao buscar estatísticas de desperdício" }, { status: 500 })
	}
}

// POST - Marcar item como desperdício
export async function POST(request: Request) {
	try {
		const data = await request.json()
		const { stockItemId, quantity, wasteReason, notes } = data

		// Validações
		if (!stockItemId || !quantity || quantity <= 0) {
			return NextResponse.json({ error: "stockItemId e quantity (> 0) são obrigatórios" }, { status: 400 })
		}

		if (!wasteReason) {
			return NextResponse.json({ error: "wasteReason é obrigatório para desperdício" }, { status: 400 })
		}

		// Verificar se o item existe
		const stockItem = await prisma.stockItem.findUnique({
			where: { id: stockItemId },
			include: { product: true },
		})

		if (!stockItem) {
			return NextResponse.json({ error: "Item de estoque não encontrado" }, { status: 404 })
		}

		// Verificar quantidade disponível
		if (quantity > stockItem.quantity) {
			return NextResponse.json({ error: `Quantidade insuficiente. Disponível: ${stockItem.quantity}` }, { status: 400 })
		}

		// Calcular valor do desperdício
		const wasteValue = (stockItem.unitCost || 0) * quantity

		// Registrar como desperdício
		const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/stock/history`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				stockItemId,
				type: "DESPERDICIO",
				quantity,
				reason: `Desperdício: ${wasteReason}`,
				notes,
				isWaste: true,
				wasteReason,
				wasteValue,
			}),
		})

		if (!response.ok) {
			const error = await response.json()
			return NextResponse.json(error, { status: response.status })
		}

		const result = await response.json()
		return NextResponse.json(result, { status: 201 })
	} catch (error) {
		console.error("Erro ao registrar desperdício:", error)
		return NextResponse.json({ error: "Erro ao registrar desperdício" }, { status: 500 })
	}
}
