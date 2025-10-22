"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo } from "react"
import { AiDashboardSummary } from "@/components/ai-dashboard-summary"
import { DashboardCustomizer } from "@/components/dashboard-customizer"
import { DiscountStatsCard } from "@/components/discount-stats-card"
import { ExpirationAlerts } from "@/components/expiration-alerts"
import { InstallPWACard } from "@/components/install-pwa-card"
import { DashboardCardMemo } from "@/components/memoized"
import { NutritionSummaryCard } from "@/components/nutrition-summary-card"
import { PaymentMethodStats } from "@/components/payment-method-stats"
import { ReplenishmentAlerts } from "@/components/replenishment-alerts"
import { SavingsCard } from "@/components/savings-card"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"
import { TemporalComparisonCard } from "@/components/temporal-comparison-card"
import { MonthlySpendingWidget } from "@/components/widgets/monthly-spending-widget"
import { TemporalComparisonWidget } from "@/components/widgets/temporal-comparison-widget"
import { CategoryStatsWidget } from "@/components/widgets/category-stats-widget"
import { TopProductsWidget } from "@/components/widgets/top-products-widget"
import { MarketComparisonWidget } from "@/components/widgets/market-comparison-widget"
import { RecentPurchasesWidget } from "@/components/widgets/recent-purchases-widget"
import { SpendingTrendsWidget } from "@/components/widgets/spending-trends-widget"
import { PriceAlertsWidget } from "@/components/widgets/price-alerts-widget"
import { BudgetTrackerWidget } from "@/components/widgets/budget-tracker-widget"
import { ShoppingPatternsWidget } from "@/components/widgets/shopping-patterns-widget"
import {
	type DashboardPreferences,
	useConsumptionPatternsQuery,
	useDashboardPreferencesQuery,
	useDashboardStatsQuery,
	useExpirationAlertsQuery,
	useSavingsQuery,
	useTemporalComparisonQuery,
	useSpendingTrendsQuery,
	usePriceAlertsQuery,
	useBudgetTrackerQuery,
	useShoppingPatternsQuery,
} from "@/hooks"
import { useSession } from "@/lib/auth-client"
import { formatLocalDate } from "@/lib/date-utils"
import { AppToasts } from "@/lib/toasts"
import type { CategoryStats, MarketComparison, RecentPurchase, TopProduct } from "@/types"
import Link from "next/link"

export function DashboardClient() {
	const router = useRouter()
	const { data: session, isPending: sessionLoading } = useSession()

	// Proteção: redireciona se email não verificado
	useEffect(() => {
		if (!sessionLoading && session?.user && !session.user.emailVerified) {
			router.push("/auth/verify-request")
		}
	}, [session, sessionLoading, router])

	// React Query hooks
	const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStatsQuery()
	const { data: savingsData, isLoading: savingsLoading } = useSavingsQuery()
	const { data: temporalData, isLoading: temporalLoading } = useTemporalComparisonQuery()
	const { data: consumptionData, isLoading: consumptionLoading } = useConsumptionPatternsQuery()
	const { data: expirationData, isLoading: expirationLoading } = useExpirationAlertsQuery()
	const { data: preferences, isLoading: preferencesLoading } = useDashboardPreferencesQuery()
	
	// New widget hooks
	const { data: spendingTrendsData, isLoading: spendingTrendsLoading } = useSpendingTrendsQuery()
	const { data: priceAlertsData, isLoading: priceAlertsLoading } = usePriceAlertsQuery()
	const { data: budgetTrackerData, isLoading: budgetTrackerLoading } = useBudgetTrackerQuery(1500)
	const { data: shoppingPatternsData, isLoading: shoppingPatternsLoading } = useShoppingPatternsQuery()

	const isLoading =
		statsLoading || savingsLoading || temporalLoading || consumptionLoading || expirationLoading || preferencesLoading

	const handleRefresh = () => {
		router.refresh()
		AppToasts.info("Atualizando dados do dashboard...")
	}

	const handleAddToShoppingList = async (productId: string, quantity: number) => {
		console.log(`Adicionando ${quantity} do produto ${productId} à lista.`)
		AppToasts.success(`Produto adicionado à lista de compras!`)
	}

	// Usar preferências ou defaults
	const currentPrefs: DashboardPreferences = preferences || {
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
		showSpendingTrends: true,
		showPriceAlerts: true,
		showBudgetTracker: true,
		showShoppingPatterns: true,
		customTitle: undefined,
		customSubtitle: undefined,
	}

	// Função otimizada para renderizar os cards principais
	const renderMainCard = useCallback(
		(cardId: string) => {
			if (currentPrefs.hiddenCards.includes(cardId)) return null

			if (cardId === "price-records") {
				return (
					<Link key={cardId} href="/precos">
						<DashboardCardMemo cardId={cardId} stats={stats} />
					</Link>
				)
			}

			return <DashboardCardMemo key={cardId} cardId={cardId} stats={stats} />
		},
		[currentPrefs.hiddenCards, stats],
	)

	// Determinar classe CSS baseada no layout (memoizado)
	const layoutClassName = useMemo(() => {
		switch (currentPrefs.layoutStyle) {
			case "list":
				return "grid grid-cols-1 gap-4 md:gap-6"
			case "compact":
				return `grid grid-cols-3 md:grid-cols-${Math.min(currentPrefs.cardsPerRow, 6)} gap-2 md:gap-3`
			default:
				return `grid grid-cols-2 md:grid-cols-${Math.min(currentPrefs.cardsPerRow, 5)} gap-4 md:gap-6`
		}
	}, [currentPrefs.layoutStyle, currentPrefs.cardsPerRow])

	if (statsError) {
		return (
			<div className="text-center">
				<h2 className="text-xl font-semibold text-red-600">Erro ao carregar o dashboard</h2>
				<p className="text-gray-500">Não foi possível buscar os dados. Tente recarregar a página.</p>
			</div>
		)
	}

	// Loading skeleton for dashboard stats
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
					<h1 className="text-2xl md:text-3xl font-bold">{currentPrefs.customTitle || "Bem-vindo ao Mercado304"}</h1>
					<p className="text-gray-600 mt-2 text-sm md:text-base">
						{currentPrefs.customSubtitle || "Sistema completo de gerenciamento de compras de mercado"}
					</p>
				</div>
				<DashboardCustomizer />
			</motion.div>

			{currentPrefs.showSummaryCard && (
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
					<AiDashboardSummary />
				</motion.div>
			)}

			{/* Card de instalação do PWA */}
			<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
				<InstallPWACard />
			</motion.div>

			{/* Cards principais ordenados conforme preferências */}
			<motion.div
				className={layoutClassName}
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.3 }}
			>
				{currentPrefs.cardOrder
					.map((cardId, index) => (
						<motion.div
							key={cardId}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4 + index * 0.05 }}
						>
							{renderMainCard(cardId)}
						</motion.div>
					))
					.filter(Boolean)}
			</motion.div>

			{currentPrefs.showMonthlyChart && stats?.monthlySpending && stats.monthlySpending.length > 0 && (
				<MonthlySpendingWidget data={stats.monthlySpending} loading={statsLoading} />
			)}

			{currentPrefs.showReplenishment && consumptionData?.replenishmentAlerts?.length > 0 && (
				<ReplenishmentAlerts
					data={consumptionData}
					loading={consumptionLoading}
					onAddToShoppingList={handleAddToShoppingList}
				/>
			)}

			{currentPrefs.showExpirationAlerts &&
				expirationData?.stats &&
				(expirationData.stats.expired > 0 ||
					expirationData.stats.expiringToday > 0 ||
					expirationData.stats.expiringSoon > 0 ||
					expirationData.stats.lowStock > 0) && (
					<ExpirationAlerts data={expirationData} loading={expirationLoading} onRefresh={handleRefresh} />
				)}

			{currentPrefs.showTemporalComp && temporalData && (
				<TemporalComparisonWidget temporalData={temporalData} />
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
				{currentPrefs.showSavingsCard && <SavingsCard savingsData={savingsData} loading={savingsLoading} />}
				{currentPrefs.showTemporalComp && (
					<TemporalComparisonCard temporalData={temporalData} loading={temporalLoading} />
				)}
				{currentPrefs.showNutritionCard && <NutritionSummaryCard />}
			</div>

			{/* Card de Estatísticas de Descontos */}
			{currentPrefs.showDiscountStats && stats?.discountStats && (
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
					<DiscountStatsCard discountStats={stats.discountStats} isLoading={statsLoading} />
				</motion.div>
			)}

			{/* Estatísticas de Métodos de Pagamento */}
			{currentPrefs.showPaymentStats && <PaymentMethodStats />}

			{currentPrefs.showCategoryStats && stats?.categoryStats && stats.categoryStats.length > 0 && (
				<CategoryStatsWidget categoryStats={stats.categoryStats} totalSpent={stats.totalSpent} />
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{currentPrefs.showTopProducts && <TopProductsWidget topProducts={stats?.topProducts} />}
				{currentPrefs.showMarketCompare && <MarketComparisonWidget marketComparison={stats?.marketComparison} />}
			</div>

			{currentPrefs.showRecentBuys && (
				<RecentPurchasesWidget 
					recentPurchases={stats?.recentPurchases} 
					totalPurchases={stats?.totalPurchases} 
				/>
			)}

			{/* Novos widgets adicionais */}
			<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{currentPrefs.showSpendingTrends && spendingTrendsData && (
					<SpendingTrendsWidget data={spendingTrendsData} />
				)}
				
				{currentPrefs.showBudgetTracker && budgetTrackerData && (
					<BudgetTrackerWidget budget={budgetTrackerData} />
				)}

				{currentPrefs.showShoppingPatterns && shoppingPatternsData && (
					<ShoppingPatternsWidget patterns={shoppingPatternsData} />
				)}

				{currentPrefs.showPriceAlerts && priceAlertsData?.alerts && (
					<PriceAlertsWidget alerts={priceAlertsData.alerts} />
				)}
			</div>
		</motion.div>
	)
}
