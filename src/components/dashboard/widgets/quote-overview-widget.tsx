"use client"

import { Calculator, FileText, ShoppingCart, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuoteStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"

export function QuoteOverviewWidget() {
	const { data, isLoading, error } = useQuoteStatsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-8 w-24" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (error || !data) return null

	const { overview, conversion } = data

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calculator className="h-5 w-5" />
					Visão Geral de Cotações
				</CardTitle>
				<CardDescription>Resumo das suas cotações de compras</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground flex items-center gap-1">
							<FileText className="h-3 w-3" />
							Total de Orçamentos
						</p>
						<p className="text-2xl font-bold">{overview.totalBudgets}</p>
					</div>

					<div className="space-y-1">
						<p className="text-sm text-muted-foreground flex items-center gap-1">
							<Calculator className="h-3 w-3" />
							Valor Total
						</p>
						<p className="text-2xl font-bold">{formatCurrency(overview.totalValue)}</p>
					</div>

					<div className="space-y-1">
						<p className="text-sm text-muted-foreground flex items-center gap-1">
							<TrendingDown className="h-3 w-3" />
							Total Economizado
						</p>
						<p className="text-2xl font-bold text-green-600">{formatCurrency(overview.totalSavings)}</p>
					</div>

					<div className="space-y-1">
						<p className="text-sm text-muted-foreground flex items-center gap-1">
							<ShoppingCart className="h-3 w-3" />
							Taxa de Conversão
						</p>
						<p className="text-2xl font-bold">{conversion.rate.toFixed(1)}%</p>
					</div>
				</div>

				<div className="mt-4 pt-4 border-t">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Valor Médio</span>
						<span className="font-medium">{formatCurrency(overview.averageValue)}</span>
					</div>
					<div className="flex justify-between text-sm mt-1">
						<span className="text-muted-foreground">Média de Itens</span>
						<span className="font-medium">{overview.averageItems.toFixed(1)}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
