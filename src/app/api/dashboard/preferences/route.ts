import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function GET() {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const preferences = await prisma.dashboardPreference.findUnique({
			where: { userId: session.user.id },
		})

		// Se não existir preferências, retorna as configurações padrão
		if (!preferences) {
			return NextResponse.json({
				cardOrder: ["total-purchases", "total-spent", "total-products", "total-markets", "price-records"],
				hiddenCards: [],
				layoutStyle: "grid",
				cardsPerRow: 5,
				showSummaryCard: true,
				showMonthlyChart: true,
				showCategoryStats: true,
				showTopProducts: true,
				showMarketCompare: true,
				showRecentBuys: true,
				showExpirationAlerts: true,
				showReplenishment: true,
				showSavingsCard: true,
				showDiscountStats: true,
				showTemporalComp: true,
				showNutritionCard: true,
				showPaymentStats: true,
				showMonthlyStats: true,
				customTitle: null,
				customSubtitle: null,
				widgetLayouts: {},
				gridColumns: 12,
			})
		}

		return NextResponse.json({
			cardOrder: preferences.cardOrder,
			hiddenCards: preferences.hiddenCards,
			layoutStyle: preferences.layoutStyle,
			cardsPerRow: preferences.cardsPerRow,
			showSummaryCard: preferences.showSummaryCard,
			showMonthlyChart: preferences.showMonthlyChart,
			showCategoryStats: preferences.showCategoryStats,
			showTopProducts: preferences.showTopProducts,
			showMarketCompare: preferences.showMarketCompare,
			showRecentBuys: preferences.showRecentBuys,
			showExpirationAlerts: preferences.showExpirationAlerts,
			showReplenishment: preferences.showReplenishment,
			showSavingsCard: preferences.showSavingsCard,
			showDiscountStats: preferences.showDiscountStats,
			showTemporalComp: preferences.showTemporalComp,
			showNutritionCard: preferences.showNutritionCard,
			showPaymentStats: preferences.showPaymentStats,
			showMonthlyStats: preferences.showMonthlyStats,
			customTitle: preferences.customTitle,
			customSubtitle: preferences.customSubtitle,
			widgetLayouts: preferences.widgetLayouts || {},
			gridColumns: preferences.gridColumns || 12,
		})
	} catch (error) {
		console.error("Erro ao buscar preferências do dashboard:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const data = await request.json()

		// Validação básica dos dados
		if (data.cardsPerRow && (data.cardsPerRow < 1 || data.cardsPerRow > 6)) {
			return NextResponse.json({ error: "Cards por linha deve estar entre 1 e 6" }, { status: 400 })
		}

		const preferences = await prisma.dashboardPreference.upsert({
			where: { userId: session.user.id },
			update: {
				cardOrder: data.cardOrder || [],
				hiddenCards: data.hiddenCards || [],
				layoutStyle: data.layoutStyle || "grid",
				cardsPerRow: data.cardsPerRow || 5,
				showSummaryCard: data.showSummaryCard ?? true,
				showMonthlyChart: data.showMonthlyChart ?? true,
				showCategoryStats: data.showCategoryStats ?? true,
				showTopProducts: data.showTopProducts ?? true,
				showMarketCompare: data.showMarketCompare ?? true,
				showRecentBuys: data.showRecentBuys ?? true,
				showExpirationAlerts: data.showExpirationAlerts ?? true,
				showReplenishment: data.showReplenishment ?? true,
				showSavingsCard: data.showSavingsCard ?? true,
				showDiscountStats: data.showDiscountStats ?? true,
				showTemporalComp: data.showTemporalComp ?? true,
				showNutritionCard: data.showNutritionCard ?? true,
				showPaymentStats: data.showPaymentStats ?? true,
				showMonthlyStats: data.showMonthlyStats ?? true,
				customTitle: data.customTitle,
				customSubtitle: data.customSubtitle,
				widgetLayouts: data.widgetLayouts || {},
				gridColumns: data.gridColumns || 12,
			},
			create: {
				userId: session.user.id,
				cardOrder: data.cardOrder || [
					"total-purchases",
					"total-spent",
					"total-products",
					"total-markets",
					"price-records",
				],
				hiddenCards: data.hiddenCards || [],
				layoutStyle: data.layoutStyle || "grid",
				cardsPerRow: data.cardsPerRow || 5,
				showSummaryCard: data.showSummaryCard ?? true,
				showMonthlyChart: data.showMonthlyChart ?? true,
				showCategoryStats: data.showCategoryStats ?? true,
				showTopProducts: data.showTopProducts ?? true,
				showMarketCompare: data.showMarketCompare ?? true,
				showRecentBuys: data.showRecentBuys ?? true,
				showExpirationAlerts: data.showExpirationAlerts ?? true,
				showReplenishment: data.showReplenishment ?? true,
				showSavingsCard: data.showSavingsCard ?? true,
				showDiscountStats: data.showDiscountStats ?? true,
				showTemporalComp: data.showTemporalComp ?? true,
				showNutritionCard: data.showNutritionCard ?? true,
				showPaymentStats: data.showPaymentStats ?? true,
				showMonthlyStats: data.showMonthlyStats ?? true,
				customTitle: data.customTitle,
				customSubtitle: data.customSubtitle,
				widgetLayouts: data.widgetLayouts || {},
				gridColumns: data.gridColumns || 12,
			},
		})

		return NextResponse.json(preferences)
	} catch (error) {
		console.error("Erro ao salvar preferências do dashboard:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

export async function PUT(request: NextRequest) {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const data = await request.json()

		// Permite atualizações parciais das preferências
		const updateData: any = {}

		if (data.cardOrder !== undefined) updateData.cardOrder = data.cardOrder
		if (data.hiddenCards !== undefined) updateData.hiddenCards = data.hiddenCards
		if (data.layoutStyle !== undefined) updateData.layoutStyle = data.layoutStyle
		if (data.cardsPerRow !== undefined) {
			if (data.cardsPerRow < 1 || data.cardsPerRow > 6) {
				return NextResponse.json({ error: "Cards por linha deve estar entre 1 e 6" }, { status: 400 })
			}
			updateData.cardsPerRow = data.cardsPerRow
		}

		// Atualizar os toggles de visibilidade dos cards
		Object.keys(data).forEach((key) => {
			if (key.startsWith("show") && data[key] !== undefined) {
				updateData[key] = data[key]
			}
		})

		if (data.customTitle !== undefined) updateData.customTitle = data.customTitle
		if (data.customSubtitle !== undefined) updateData.customSubtitle = data.customSubtitle
		if (data.widgetLayouts !== undefined) updateData.widgetLayouts = data.widgetLayouts
		if (data.gridColumns !== undefined) {
			if (data.gridColumns < 6 || data.gridColumns > 24) {
				return NextResponse.json({ error: "Colunas do grid deve estar entre 6 e 24" }, { status: 400 })
			}
			updateData.gridColumns = data.gridColumns
		}

		const preferences = await prisma.dashboardPreference.upsert({
			where: { userId: session.user.id },
			update: updateData,
			create: {
				userId: session.user.id,
				cardOrder: data.cardOrder || [
					"total-purchases",
					"total-spent",
					"total-products",
					"total-markets",
					"price-records",
				],
				hiddenCards: data.hiddenCards || [],
				layoutStyle: data.layoutStyle || "grid",
				cardsPerRow: data.cardsPerRow || 5,
				showSummaryCard: data.showSummaryCard ?? true,
				showMonthlyChart: data.showMonthlyChart ?? true,
				showCategoryStats: data.showCategoryStats ?? true,
				showTopProducts: data.showTopProducts ?? true,
				showMarketCompare: data.showMarketCompare ?? true,
				showRecentBuys: data.showRecentBuys ?? true,
				showExpirationAlerts: data.showExpirationAlerts ?? true,
				showReplenishment: data.showReplenishment ?? true,
				showSavingsCard: data.showSavingsCard ?? true,
				showTemporalComp: data.showTemporalComp ?? true,
				showNutritionCard: data.showNutritionCard ?? true,
				showPaymentStats: data.showPaymentStats ?? true,
				showMonthlyStats: data.showMonthlyStats ?? true,
				customTitle: data.customTitle,
				customSubtitle: data.customSubtitle,
				widgetLayouts: data.widgetLayouts || {},
				gridColumns: data.gridColumns || 12,
				...updateData,
			},
		})

		return NextResponse.json(preferences)
	} catch (error) {
		console.error("Erro ao atualizar preferências do dashboard:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

export async function DELETE() {
	try {
		const session = await getSession()
		if (!session?.user?.id) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		await prisma.dashboardPreference.delete({
			where: { userId: session.user.id },
		})

		return NextResponse.json({ message: "Preferências resetadas para o padrão" })
	} catch (error) {
		console.error("Erro ao resetar preferências do dashboard:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
