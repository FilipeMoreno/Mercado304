"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react"
import type { BudgetWithSpent } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface BudgetAlertProps {
	budget: BudgetWithSpent
	className?: string
}

export function BudgetAlert({ budget, className }: BudgetAlertProps) {
	const getAlertConfig = () => {
		if (budget.isOverBudget) {
			return {
				variant: "destructive" as const,
				icon: AlertCircle,
				title: "Orçamento Ultrapassado!",
				description: `Você gastou ${formatCurrency(budget.spent)} de ${formatCurrency(budget.limitAmount)}. Ultrapassou em ${formatCurrency(Math.abs(budget.remaining))}.`,
			}
		}

		if (budget.percentage >= budget.alertAt * 100) {
			return {
				variant: "default" as const,
				icon: AlertTriangle,
				title: "Atenção: Limite Próximo!",
				description: `Você já gastou ${budget.percentage.toFixed(1)}% do orçamento (${formatCurrency(budget.spent)} de ${formatCurrency(budget.limitAmount)}). Restam ${formatCurrency(budget.remaining)}.`,
			}
		}

		if (budget.percentage >= 70) {
			return {
				variant: "default" as const,
				icon: Info,
				title: "Alerta: Consumo Elevado",
				description: `Você já utilizou ${budget.percentage.toFixed(1)}% do orçamento. Restam ${formatCurrency(budget.remaining)} disponíveis.`,
			}
		}

		return {
			variant: "default" as const,
			icon: CheckCircle,
			title: "Orçamento Saudável",
			description: `Você gastou apenas ${budget.percentage.toFixed(1)}% do orçamento. Restam ${formatCurrency(budget.remaining)} disponíveis.`,
		}
	}

	const config = getAlertConfig()
	const Icon = config.icon

	return (
		<Alert variant={config.variant} className={cn(className)}>
			<Icon className="h-4 w-4" />
			<AlertTitle>{config.title}</AlertTitle>
			<AlertDescription>{config.description}</AlertDescription>
		</Alert>
	)
}
