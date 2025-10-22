import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Get all purchases to analyze patterns
		const purchases = await prisma.purchase.findMany({
			include: {
				items: {
					include: {
						product: {
							include: {
								category: true,
							},
						},
					},
				},
				market: true,
			},
			orderBy: {
				createdAt: 'desc',
			},
		})

		if (purchases.length === 0) {
			return NextResponse.json({
				favoriteDay: "Não definido",
				favoriteTime: "Não definido", 
				favoriteMarket: "Não definido",
				averageItemsPerPurchase: 0,
				averageTimeBetweenPurchases: 0,
				mostBoughtCategory: "Não definido",
				weekdayVsWeekend: {
					weekday: { purchases: 0, amount: 0 },
					weekend: { purchases: 0, amount: 0 },
				},
			})
		}

		// Analyze day patterns
		const dayCount: { [key: string]: number } = {}
		const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
		
		purchases.forEach(purchase => {
			const dayOfWeek = dayNames[purchase.createdAt.getDay()]
			dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1
		})

		const favoriteDay = Object.entries(dayCount).reduce((a, b) => dayCount[a[0]] > dayCount[b[0]] ? a : b)[0]

		// Analyze hour patterns
		const hourCount: { [key: number]: number } = {}
		purchases.forEach(purchase => {
			const hour = purchase.createdAt.getHours()
			hourCount[hour] = (hourCount[hour] || 0) + 1
		})

		const favoriteHour = Object.entries(hourCount).reduce((a, b) => hourCount[Number(a[0])] > hourCount[Number(b[0])] ? a : b)[0]
		const favoriteTime = `${favoriteHour.padStart(2, '0')}:00`

		// Analyze market patterns
		const marketCount: { [key: string]: number } = {}
		purchases.forEach(purchase => {
			const marketName = purchase.market.name
			marketCount[marketName] = (marketCount[marketName] || 0) + 1
		})

		const favoriteMarket = Object.entries(marketCount).reduce((a, b) => marketCount[a[0]] > marketCount[b[0]] ? a : b)[0]

		// Calculate average items per purchase
		const totalItems = purchases.reduce((total, purchase) => total + purchase.items.length, 0)
		const averageItemsPerPurchase = totalItems / purchases.length

		// Calculate average time between purchases
		let totalDaysBetween = 0
		for (let i = 1; i < purchases.length; i++) {
			const daysDiff = Math.abs(purchases[i-1].createdAt.getTime() - purchases[i].createdAt.getTime()) / (1000 * 60 * 60 * 24)
			totalDaysBetween += daysDiff
		}
		const averageTimeBetweenPurchases = purchases.length > 1 ? Math.round(totalDaysBetween / (purchases.length - 1)) : 0

		// Analyze category patterns
		const categoryCount: { [key: string]: number } = {}
		purchases.forEach(purchase => {
			purchase.items.forEach(item => {
				if (item.product?.category?.name) {
					const categoryName = item.product.category.name
					categoryCount[categoryName] = (categoryCount[categoryName] || 0) + item.quantity
				}
			})
		})

		const mostBoughtCategory = Object.keys(categoryCount).length > 0 
			? Object.entries(categoryCount).reduce((a, b) => categoryCount[a[0]] > categoryCount[b[0]] ? a : b)[0]
			: "Não definido"

		// Weekday vs Weekend analysis
		let weekdayPurchases = 0
		let weekendPurchases = 0
		let weekdayAmount = 0
		let weekendAmount = 0

		purchases.forEach(purchase => {
			const dayOfWeek = purchase.createdAt.getDay()
			const amount = purchase.items.reduce((sum, item) => sum + item.totalPrice, 0)
			
			if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
				weekendPurchases++
				weekendAmount += amount
			} else {
				weekdayPurchases++
				weekdayAmount += amount
			}
		})

		return NextResponse.json({
			favoriteDay,
			favoriteTime,
			favoriteMarket,
			averageItemsPerPurchase: Math.round(averageItemsPerPurchase * 10) / 10,
			averageTimeBetweenPurchases,
			mostBoughtCategory,
			weekdayVsWeekend: {
				weekday: { purchases: weekdayPurchases, amount: weekdayAmount },
				weekend: { purchases: weekendPurchases, amount: weekendAmount },
			},
		})
	} catch (error) {
		console.error("Erro ao buscar padrões de compra:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}