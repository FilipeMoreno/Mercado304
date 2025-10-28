"use client"

import { DollarSign, Percent, Target, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuoteStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"

export function QuoteSavingsWidget() {
	const { data, isLoading, error } = useQuoteStatsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error || !data) return null

	const { overview, conversion } = data

	const savingsPercentage =
		overview.totalValue > 0 ? (overview.totalSavings / (overview.totalValue + overview.totalSavings)) * 100 : 0

	const averageSavingsPerBudget = overview.totalBudgets > 0 ? overview.totalSavings / overview.totalBudgets : 0

	const convertedSavingsPercentage =
		conversion.convertedValue > 0
			? (conversion.convertedSavings / (conversion.convertedValue + conversion.convertedSavings)) * 100
			: 0

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingDown className="h-5 w-5 text-green-600" />
					Economia em Cotações
				</CardTitle>
				<CardDescription>Análise de descontos e economia potencial</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Total Savings */}
				<div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground flex items-center gap-1">
								<DollarSign className="h-3 w-3" />
								Total Economizado
							</p>
							<p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(overview.totalSavings)}</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-muted-foreground">Percentual</p>
							<p className="text-2xl font-bold text-green-600">{savingsPercentage.toFixed(1)}%</p>
						</div>
					</div>
				</div>

				{/* Statistics Grid */}
				<div className="grid grid-cols-2 gap-4">
					<div className="p-3 rounded-lg border">
						<p className="text-sm text-muted-foreground flex items-center gap-1">
							<Target className="h-3 w-3" />
							Média por Orçamento
						</p>
						<p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(averageSavingsPerBudget)}</p>
					</div>

					<div className="p-3 rounded-lg border">
						<p className="text-sm text-muted-foreground flex items-center gap-1">
							<Percent className="h-3 w-3" />
							Convertidos
						</p>
						<p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(conversion.convertedSavings)}</p>
					</div>
				</div>

				{/* Converted Budgets Info */}
				<div className="pt-4 border-t">
					<div className="flex justify-between items-center mb-2">
						<span className="text-sm font-medium">Orçamentos Convertidos</span>
						<span className="text-sm text-muted-foreground">
							{conversion.converted} de {conversion.total}
						</span>
					</div>
					<div className="w-full bg-secondary rounded-full h-2">
						<div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${conversion.rate}%` }} />
					</div>
					<div className="mt-2 grid grid-cols-2 gap-2 text-xs">
						<div>
							<span className="text-muted-foreground">Valor convertido:</span>
							<span className="font-medium ml-1">{formatCurrency(conversion.convertedValue)}</span>
						</div>
						<div className="text-right">
							<span className="text-muted-foreground">Economia real:</span>
							<span className="font-medium text-green-600 ml-1">{convertedSavingsPercentage.toFixed(1)}%</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
