"use client"

import { lazy, Suspense } from "react"
import { AiDashboardSummary } from "@/components/ai-dashboard-summary"
import { DashboardCardMemo } from "@/components/memoized"
import { DiscountStatsCard } from "@/components/discount-stats-card"
import { ExpirationAlerts } from "@/components/expiration-alerts"
import { InstallPWACard } from "@/components/install-pwa-card"
import { MonthlyPurchaseStats } from "@/components/monthly-purchase-stats"
import { NutritionSummaryCard } from "@/components/nutrition-summary-card"
import { PaymentMethodStats } from "@/components/payment-method-stats"
import { ReplenishmentAlerts } from "@/components/replenishment-alerts"
import { SavingsCard } from "@/components/savings-card"
import { TemporalComparisonCard } from "@/components/temporal-comparison-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WidgetType } from "@/types/dashboard-widgets"
import type {
	CategoryStats,
	MarketComparison,
	RecentPurchase,
	TopProduct,
} from "@/types"
import { Store, Package, TrendingUp, ShoppingCart } from "lucide-react"
import { formatLocalDate } from "@/lib/date-utils"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

const MonthlySpendingChart = lazy(() =>
	import("@/components/monthly-spending-chart").then((module) => ({
		default: module.MonthlySpendingChart,
	})),
)

interface WidgetMapperProps {
	widgetId: WidgetType
	stats?: any // Tipo inferido do hook useDashboardStatsQuery
	savingsData?: any
	temporalData?: any
	consumptionData?: any
	expirationData?: any // Tipo inferido do hook
	isLoading?: boolean
	onRefresh?: () => void
	onAddToShoppingList?: (productId: string, quantity: number) => Promise<void>
}

export function WidgetMapper({
	widgetId,
	stats,
	savingsData,
	temporalData,
	consumptionData,
	expirationData,
	isLoading = false,
	onRefresh,
	onAddToShoppingList,
}: WidgetMapperProps) {
	// Widgets de estatísticas principais
	if (widgetId === "total-purchases") {
		return <DashboardCardMemo cardId="total-purchases" stats={stats} />
	}

	if (widgetId === "total-spent") {
		return <DashboardCardMemo cardId="total-spent" stats={stats} />
	}

	if (widgetId === "total-products") {
		return <DashboardCardMemo cardId="total-products" stats={stats} />
	}

	if (widgetId === "total-markets") {
		return <DashboardCardMemo cardId="total-markets" stats={stats} />
	}

	if (widgetId === "price-records") {
		return (
			<Link href="/precos">
				<DashboardCardMemo cardId="price-records" stats={stats} />
			</Link>
		)
	}

	// Widget de resumo IA
	if (widgetId === "ai-summary") {
		return <AiDashboardSummary />
	}

	// Widget de instalação PWA
	if (widgetId === "install-pwa") {
		return <InstallPWACard />
	}

	// Widget de gráfico mensal
	if (widgetId === "monthly-chart" && stats?.monthlySpending) {
		return (
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
				<MonthlySpendingChart data={stats.monthlySpending} loading={isLoading} />
			</Suspense>
		)
	}

	// Widget de estatísticas mensais
	if (widgetId === "monthly-stats") {
		return <MonthlyPurchaseStats data={stats} loading={isLoading} />
	}

	// Widget de gastos por categoria
	if (widgetId === "category-stats" && stats?.categoryStats) {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						Gastos por Categoria
					</CardTitle>
					<CardDescription>Distribuição de gastos por categoria de produtos</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{stats.categoryStats.slice(0, 8).map((category: CategoryStats, index: number) => {
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
		)
	}

	// Widget de produtos mais comprados
	if (widgetId === "top-products") {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle>Produtos Mais Comprados</CardTitle>
					<CardDescription>Top 5 produtos mais frequentes</CardDescription>
				</CardHeader>
				<CardContent>
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
				</CardContent>
			</Card>
		)
	}

	// Widget de comparação de mercados
	if (widgetId === "market-compare") {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle>Estatísticas por Mercado</CardTitle>
					<CardDescription>Seus mercados mais frequentados</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{(stats?.marketComparison || [])
							.sort((a: MarketComparison, b: MarketComparison) => b.totalPurchases - a.totalPurchases)
							.map((market: MarketComparison, index: number) => {
								const totalSpent = market.averagePrice * market.totalPurchases
								return (
									<div
										key={market.marketId}
										className="border rounded-lg p-3 hover:bg-muted/50 dark:hover:bg-muted/10 transition-colors"
									>
										<div className="flex items-start justify-between gap-3">
											<div className="flex items-start gap-3 flex-1 min-w-0">
												<div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold flex-shrink-0">
													{index + 1}
												</div>
												<div className="flex-1 min-w-0">
													<div className="font-medium truncate">{market.marketName}</div>
													<div className="text-sm text-muted-foreground mt-1 space-y-1">
														<div className="flex items-center gap-4">
															<span>
																🛒 {market.totalPurchases} {market.totalPurchases === 1 ? "compra" : "compras"}
															</span>
															<span>💰 R$ {totalSpent.toFixed(2)} total</span>
														</div>
														<div className="text-xs opacity-75">Ticket médio: R$ {market.averagePrice.toFixed(2)}</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								)
							})}
					</div>
				</CardContent>
			</Card>
		)
	}

	// Widget de compras recentes
	if (widgetId === "recent-purchases") {
		return (
			<Card className="h-full">
				<CardHeader>
					<CardTitle>Compras Recentes</CardTitle>
					<CardDescription>Últimas 5 compras realizadas</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{(stats?.recentPurchases || []).slice(0, 5).map((purchase: RecentPurchase) => (
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
					</div>
				</CardContent>
			</Card>
		)
	}

	// Widget de alertas de validade
	if (widgetId === "expiration-alerts" && expirationData && onRefresh) {
		return <ExpirationAlerts data={expirationData} loading={isLoading} onRefresh={onRefresh} />
	}

	// Widget de alertas de reposição
	if (widgetId === "replenishment-alerts" && consumptionData?.replenishmentAlerts && onAddToShoppingList) {
		return (
			<ReplenishmentAlerts
				data={consumptionData}
				loading={isLoading}
				onAddToShoppingList={onAddToShoppingList}
			/>
		)
	}

	// Widget de economias
	if (widgetId === "savings-card") {
		return <SavingsCard savingsData={savingsData} loading={isLoading} />
	}

	// Widget de estatísticas de descontos
	if (widgetId === "discount-stats" && stats?.discountStats) {
		return <DiscountStatsCard discountStats={stats.discountStats} isLoading={isLoading} />
	}

	// Widget de comparação temporal
	if (widgetId === "temporal-comparison") {
		return <TemporalComparisonCard temporalData={temporalData} loading={isLoading} />
	}

	// Widget de resumo nutricional
	if (widgetId === "nutrition-summary") {
		return <NutritionSummaryCard />
	}

	// Widget de estatísticas de pagamento
	if (widgetId === "payment-stats") {
		return <PaymentMethodStats />
	}

	// Fallback para widgets desconhecidos
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle>Widget não encontrado</CardTitle>
				<CardDescription>O widget "{widgetId}" não está disponível</CardDescription>
			</CardHeader>
		</Card>
	)
}
