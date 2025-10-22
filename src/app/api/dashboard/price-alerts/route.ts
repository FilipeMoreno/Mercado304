import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Get recent price records (last 30 days) with price changes
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		// Find products with significant price changes
		const priceRecords = await prisma.priceRecord.findMany({
			where: {
				createdAt: {
					gte: thirtyDaysAgo,
				},
			},
			include: {
				product: true,
				market: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		// Group by product and market to find price changes
		const priceChanges: { [key: string]: any[] } = {}
		
		priceRecords.forEach(record => {
			const key = `${record.productId}-${record.marketId}`
			if (!priceChanges[key]) {
				priceChanges[key] = []
			}
			priceChanges[key].push(record)
		})

		const alerts: any[] = []

		// Find significant price changes (more than 10%)
		Object.entries(priceChanges).forEach(([key, records]) => {
			if (records.length >= 2) {
				const latest = records[0]
				const previous = records[1]
				
				const change = ((latest.price - previous.price) / previous.price) * 100
				
				// Only alert for significant changes (> 10% increase or > 15% decrease)
				if (Math.abs(change) > 10) {
					alerts.push({
						id: latest.id,
						productId: latest.productId,
						productName: latest.product.name,
						currentPrice: latest.price,
						previousPrice: previous.price,
						change,
						marketName: latest.market.name,
						alertType: change > 0 ? "increase" : "decrease",
						date: latest.createdAt,
					})
				}
			}
		})

		// Sort by absolute change (biggest changes first) and limit to 10
		alerts.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
		const limitedAlerts = alerts.slice(0, 10)

		return NextResponse.json({ alerts: limitedAlerts })
	} catch (error) {
		console.error("Erro ao buscar alertas de preços:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}