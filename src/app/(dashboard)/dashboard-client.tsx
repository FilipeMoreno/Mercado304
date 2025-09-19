"use client"

import { ptBR } from "date-fns/locale"
import { DollarSign, Package, Receipt, ShoppingCart, Store, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { lazy, Suspense } from "react"
import { AiDashboardSummary } from "@/components/ai-dashboard-summary"
import { DashboardCustomizer } from "@/components/dashboard-customizer"
import { ExpirationAlerts } from "@/components/expiration-alerts"
import { NutritionSummaryCard } from "@/components/nutrition-summary-card"
import { PaymentMethodStats } from "@/components/payment-method-stats"
import { ReplenishmentAlerts } from "@/components/replenishment-alerts"
import { SavingsCard } from "@/components/savings-card"
import { TemporalComparisonCard } from "@/components/temporal-comparison-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatLocalDate } from "@/lib/date-utils"
import { AppToasts } from "@/lib/toasts"

const MonthlySpendingChart = lazy(() =>
	import("@/components/monthly-spending-chart").then((module) => ({
		default: module.MonthlySpendingChart,
	})),
)

export function DashboardClient() {
	const router = useRouter()

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
		showTemporalComp: true,
		showNutritionCard: true,
		showPaymentStats: true,
		customTitle: undefined,
		customSubtitle: undefined,
	}

	// Função para renderizar os cards principais
	const renderMainCard = (cardId: string) => {
		if (currentPrefs.hiddenCards.includes(cardId)) return null

		switch (cardId) {
			case "total-purchases":
				return (
					<Card key={cardId} className="shadow-sm hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-xs md:text-sm font-medium">Total de Compras</CardTitle>
							<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-xl md:text-2xl font-bold">{stats?.totalPurchases || 0}</div>
						</CardContent>
					</Card>
				)

			case "total-spent":
				return (
					<Card key={cardId} className="shadow-sm hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-xs md:text-sm font-medium">Total Gasto</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-xl md:text-2xl font-bold">R$ {(stats?.totalSpent || 0).toFixed(2)}</div>
						</CardContent>
					</Card>
				)

			case "total-products":
				return (
					<Card key={cardId} className="shadow-sm hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-xs md:text-sm font-medium">Produtos Cadastrados</CardTitle>
							<Package className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-xl md:text-2xl font-bold">{stats?.totalProducts || 0}</div>
						</CardContent>
					</Card>
				)

			case "total-markets":
				return (
					<Card key={cardId} className="shadow-sm hover:shadow-lg transition-shadow">
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-xs md:text-sm font-medium">Mercados Cadastrados</CardTitle>
							<Store className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-xl md:text-2xl font-bold">{stats?.totalMarkets || 0}</div>
						</CardContent>
					</Card>
				)

			case "price-records":
				return (
					<Link key={cardId} href="/precos">
						<Card className="shadow-sm hover:shadow-lg transition-shadow cursor-pointer hover:bg-muted/50">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-xs md:text-sm font-medium">Preços Registrados</CardTitle>
								<Receipt className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-xl md:text-2xl font-bold">{stats?.priceRecords?.totalRecords || 0}</div>
								{stats?.priceRecords?.averagePrice > 0 && (
									<div className="text-xs text-muted-foreground mt-1">
										Média: R$ {stats.priceRecords.averagePrice.toFixed(2)}
									</div>
								)}
							</CardContent>
						</Card>
					</Link>
				)

			default:
				return null
		}
	}

	// Determinar classe CSS baseada no layout
	const getLayoutClassName = () => {
		switch (currentPrefs.layoutStyle) {
			case "list":
				return "grid grid-cols-1 gap-4 md:gap-6"
			case "compact":
				return `grid grid-cols-3 md:grid-cols-${Math.min(currentPrefs.cardsPerRow, 6)} gap-2 md:gap-3`
			default:
				return `grid grid-cols-2 md:grid-cols-${Math.min(currentPrefs.cardsPerRow, 5)} gap-4 md:gap-6`
		}
	}

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
			<div className="space-y-4 md:space-y-6">
				<div>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96 mt-2" />
				</div>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
					{Array.from({ length: 5 }).map((_, i) => (
						<Card key={i} className="shadow-sm">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-4" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-16" />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-4 md:space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl md:text-3xl font-bold">{currentPrefs.customTitle || "Bem-vindo ao Mercado304"}</h1>
					<p className="text-gray-600 mt-2 text-sm md:text-base">
						{currentPrefs.customSubtitle || "Sistema completo de gerenciamento de compras de mercado"}
					</p>
				</div>
				<DashboardCustomizer />
			</div>

			{currentPrefs.showSummaryCard && <AiDashboardSummary />}

			{/* Cards principais ordenados conforme preferências */}
			<div className={getLayoutClassName()}>
				{currentPrefs.cardOrder.map((cardId) => renderMainCard(cardId)).filter(Boolean)}
			</div>

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
				<Card className="md:col-span-2 shadow-sm hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							Comparação Mensal
						</CardTitle>
						<CardDescription>Comparação entre este mês e o anterior</CardDescription>
					</CardHeader>
					<CardContent>
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
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
				{currentPrefs.showSavingsCard && <SavingsCard savingsData={savingsData} loading={savingsLoading} />}
				{currentPrefs.showTemporalComp && (
					<TemporalComparisonCard temporalData={temporalData} loading={temporalLoading} />
				)}
				{currentPrefs.showNutritionCard && <NutritionSummaryCard />}
			</div>

			{/* Estatísticas de Métodos de Pagamento */}
			{currentPrefs.showPaymentStats && <PaymentMethodStats />}

			{currentPrefs.showCategoryStats && stats?.categoryStats && stats.categoryStats.length > 0 && (
				<Card className="shadow-sm hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Gastos por Categoria
						</CardTitle>
						<CardDescription>Distribuição de gastos por categoria de produtos</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{stats?.categoryStats.slice(0, 8).map((category: any, index: number) => {
								const percentage =
									(stats?.totalSpent || 0) > 0 ? (category.totalSpent / (stats?.totalSpent || 1)) * 100 : 0
								return (
									<div key={category.categoryId} className="flex items-center justify-between">
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
									</div>
								)
							})}
						</div>
					</CardContent>
				</Card>
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
								<div className="text-center py-8 text-gray-500">
									<Package className="h-12 w-12 mx-auto mb-4" />
									<p>Nenhuma compra registrada ainda</p>
									<p className="text-sm mt-2">
										<Link href="/compras/nova" className="text-blue-600 hover:text-blue-800">
											Registre sua primeira compra
										</Link>
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{(stats?.topProducts || []).slice(0, 5).map((product: any, index: number) => (
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
							<CardTitle>Comparação de Mercados</CardTitle>
							<CardDescription>Média de preços por mercado</CardDescription>
						</CardHeader>
						<CardContent>
							{(stats?.marketComparison || []).length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<Store className="h-12 w-12 mx-auto mb-4" />
									<p>Nenhuma compra registrada ainda</p>
									<p className="text-sm mt-2">
										<Link href="/mercados/novo" className="text-blue-600 hover:text-blue-800">
											Cadastre seu primeiro mercado
										</Link>
									</p>
								</div>
							) : (
								<div className="space-y-3">
									{(stats?.marketComparison || []).map((market: any, index: number) => {
										const cheapest =
											(stats?.marketComparison?.length || 0) > 1
												? stats?.marketComparison?.reduce((min: any, curr: any) =>
														curr.averagePrice < min.averagePrice ? curr : min,
													)
												: null
										const isCheapest = cheapest && market.marketId === cheapest.marketId

										return (
											<div key={market.marketId} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div
														className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
															isCheapest ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
														}`}
													>
														{index + 1}
													</div>
													<div>
														<div className="font-medium flex items-center gap-2">
															{market.marketName}
															{isCheapest && (
																<span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
																	Mais Barato
																</span>
															)}
														</div>
														<div className="text-sm text-gray-500">{market.totalPurchases} compras</div>
													</div>
												</div>
												<div className="text-right">
													<div className="font-medium">R$ {(market.averagePrice || 0).toFixed(2)}</div>
													<div className="text-sm text-gray-500">média por compra</div>
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
							<div className="text-center py-8 text-gray-500">
								<ShoppingCart className="h-12 w-12 mx-auto mb-4" />
								<p>Nenhuma compra registrada ainda</p>
								<p className="text-sm mt-2">
									<Link href="/compras/nova" className="text-blue-600 hover:text-blue-800">
										Registre sua primeira compra
									</Link>
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{(stats.recentPurchases || []).slice(0, 5).map((purchase: any) => (
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
		</div>
	)
}
