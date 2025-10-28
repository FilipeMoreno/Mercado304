"use client"

import { Progress } from "@/components/ui/progress"
import type { BudgetWithSpent } from "@/types"
import { cn } from "@/lib/utils"

interface BudgetProgressBarProps {
	budget: BudgetWithSpent
	showLabel?: boolean
	className?: string
}

export function BudgetProgressBar({ budget, showLabel = true, className }: BudgetProgressBarProps) {
	const getProgressColor = (percentage: number, isOverBudget: boolean) => {
		if (isOverBudget) return "bg-red-500"
		if (percentage >= budget.alertAt * 100) return "bg-orange-500"
		if (percentage >= 70) return "bg-yellow-500"
		return "bg-green-500"
	}

	const getProgressStatus = (percentage: number, isOverBudget: boolean) => {
		if (isOverBudget) return "Ultrapassado"
		if (percentage >= budget.alertAt * 100) return "Atenção"
		if (percentage >= 70) return "Alerta"
		return "Saudável"
	}

	const percentage = Math.min(budget.percentage, 100)
	const progressColor = getProgressColor(budget.percentage, budget.isOverBudget)
	const status = getProgressStatus(budget.percentage, budget.isOverBudget)

	return (
		<div className={cn("space-y-2", className)}>
			<div className="flex justify-between items-center text-sm">
				{showLabel && (
					<>
						<span className="font-medium">{status}</span>
						<span className={cn("font-semibold", budget.isOverBudget && "text-destructive")}>
							{budget.percentage.toFixed(1)}%
						</span>
					</>
				)}
			</div>
			<div className="relative">
				<Progress value={percentage} className="h-3" />
				<div
					className={cn("absolute top-0 left-0 h-3 rounded-full transition-all", progressColor)}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	)
}
