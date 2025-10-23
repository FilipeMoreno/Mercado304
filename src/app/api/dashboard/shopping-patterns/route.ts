import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

// Helper function to find max entry from a record
function findMaxEntry(record: Record<string, number>): string | null {
	const entries = Object.entries(record)
	if (entries.length === 0) return null

	const firstEntry = entries[0]
	if (!firstEntry) return null

	let maxKey = firstEntry[0]
	let maxValue = firstEntry[1]

	for (const [key, value] of entries) {
		if (value > maxValue) {
			maxKey = key
			maxValue = value
		}
	}

	return maxKey
}

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
		const dayCount: Record<string, number> = {}
		const dayNames: string[] = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]

		purchases.forEach(purchase => {
			const dayIndex = purchase.createdAt.getDay()
			const dayOfWeek = dayNames[dayIndex]
			if (dayOfWeek) {
				dayCount[dayOfWeek] = (dayCount[dayOfWeek] || 0) + 1
			}
		})

		const favoriteDay = findMaxEntry(dayCount) ?? "Não definido"

		// Analyze hour patterns
		const hourCount: Record<string, number> = {}
		purchases.forEach(purchase => {
			const hour = purchase.createdAt.getHours().toString()
			hourCount[hour] = (hourCount[hour] || 0) + 1
		})

		let favoriteTime = "Não definido"
		const maxHourKey = findMaxEntry(hourCount)
		if (maxHourKey) {
			favoriteTime = `${maxHourKey.padStart(2, '0')}:00`
		}

		// Analyze market patterns
		const marketCount: Record<string, number> = {}
		purchases.forEach(purchase => {
			const marketName = purchase.market.name
			marketCount[marketName] = (marketCount[marketName] || 0) + 1
		})

		const favoriteMarket = findMaxEntry(marketCount) ?? "Não definido"

		// Calculate average items per purchase
		const totalItems = purchases.reduce((total, purchase) => total + purchase.items.length, 0)
		const averageItemsPerPurchase = totalItems / purchases.length

		// Calculate average time between purchases
		let totalDaysBetween = 0
		for (let i = 1; i < purchases.length; i++) {
			const currentPurchase = purchases[i]
			const previousPurchase = purchases[i - 1]
			if (!currentPurchase || !previousPurchase) continue
			const daysDiff = Math.abs(previousPurchase.createdAt.getTime() - currentPurchase.createdAt.getTime()) / (1000 * 60 * 60 * 24)
			totalDaysBetween += daysDiff
		}
		const averageTimeBetweenPurchases = purchases.length > 1 ? Math.round(totalDaysBetween / (purchases.length - 1)) : 0

		// Analyze category patterns
		const categoryCount: Record<string, number> = {}
		purchases.forEach(purchase => {
			purchase.items.forEach(item => {
				if (item.product?.category?.name) {
					const categoryName = item.product.category.name
					categoryCount[categoryName] = (categoryCount[categoryName] || 0) + item.quantity
				}
			})
		})

		const mostBoughtCategory = findMaxEntry(categoryCount) ?? "Não definido"

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
