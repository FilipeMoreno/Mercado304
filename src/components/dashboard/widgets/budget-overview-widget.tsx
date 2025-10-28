"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useBudgetStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle, CheckCircle, DollarSign, Loader2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function BudgetOverviewWidget() {
	const { data: stats, isLoading, error } = useBudgetStatsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Visão Geral de Orçamentos</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-48">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		)
	}

	if (error || !stats?.overview) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Visão Geral de Orçamentos</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-48">
					<p className="text-sm text-muted-foreground">Erro ao carregar dados</p>
				</CardContent>
			</Card>
		)
	}

	const { overview, status } = stats

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Visão Geral de Orçamentos</span>
					<Link href="/orcamentos">
						<Button variant="ghost" size="sm">
							Ver Todos
						</Button>
					</Link>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Main Stats */}
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">Total Gasto</p>
						<p className="text-2xl font-bold">{formatCurrency(overview.totalSpent)}</p>
						<p className="text-xs text-muted-foreground">
							de {formatCurrency(overview.totalLimit)} limite
						</p>
					</div>
					<div className="space-y-2">
						<p className="text-sm font-medium text-muted-foreground">Disponível</p>
						<p className="text-2xl font-bold text-green-600">
							{formatCurrency(overview.totalRemaining)}
						</p>
						<p className="text-xs text-muted-foreground">
							{overview.percentageUsed.toFixed(1)}% utilizado
						</p>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Progresso Geral</span>
						<span className="font-medium">{overview.percentageUsed.toFixed(1)}%</span>
					</div>
					<div className="h-2 bg-muted rounded-full overflow-hidden">
						<div
							className={`h-full transition-all ${
								overview.percentageUsed > 90
									? "bg-red-500"
									: overview.percentageUsed > 70
										? "bg-yellow-500"
										: "bg-green-500"
							}`}
							style={{ width: `${Math.min(overview.percentageUsed, 100)}%` }}
						/>
					</div>
				</div>

				{/* Status Cards */}
				<div className="grid grid-cols-3 gap-2">
					<div className="flex flex-col items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
						<CheckCircle className="h-5 w-5 text-green-600 mb-1" />
						<p className="text-2xl font-bold">{status.healthy}</p>
						<p className="text-xs text-muted-foreground text-center">Saudáveis</p>
					</div>
					<div className="flex flex-col items-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
						<TrendingUp className="h-5 w-5 text-yellow-600 mb-1" />
						<p className="text-2xl font-bold">{status.nearLimit}</p>
						<p className="text-xs text-muted-foreground text-center">Próximos</p>
					</div>
					<div className="flex flex-col items-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
						<AlertCircle className="h-5 w-5 text-red-600 mb-1" />
						<p className="text-2xl font-bold">{status.overBudget}</p>
						<p className="text-xs text-muted-foreground text-center">Ultrapassados</p>
					</div>
				</div>

				{/* Active Budgets */}
				<div className="pt-2 border-t">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<DollarSign className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Orçamentos Ativos</span>
						</div>
						<span className="text-2xl font-bold">{overview.totalBudgets}</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
