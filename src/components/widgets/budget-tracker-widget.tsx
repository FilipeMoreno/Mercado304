"use client"

import { DollarSign, Target, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface BudgetTrackerWidgetProps {
	budget?: {
		monthly: number
		spent: number
		remaining: number
		percentage: number
		daysLeft: number
		dailyAverage: number
		projectedSpending: number
	}
}

export function BudgetTrackerWidget({ budget }: BudgetTrackerWidgetProps) {
	if (!budget) return null

	const isOverBudget = budget.percentage > 100
	const isWarning = budget.percentage > 80 && budget.percentage <= 100
	const isOnTrack = budget.percentage <= 80

	const getStatusColor = () => {
		if (isOverBudget) return "text-red-600"
		if (isWarning) return "text-amber-600"
		return "text-green-600"
	}

	const getStatusText = () => {
		if (isOverBudget) return "Orçamento Excedido"
		if (isWarning) return "Atenção ao Orçamento"
		return "No Orçamento"
	}

	const getBadgeVariant = () => {
		if (isOverBudget) return "destructive"
		if (isWarning) return "secondary"
		return "default"
	}

	return (
		<Card className="shadow-xs hover:shadow-lg transition-shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-4 w-4 text-blue-500" />
					Controle de Orçamento
				</CardTitle>
				<CardDescription>Acompanhe seus gastos mensais</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Status do orçamento */}
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Status</p>
							<p className={`font-semibold ${getStatusColor()}`}>{getStatusText()}</p>
						</div>
						<Badge variant={getBadgeVariant()}>
							{budget.percentage.toFixed(1)}%
						</Badge>
					</div>

					{/* Progresso visual */}
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Gasto</span>
							<span>R$ {budget.spent.toFixed(2)} / R$ {budget.monthly.toFixed(2)}</span>
						</div>
						<Progress 
							value={Math.min(budget.percentage, 100)} 
							className="h-2"
						/>
						{isOverBudget && (
							<p className="text-xs text-red-600 flex items-center gap-1">
								<AlertCircle className="h-3 w-3" />
								Excedido em R$ {(budget.spent - budget.monthly).toFixed(2)}
							</p>
						)}
					</div>

					{/* Métricas */}
					<div className="grid grid-cols-2 gap-4 pt-2 border-t">
						<div className="text-center">
							<p className="text-lg font-bold text-green-600">R$ {budget.remaining.toFixed(2)}</p>
							<p className="text-xs text-muted-foreground">Restante</p>
						</div>
						<div className="text-center">
							<p className="text-lg font-bold">{budget.daysLeft}</p>
							<p className="text-xs text-muted-foreground">Dias restantes</p>
						</div>
					</div>

					{/* Projeção */}
					<div className="bg-muted/50 rounded-lg p-3">
						<div className="flex items-center gap-2 mb-1">
							<DollarSign className="h-3 w-3 text-muted-foreground" />
							<span className="text-xs font-medium">Projeção do Mês</span>
						</div>
						<p className="text-sm">
							<span className="font-bold">R$ {budget.projectedSpending.toFixed(2)}</span>
							<span className="text-muted-foreground text-xs ml-1">
								(média R$ {budget.dailyAverage.toFixed(2)}/dia)
							</span>
						</p>
						{budget.projectedSpending > budget.monthly && (
							<p className="text-xs text-red-600 mt-1">
								⚠️ Projeção excede o orçamento em R$ {(budget.projectedSpending - budget.monthly).toFixed(2)}
							</p>
						)}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}