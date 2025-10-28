"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { DashboardGridLayout } from "@/components/widgets/dashboard-grid-layout"
import { WidgetCustomizer } from "@/components/widgets/widget-customizer"
import { WidgetMapper } from "@/components/widgets/widget-mapper"
import { WidgetWrapper } from "@/components/widgets/widget-wrapper"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"
import {
	DEFAULT_ENABLED_WIDGETS,
	DEFAULT_LAYOUT_LG,
	DEFAULT_LAYOUT_MD,
	DEFAULT_LAYOUT_SM,
	DEFAULT_LAYOUT_XS,
} from "@/config/widgets"
import {
	useConsumptionPatternsQuery,
	useDashboardPreferencesQuery,
	useDashboardStatsQuery,
	useExpirationAlertsQuery,
	useSavingsQuery,
	useTemporalComparisonQuery,
	useUpdateDashboardPreferencesMutation,
	useResetDashboardPreferencesMutation,
} from "@/hooks"
import { useSession } from "@/lib/auth-client"
import { AppToasts } from "@/lib/toasts"
import type { ResponsiveWidgetLayouts, WidgetType } from "@/types/dashboard-widgets"

export function DashboardWidgetClient() {
	const router = useRouter()
	const { data: session, isPending: sessionLoading } = useSession()

	// Estados
	const [isEditing, setIsEditing] = useState(false)
	const [layouts, setLayouts] = useState<ResponsiveWidgetLayouts>({
		lg: DEFAULT_LAYOUT_LG,
		md: DEFAULT_LAYOUT_MD,
		sm: DEFAULT_LAYOUT_SM,
		xs: DEFAULT_LAYOUT_XS,
		xxs: DEFAULT_LAYOUT_XS,
	})
	const [enabledWidgets, setEnabledWidgets] = useState<WidgetType[]>(DEFAULT_ENABLED_WIDGETS as WidgetType[])
	const [gridColumns, setGridColumns] = useState(12)
	const [customTitle, setCustomTitle] = useState<string | undefined>(undefined)
	const [customSubtitle, setCustomSubtitle] = useState<string | undefined>(undefined)

	// React Query hooks
	const { data: stats, isLoading: statsLoading } = useDashboardStatsQuery()
	const { data: savingsData, isLoading: savingsLoading } = useSavingsQuery()
	const { data: temporalData, isLoading: temporalLoading } = useTemporalComparisonQuery()
	const { data: consumptionData, isLoading: consumptionLoading } = useConsumptionPatternsQuery()
	const { data: expirationData, isLoading: expirationLoading } = useExpirationAlertsQuery()
	const { data: preferences, isLoading: preferencesLoading } = useDashboardPreferencesQuery()

	const updatePreferences = useUpdateDashboardPreferencesMutation()
	const resetPreferences = useResetDashboardPreferencesMutation()

	const isLoading =
		statsLoading || savingsLoading || temporalLoading || consumptionLoading || expirationLoading || preferencesLoading

	// Proteção: redireciona se email não verificado
	useEffect(() => {
		if (!sessionLoading && session?.user && !session.user.emailVerified) {
			router.push("/auth/verify-request")
		}
	}, [session, sessionLoading, router])

	// Carregar preferências salvas
	useEffect(() => {
		if (preferences) {
			// Carregar layouts se existirem
			if (preferences.widgetLayouts && typeof preferences.widgetLayouts === "object") {
				const savedLayouts = preferences.widgetLayouts as any
				if (savedLayouts.lg || savedLayouts.md || savedLayouts.sm) {
					setLayouts({
						lg: savedLayouts.lg || DEFAULT_LAYOUT_LG,
						md: savedLayouts.md || DEFAULT_LAYOUT_MD,
						sm: savedLayouts.sm || DEFAULT_LAYOUT_SM,
						xs: savedLayouts.xs || DEFAULT_LAYOUT_XS,
						xxs: savedLayouts.xxs || DEFAULT_LAYOUT_XS,
					})
				}
			}

			// Carregar widgets habilitados baseado nas preferências
			const enabled: WidgetType[] = []
			if (preferences.showSummaryCard) enabled.push("ai-summary")
			if (preferences.showMonthlyChart) enabled.push("monthly-chart")
			if (preferences.showMonthlyStats) enabled.push("monthly-stats")
			if (preferences.showCategoryStats) enabled.push("category-stats")
			if (preferences.showTopProducts) enabled.push("top-products")
			if (preferences.showMarketCompare) enabled.push("market-compare")
			if (preferences.showRecentBuys) enabled.push("recent-purchases")
			if (preferences.showExpirationAlerts) enabled.push("expiration-alerts")
			if (preferences.showReplenishment) enabled.push("replenishment-alerts")
			if (preferences.showSavingsCard) enabled.push("savings-card")
			if (preferences.showDiscountStats) enabled.push("discount-stats")
			if (preferences.showTemporalComp) enabled.push("temporal-comparison")
			if (preferences.showNutritionCard) enabled.push("nutrition-summary")
			if (preferences.showPaymentStats) enabled.push("payment-stats")
			if (preferences.showPaymentTransactions) enabled.push("payment-transactions")
			if (preferences.showPaymentTotalAmount) enabled.push("payment-total-amount")
			if (preferences.showPaymentAverageTicket) enabled.push("payment-average-ticket")
			if (preferences.showPaymentMostUsed) enabled.push("payment-most-used")
			if (preferences.showPaymentDistribution) enabled.push("payment-distribution")
			if (preferences.showPaymentDetails) enabled.push("payment-details")
			if (preferences.showPaymentInsights) enabled.push("payment-insights")

			// Adicionar cards principais
			const mainCards: WidgetType[] = [
				"total-purchases",
				"total-spent",
				"total-products",
				"total-markets",
				"price-records",
			]
			mainCards.forEach((card) => {
				if (!preferences.hiddenCards.includes(card)) {
					enabled.push(card)
				}
			})

			// Adicionar install-pwa apenas se não estiver instalado
			const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
				(window.navigator as any).standalone === true ||
				document.referrer.includes("android-app://")

			if (!isStandalone) {
				enabled.push("install-pwa")
			}

			setEnabledWidgets(enabled)
			setGridColumns(preferences.gridColumns || 12)
			setCustomTitle(preferences.customTitle || undefined)
			setCustomSubtitle(preferences.customSubtitle || undefined)
		}
	}, [preferences])

	const handleLayoutChange = useCallback((newLayouts: ResponsiveWidgetLayouts) => {
		setLayouts(newLayouts)
	}, [])

	const handleToggleWidget = useCallback((widgetId: WidgetType) => {
		setEnabledWidgets((prev) => {
			if (prev.includes(widgetId)) {
				return prev.filter((id) => id !== widgetId)
			}
			return [...prev, widgetId]
		})
	}, [])

	const handleAddWidget = useCallback((widgetId: WidgetType) => {
		if (!enabledWidgets.includes(widgetId)) {
			setEnabledWidgets((prev) => [...prev, widgetId])
		}
	}, [enabledWidgets])

	const handleRemoveWidget = useCallback((widgetId: WidgetType) => {
		setEnabledWidgets((prev) => prev.filter((id) => id !== widgetId))
	}, [])

	const handleSave = useCallback(async () => {
		try {
			await updatePreferences.mutateAsync({
				widgetLayouts: layouts,
				gridColumns,
				customTitle,
				customSubtitle,
				// Manter compatibilidade com o sistema antigo
				showSummaryCard: enabledWidgets.includes("ai-summary"),
				showMonthlyChart: enabledWidgets.includes("monthly-chart"),
				showMonthlyStats: enabledWidgets.includes("monthly-stats"),
				showCategoryStats: enabledWidgets.includes("category-stats"),
				showTopProducts: enabledWidgets.includes("top-products"),
				showMarketCompare: enabledWidgets.includes("market-compare"),
				showRecentBuys: enabledWidgets.includes("recent-purchases"),
				showExpirationAlerts: enabledWidgets.includes("expiration-alerts"),
				showReplenishment: enabledWidgets.includes("replenishment-alerts"),
				showSavingsCard: enabledWidgets.includes("savings-card"),
				showDiscountStats: enabledWidgets.includes("discount-stats"),
				showTemporalComp: enabledWidgets.includes("temporal-comparison"),
				showNutritionCard: enabledWidgets.includes("nutrition-summary"),
				showPaymentStats: enabledWidgets.includes("payment-stats"),
				showPaymentTransactions: enabledWidgets.includes("payment-transactions"),
				showPaymentTotalAmount: enabledWidgets.includes("payment-total-amount"),
				showPaymentAverageTicket: enabledWidgets.includes("payment-average-ticket"),
				showPaymentMostUsed: enabledWidgets.includes("payment-most-used"),
				showPaymentDistribution: enabledWidgets.includes("payment-distribution"),
				showPaymentDetails: enabledWidgets.includes("payment-details"),
				showPaymentInsights: enabledWidgets.includes("payment-insights"),
				hiddenCards: [
					"total-purchases",
					"total-spent",
					"total-products",
					"total-markets",
					"price-records",
				].filter((card) => !enabledWidgets.includes(card as WidgetType)),
			} as any)
		} catch (error) {
			throw error
		}
	}, [layouts, gridColumns, customTitle, customSubtitle, enabledWidgets, updatePreferences])

	const handleReset = useCallback(async () => {
		try {
			await resetPreferences.mutateAsync()
			setLayouts({
				lg: DEFAULT_LAYOUT_LG,
				md: DEFAULT_LAYOUT_MD,
				sm: DEFAULT_LAYOUT_SM,
				xs: DEFAULT_LAYOUT_XS,
				xxs: DEFAULT_LAYOUT_XS,
			})
			setEnabledWidgets(DEFAULT_ENABLED_WIDGETS as WidgetType[])
			setGridColumns(12)
			setCustomTitle(undefined)
			setCustomSubtitle(undefined)
		} catch (error) {
			throw error
		}
	}, [resetPreferences])

	const handleRefresh = useCallback(() => {
		router.refresh()
		AppToasts.info("Atualizando dados do dashboard...")
	}, [router])

	const handleAddToShoppingList = useCallback(async (productId: string, quantity: number) => {
		console.log(`Adicionando ${quantity} do produto ${productId} à lista.`)
		AppToasts.success(`Produto adicionado à lista de compras!`)
	}, [])

	if (isLoading) {
		return <DashboardSkeleton />
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ delay: 0.1 }}
			className="space-y-4 md:space-y-6"
		>
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center justify-between"
			>
				<div>
					<h1 className="text-2xl md:text-3xl font-bold">{customTitle || "Bem-vindo ao Mercado304"}</h1>
					<p className="text-gray-600 mt-2 text-sm md:text-base">
						{customSubtitle || "Sistema completo de gerenciamento de compras de mercado"}
					</p>
				</div>
				<WidgetCustomizer
					isEditing={isEditing}
					onEditingChange={setIsEditing}
					layouts={layouts}
					enabledWidgets={enabledWidgets}
					onToggleWidget={handleToggleWidget}
					onAddWidget={handleAddWidget}
					onSave={handleSave}
					onReset={handleReset}
					gridColumns={gridColumns}
					onGridColumnsChange={setGridColumns}
					customTitle={customTitle}
					customSubtitle={customSubtitle}
					onCustomTitleChange={setCustomTitle}
					onCustomSubtitleChange={setCustomSubtitle}
				/>
			</motion.div>

			<DashboardGridLayout layouts={layouts} isEditing={isEditing} onLayoutChange={handleLayoutChange}>
				{enabledWidgets.map((widgetId) => (
					<div key={widgetId}>
						<WidgetWrapper
							widgetId={widgetId}
							isEditing={isEditing}
							onRemove={handleRemoveWidget}
						>
							<WidgetMapper
								widgetId={widgetId}
								stats={stats}
								savingsData={savingsData}
								temporalData={temporalData}
								consumptionData={consumptionData}
								expirationData={expirationData}
								isLoading={isLoading}
								onRefresh={handleRefresh}
								onAddToShoppingList={handleAddToShoppingList}
							/>
						</WidgetWrapper>
					</div>
				))}
			</DashboardGridLayout>
		</motion.div>
	)
}
