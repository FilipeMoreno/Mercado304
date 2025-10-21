"use client"

import { motion } from "framer-motion"
import { Calendar, Percent, Store, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DiscountStatsCardProps {
	discountStats?: {
		totalDiscounts: number
		purchasesWithDiscounts: number
		averageDiscount: number
		discountPercentage: number
		monthlyDiscounts: Array<{ month: string; totalDiscounts: number }>
		topDiscountMarkets: Array<{
			marketId: string
			marketName: string
			totalDiscounts: number
			purchasesWithDiscounts: number
		}>
	}
	isLoading?: boolean
}

export function DiscountStatsCard({ discountStats, isLoading }: DiscountStatsCardProps) {
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<Skeleton className="h-16 w-full" />
						<Skeleton className="h-16 w-full" />
					</div>
					<Skeleton className="h-20 w-full" />
				</CardContent>
			</Card>
		)
	}

	if (!discountStats) {
		return null
	}

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value)
	}

	const formatPercentage = (value: number) => {
		return `${value.toFixed(1)}%`
	}

	return (
		<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Percent className="size-5 text-green-600" />
						Estatísticas de Descontos
					</CardTitle>
					<CardDescription>Análise dos descontos obtidos nas suas compras</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Resumo Principal */}
					<div className="grid grid-cols-2 gap-4">
						<div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900/30">
							<div className="text-2xl font-bold text-green-600 dark:text-green-400">
								{formatCurrency(discountStats.totalDiscounts)}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">Total Economizado</div>
						</div>
						<div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
							<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
								{discountStats.purchasesWithDiscounts}
							</div>
							<div className="text-sm text-gray-600 dark:text-gray-400">Compras com Desconto</div>
						</div>
					</div>

					{/* Estatísticas Detalhadas */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
						<div className="flex items-center gap-2 flex-wrap">
							<TrendingDown className="size-4 text-gray-500 dark:text-gray-400" />
							<span className="text-gray-600 dark:text-gray-400">Média por desconto:</span>
							<span className="font-medium dark:text-gray-200">{formatCurrency(discountStats.averageDiscount)}</span>
						</div>
						<div className="flex items-center gap-2 flex-wrap">
							<Percent className="size-4 text-gray-500 dark:text-gray-400" />
							<span className="text-gray-600 dark:text-gray-400">com desconto:</span>
							<span className="font-medium dark:text-gray-200">
								{formatPercentage(discountStats.discountPercentage)}
							</span>
						</div>
					</div>

					{/* Top Mercados com Descontos */}
					{discountStats.topDiscountMarkets.length > 0 && (
						<div>
							<h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
								<Store className="size-4" />
								Mercados com Mais Descontos
							</h4>
							<div className="space-y-2">
								{discountStats.topDiscountMarkets.slice(0, 3).map((market) => (
									<div
										key={market.marketId}
										className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
									>
										<span className="text-gray-600 dark:text-gray-400">{market.marketName}</span>
										<div className="text-right">
											<div className="font-medium text-green-600 dark:text-green-400">
												{formatCurrency(market.totalDiscounts)}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-500">
												{market.purchasesWithDiscounts} compras
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Gráfico de Descontos Mensais */}
					{discountStats.monthlyDiscounts.length > 0 && (
						<div>
							<h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
								<Calendar className="size-4" />
								Descontos por Mês
							</h4>
							<div className="space-y-2">
								{discountStats.monthlyDiscounts.slice(-6).map((month) => (
									<div
										key={month.month}
										className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
									>
										<span className="text-gray-600 dark:text-gray-400">
											{new Date(`${month.month}-01`).toLocaleDateString("pt-BR", {
												month: "short",
												year: "numeric",
											})}
										</span>
										<span className="font-medium text-green-600 dark:text-green-400">
											{formatCurrency(month.totalDiscounts)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	)
}
