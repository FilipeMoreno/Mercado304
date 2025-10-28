"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useBudgetStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"
import { AlertCircle, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import type { BudgetWithSpent } from "@/types"

export function BudgetAlertsWidget() {
	const { data: stats, isLoading, error } = useBudgetStatsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Alertas de Orçamento</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-48">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		)
	}

	if (error || !stats?.alerts) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Alertas de Orçamento</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-48">
					<p className="text-sm text-muted-foreground">Erro ao carregar alertas</p>
				</CardContent>
			</Card>
		)
	}

	const alerts = stats.alerts.slice(0, 5) // Show top 5 alerts

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Alertas de Orçamento</span>
					<Link href="/orcamentos">
						<Button variant="ghost" size="sm">
							Ver Todos
						</Button>
					</Link>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{alerts.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-32 text-center">
						<AlertCircle className="h-12 w-12 text-green-600 mb-2" />
						<p className="text-sm font-medium">Tudo sob controle!</p>
						<p className="text-xs text-muted-foreground">Nenhum orçamento em alerta</p>
					</div>
				) : (
					<div className="space-y-4">
						{alerts.map((budget: BudgetWithSpent) => (
							<Link href={`/orcamentos/${budget.id}`} key={budget.id}>
								<div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
									{/* Icon */}
									<div className="mt-0.5">
										{budget.isOverBudget ? (
											<AlertCircle className="h-5 w-5 text-red-600" />
										) : (
											<AlertTriangle className="h-5 w-5 text-yellow-600" />
										)}
									</div>

									{/* Content */}
									<div className="flex-1 space-y-1">
										<div className="flex items-center justify-between">
											<p className="font-medium">{budget.name}</p>
											<Badge
												variant={budget.isOverBudget ? "destructive" : "default"}
												className="ml-2"
											>
												{budget.percentage.toFixed(0)}%
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground">
											{budget.target?.name} •{" "}
											{budget.type === "CATEGORY"
												? "Categoria"
												: budget.type === "MARKET"
													? "Mercado"
													: "Produto"}
										</p>
										<div className="flex items-center justify-between text-sm">
											<span className="text-muted-foreground">
												{formatCurrency(budget.spent)} de {formatCurrency(budget.limitAmount)}
											</span>
											{budget.isOverBudget ? (
												<span className="text-red-600 font-medium">
													+{formatCurrency(Math.abs(budget.remaining))}
												</span>
											) : (
												<span className="text-yellow-600 font-medium">
													Resta {formatCurrency(budget.remaining)}
												</span>
											)}
										</div>
										{/* Progress Bar */}
										<div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
											<div
												className={`h-full transition-all ${
													budget.isOverBudget ? "bg-red-500" : "bg-yellow-500"
												}`}
												style={{ width: `${Math.min(budget.percentage, 100)}%` }}
											/>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
