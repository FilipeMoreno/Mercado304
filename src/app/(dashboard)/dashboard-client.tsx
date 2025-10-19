"use client"

import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import { Package, ShoppingCart, Store, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { lazy, Suspense, useCallback, useEffect, useMemo } from "react"
import { AiDashboardSummary } from "@/components/ai-dashboard-summary"
import { DashboardCustomizer } from "@/components/dashboard-customizer"
import { DiscountStatsCard } from "@/components/discount-stats-card"
import { ExpirationAlerts } from "@/components/expiration-alerts"
import { InstallPWACard } from "@/components/install-pwa-card"
import { DashboardCardMemo, DashboardStatsCardMemo } from "@/components/memoized"
import { NutritionSummaryCard } from "@/components/nutrition-summary-card"
import { PaymentMethodStats } from "@/components/payment-method-stats"
import { ReplenishmentAlerts } from "@/components/replenishment-alerts"
import { SavingsCard } from "@/components/savings-card"
import { TemporalComparisonCard } from "@/components/temporal-comparison-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { Skeleton } from "@/components/ui/skeleton"
import {
	type DashboardPreferences,
	useConsumptionPatternsQuery,
	useDashboardPreferencesQuery,
	useDashboardStatsQuery,
	useExpirationAlertsQuery,
	useSavingsQuery,
	useTemporalComparisonQuery,
} from "@/hooks"
import { useSession } from "@/lib/auth-client"
import { formatLocalDate } from "@/lib/date-utils"
import { AppToasts } from "@/lib/toasts"
import type { CategoryStats, MarketComparison, RecentPurchase, TopProduct } from "@/types"

const MonthlySpendingChart = lazy(() =>
	import("@/components/monthly-spending-chart").then((module) => ({
		default: module.MonthlySpendingChart,
	})),
)

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
		return (
			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 md:space-y-6">
				<div>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96 mt-2" />
				</div>
				<OptimizedLoading isLoading={true} skeletonType="product" skeletonCount={5}>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
						{Array.from({ length: 5 }).map((_, i) => (
							<motion.div
								key={`dashboard-skeleton-${i}-${Math.random().toString(36).substr(2, 9)}`}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.1 }}
							>
								<Card className="shadow-sm">
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<Skeleton className="h-4 w-20" />
										<Skeleton className="h-4 w-4" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-8 w-16" />
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</OptimizedLoading>
			</motion.div>
		)
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
				<Suspense
					fallback={
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-48 mb-2" />
								<Skeleton className="h-4 w-64" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-64 w-full" />
							</CardContent>
						</Card>
					}
				>
					<MonthlySpendingChart data={stats.monthlySpending} loading={statsLoading} />
				</Suspense>
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

			{currentPrefs.showTemporalComp && stats?.monthlyComparison && (
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.5 }}
					className="md:col-span-2"
				>
					<DashboardStatsCardMemo
						title="Comparação Mensal"
						description="Comparação entre este mês e o anterior"
						icon={<TrendingUp className="h-5 w-5" />}
					>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="text-center p-4 border rounded-lg">
								<div className="text-2xl font-bold text-blue-600">R$ {temporalData?.currentMonth.spent.toFixed(2)}</div>
								<div className="text-sm text-gray-600">Este Mês</div>
								<div className="text-xs text-gray-500 mt-1">{temporalData?.currentMonth.purchases} compras</div>
							</div>

							<div className="text-center p-4 border rounded-lg">
								<div className="text-2xl font-bold text-gray-600">R$ {temporalData?.lastMonth.spent.toFixed(2)}</div>
								<div className="text-sm text-gray-600">Mês Passado</div>
								<div className="text-xs text-gray-500 mt-1">{temporalData?.lastMonth.purchases} compras</div>
							</div>

							<div className="text-center p-4 border rounded-lg">
								{temporalData?.lastMonth.purchases === 0 ? (
									<>
										<div className="text-2xl font-bold text-blue-600">Novo</div>
										<div className="text-sm text-gray-600">Primeiro mês</div>
										<div className="text-xs text-gray-500 mt-1">sem comparação</div>
									</>
								) : (
									<>
										<div
											className={`text-2xl font-bold ${
												temporalData?.changes.spent > 0
													? "text-red-600"
													: temporalData?.changes.spent < 0
														? "text-green-600"
														: "text-gray-600"
											}`}
										>
											{temporalData?.changes.spent > 0 ? "+" : ""}
											{temporalData?.changes.spent.toFixed(1)}%
										</div>
										<div className="text-sm text-gray-600">
											{temporalData?.changes.spent > 0
												? "Aumento"
												: temporalData?.changes.spent < 0
													? "Economia"
													: "Estável"}
										</div>
										<div className="text-xs text-gray-500 mt-1">vs. mês anterior</div>
									</>
								)}
							</div>
						</div>
					</DashboardStatsCardMemo>
				</motion.div>
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
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
					<DashboardStatsCardMemo
						title="Gastos por Categoria"
						description="Distribuição de gastos por categoria de produtos"
						icon={<Package className="h-5 w-5" />}
					>
						<div className="space-y-3">
							{stats?.categoryStats.slice(0, 8).map((category: CategoryStats, index: number) => {
								const percentage =
									(stats?.totalSpent || 0) > 0 ? (category.totalSpent / (stats?.totalSpent || 1)) * 100 : 0
								return (
									<motion.div
										key={category.categoryId}
										className="flex items-center justify-between"
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.7 + index * 0.05 }}
									>
										<div className="flex items-center gap-3">
											<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
												{index + 1}
											</div>
											<div>
												<div className="font-medium">{category.categoryName}</div>
												<div className="text-sm text-gray-500">
													{category.totalQuantity.toFixed(1)} itens • {category.totalPurchases} compras
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="font-medium">R$ {category.totalSpent.toFixed(2)}</div>
											<div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
										</div>
									</motion.div>
								)
							})}
						</div>
					</DashboardStatsCardMemo>
				</motion.div>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{currentPrefs.showTopProducts && (
					<Card className="shadow-sm hover:shadow-lg transition-shadow">
						<CardHeader>
							<CardTitle>Produtos Mais Comprados</CardTitle>
							<CardDescription>Top 5 produtos mais frequentes</CardDescription>
						</CardHeader>
						<CardContent>
							{(stats?.topProducts || []).length === 0 ? (
								<Empty className="border border-dashed py-8">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Package className="h-6 w-6" />
										</EmptyMedia>
										<EmptyTitle>Nenhuma compra registrada ainda</EmptyTitle>
										<EmptyDescription>
											Registre sua primeira compra para ver os produtos mais comprados.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Link href="/compras/nova" className="inline-flex">
											<span className="text-blue-600 hover:text-blue-800">Registre sua primeira compra</span>
										</Link>
									</EmptyContent>
								</Empty>
							) : (
								<div className="space-y-3">
									{(stats?.topProducts || []).slice(0, 5).map((product: TopProduct, index: number) => (
										<div key={product.productId || index} className="flex items-center justify-between">
											<div className="flex items-center gap-3">
												<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
													{index + 1}
												</div>
												<div>
													<div className="font-medium">{product.productName}</div>
													<div className="text-sm text-gray-500">
														{product.totalQuantity?.toFixed(1) || 0} {product.unit || "unidades"}
													</div>
												</div>
											</div>
											<div className="text-right">
												<div className="font-medium">R$ {(product.averagePrice || 0).toFixed(2)}</div>
												<div className="text-sm text-gray-500">{product.totalPurchases || 0} compras</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				)}

				{currentPrefs.showMarketCompare && (
					<Card className="shadow-sm hover:shadow-lg transition-shadow">
						<CardHeader>
							<CardTitle>Estatísticas por Mercado</CardTitle>
							<CardDescription>Seus mercados mais frequentados</CardDescription>
						</CardHeader>
						<CardContent>
							{(stats?.marketComparison || []).length === 0 ? (
								<Empty className="border border-dashed py-8">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Store className="h-6 w-6" />
										</EmptyMedia>
										<EmptyTitle>Nenhuma compra registrada ainda</EmptyTitle>
										<EmptyDescription>Cadastre um mercado e registre suas compras para ver estatísticas.</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Link href="/mercados/novo" className="inline-flex">
											<span className="text-blue-600 hover:text-blue-800">Cadastre seu primeiro mercado</span>
										</Link>
									</EmptyContent>
								</Empty>
							) : (
								<div className="space-y-3">
									{(stats?.marketComparison || [])
										.sort((a: MarketComparison, b: MarketComparison) => b.totalPurchases - a.totalPurchases)
										.map((market: MarketComparison, index: number) => {
											// Calcular o total gasto aproximado
											const totalSpent = market.averagePrice * market.totalPurchases
											
											return (
												<div key={market.marketId} className="border rounded-lg p-3 hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors">
													<div className="flex items-start justify-between gap-3">
														<div className="flex items-start gap-3 flex-1 min-w-0">
															<div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold flex-shrink-0">
																{index + 1}
															</div>
															<div className="flex-1 min-w-0">
																<div className="font-medium truncate">{market.marketName}</div>
																<div className="text-sm text-muted-foreground mt-1 space-y-1">
																	<div className="flex items-center gap-4">
																		<span>🛒 {market.totalPurchases} {market.totalPurchases === 1 ? 'compra' : 'compras'}</span>
																		<span>💰 R$ {totalSpent.toFixed(2)} total</span>
																	</div>
																	<div className="text-xs opacity-75">
																		Ticket médio: R$ {market.averagePrice.toFixed(2)}
																	</div>
																</div>
															</div>
														</div>
													</div>
												</div>
											)
										})}
								</div>
							)}
						</CardContent>
					</Card>
				)}
			</div>

			{currentPrefs.showRecentBuys && (
				<Card className="shadow-sm hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle>Compras Recentes</CardTitle>
						<CardDescription>Últimas 5 compras realizadas</CardDescription>
					</CardHeader>
					<CardContent>
						{(stats.recentPurchases || []).length === 0 ? (
							<Empty className="border border-dashed py-8">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<ShoppingCart className="h-6 w-6" />
									</EmptyMedia>
									<EmptyTitle>Nenhuma compra registrada ainda</EmptyTitle>
									<EmptyDescription>Registre uma compra para ver aqui.</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Link href="/compras/nova" className="inline-flex">
										<span className="text-blue-600 hover:text-blue-800">Registre sua primeira compra</span>
									</Link>
								</EmptyContent>
							</Empty>
						) : (
							<div className="space-y-3">
								{(stats.recentPurchases || []).slice(0, 5).map((purchase: RecentPurchase) => (
									<div
										key={purchase.id}
										className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
									>
										<div className="flex items-center gap-3">
											<Store className="h-5 w-5 text-gray-400" />
											<div>
												<div className="font-medium">{purchase.market?.name || "Mercado não identificado"}</div>
												<div className="text-sm text-gray-500">
													{formatLocalDate(purchase.purchaseDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="font-medium">R$ {(purchase.totalAmount || 0).toFixed(2)}</div>
											<div className="text-sm text-gray-500">
												{purchase.items?.length || 0} {purchase.items?.length === 1 ? "item" : "itens"}
											</div>
										</div>
									</div>
								))}

								{(stats.recentPurchases || []).length > 5 && (
									<div className="text-center pt-3 border-t">
										<Link href="/compras" className="text-sm text-blue-600 hover:text-blue-800">
											Ver todas as compras ({stats.totalPurchases})
										</Link>
									</div>
								)}
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</motion.div>
	)
}
