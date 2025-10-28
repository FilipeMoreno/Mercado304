"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useBudgetsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import type { BudgetWithSpent } from "@/types"

export function BudgetProgressWidget() {
	const { data: budgets, isLoading, error } = useBudgetsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Progresso dos Orçamentos</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-48">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		)
	}

	if (error || !budgets) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Progresso dos Orçamentos</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center justify-center h-48">
					<p className="text-sm text-muted-foreground">Erro ao carregar orçamentos</p>
				</CardContent>
			</Card>
		)
	}

	// Sort by percentage (highest first) and take top 8
	const topBudgets = [...budgets]
		.sort((a, b) => b.percentage - a.percentage)
		.slice(0, 8)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Progresso dos Orçamentos</span>
					<Link href="/orcamentos">
						<Button variant="ghost" size="sm">
							Ver Todos
						</Button>
					</Link>
				</CardTitle>
			</CardHeader>
			<CardContent>
				{topBudgets.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-32 text-center">
						<p className="text-sm font-medium">Nenhum orçamento cadastrado</p>
						<p className="text-xs text-muted-foreground mb-4">
							Comece criando seu primeiro orçamento
						</p>
						<Link href="/orcamentos/novo">
							<Button size="sm">Criar Orçamento</Button>
						</Link>
					</div>
				) : (
					<div className="space-y-4">
						{topBudgets.map((budget: BudgetWithSpent) => (
							<Link href={`/orcamentos/${budget.id}`} key={budget.id}>
								<div className="space-y-2 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
									{/* Header */}
									<div className="flex items-center justify-between">
										<div className="flex-1">
											<p className="font-medium text-sm">{budget.name}</p>
											<p className="text-xs text-muted-foreground">
												{budget.target?.name}
											</p>
										</div>
										<div className="text-right ml-2">
											<p
												className={`text-sm font-bold ${
													budget.isOverBudget
														? "text-red-600"
														: budget.percentage >= budget.alertAt * 100
															? "text-yellow-600"
															: "text-green-600"
												}`}
											>
												{budget.percentage.toFixed(0)}%
											</p>
											<p className="text-xs text-muted-foreground">
												{formatCurrency(budget.spent)}
											</p>
										</div>
									</div>

									{/* Progress Bar */}
									<div className="relative h-2 bg-muted rounded-full overflow-hidden">
										<div
											className={`h-full transition-all ${
												budget.isOverBudget
													? "bg-red-500"
													: budget.percentage >= budget.alertAt * 100
														? "bg-yellow-500"
														: budget.percentage >= 70
															? "bg-yellow-400"
															: "bg-green-500"
											}`}
											style={{ width: `${Math.min(budget.percentage, 100)}%` }}
										/>
									</div>

									{/* Footer */}
									<div className="flex items-center justify-between text-xs text-muted-foreground">
										<span>Limite: {formatCurrency(budget.limitAmount)}</span>
										<span
											className={
												budget.isOverBudget
													? "text-red-600 font-medium"
													: "text-green-600 font-medium"
											}
										>
											{budget.isOverBudget ? "Ultrapassado" : `Resta ${formatCurrency(budget.remaining)}`}
										</span>
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
