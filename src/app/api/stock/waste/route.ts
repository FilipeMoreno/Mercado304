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
				date: {
					gte: startOfPeriod,
				},
			}
		}

		// Estatísticas gerais de desperdício
		const wasteStats = await prisma.stockMovement.aggregate({
			where: {
				isWaste: true,
				...dateFilter,
			},
			_sum: {
				quantity: true,
				wasteValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Desperdício por produto
		const wasteByProduct = await prisma.stockMovement.groupBy({
			by: ["stockItemId"],
			where: {
				isWaste: true,
				...dateFilter,
			},
			_sum: {
				quantity: true,
				wasteValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Buscar detalhes dos produtos mais desperdiçados
		const topWastedProducts = await Promise.all(
			wasteByProduct
				.sort((a, b) => (b._sum.wasteValue || 0) - (a._sum.wasteValue || 0))
				.slice(0, 10)
				.map(async (item) => {
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
						product: stockItem?.product,
						wasteCount: item._count.id,
						totalQuantity: item._sum.quantity || 0,
						totalValue: item._sum.wasteValue || 0,
					}
				}),
		)

		// Desperdício por motivo
		const wasteByReason = await prisma.stockMovement.groupBy({
			by: ["wasteReason"],
			where: {
				isWaste: true,
				wasteReason: {
					not: null,
				},
				...dateFilter,
			},
			_sum: {
				quantity: true,
				wasteValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Desperdício por categoria de produto
		const wasteByCategory = await prisma.$queryRaw`
      SELECT 
        c.name as category_name,
        c.id as category_id,
        COUNT(sm.id) as waste_count,
        SUM(sm.quantity) as total_quantity,
        SUM(sm.waste_value) as total_value
      FROM stock_movements sm
      JOIN stock_items si ON sm.stock_item_id = si.id
      JOIN products p ON si.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE sm.is_waste = true
        AND sm.date >= ${dateFilter.date?.gte || new Date(0)}
        ${dateFilter.date?.lte ? `AND sm.date <= ${dateFilter.date.lte}` : ""}
      GROUP BY c.id, c.name
      ORDER BY total_value DESC
      LIMIT 10
    `

		// Desperdício ao longo do tempo (para gráficos)
		const wasteOverTime = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('day', sm.date) as date,
        COUNT(sm.id) as waste_count,
        SUM(sm.quantity) as total_quantity,
        SUM(sm.waste_value) as total_value
      FROM stock_movements sm
      WHERE sm.is_waste = true
        AND sm.date >= ${dateFilter.date?.gte || new Date(0)}
        ${dateFilter.date?.lte ? `AND sm.date <= ${dateFilter.date.lte}` : ""}
      GROUP BY DATE_TRUNC('day', sm.date)
      ORDER BY date ASC
    `

		// Comparar com período anterior
		const previousPeriod = new Date(dateFilter.date?.gte || new Date())
		const periodLength = (dateFilter.date?.lte || new Date()).getTime() - (dateFilter.date?.gte || new Date()).getTime()
		previousPeriod.setTime(previousPeriod.getTime() - periodLength)

		const previousWasteStats = await prisma.stockMovement.aggregate({
			where: {
				isWaste: true,
				date: {
					gte: previousPeriod,
					lt: dateFilter.date?.gte || new Date(),
				},
			},
			_sum: {
				quantity: true,
				wasteValue: true,
			},
			_count: {
				id: true,
			},
		})

		// Calcular variação percentual
		const currentValue = wasteStats._sum.wasteValue || 0
		const previousValue = previousWasteStats._sum.wasteValue || 0
		const percentChange = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0

		return NextResponse.json({
			summary: {
				totalWasteEvents: wasteStats._count.id || 0,
				totalQuantityWasted: wasteStats._sum.quantity || 0,
				totalValueWasted: wasteStats._sum.wasteValue || 0,
				percentChangeFromPrevious: percentChange,
			},
			topWastedProducts: topWastedProducts.filter((p) => p.product),
			wasteByReason: wasteByReason.map((item) => ({
				reason: item.wasteReason,
				count: item._count.id,
				quantity: item._sum.quantity || 0,
				value: item._sum.wasteValue || 0,
			})),
			wasteByCategory,
			wasteOverTime,
			period: {
				start: dateFilter.date?.gte,
				end: dateFilter.date?.lte || new Date(),
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
