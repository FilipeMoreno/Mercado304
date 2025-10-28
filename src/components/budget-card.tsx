"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { BudgetWithSpent } from "@/types"
import { formatCurrency } from "@/lib/utils"
import { Calendar, Eye, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BudgetProgressBar } from "./budget-progress-bar"

interface BudgetCardProps {
	budget: BudgetWithSpent
	onView?: (id: string) => void
	onEdit?: (id: string) => void
	onDelete?: (id: string) => void
}

export function BudgetCard({ budget, onView, onEdit, onDelete }: BudgetCardProps) {
	const getTypeLabel = (type: string) => {
		switch (type) {
			case "CATEGORY":
				return "Categoria"
			case "MARKET":
				return "Mercado"
			case "PRODUCT":
				return "Produto"
			default:
				return type
		}
	}

	const getStatusColor = (percentage: number, isOverBudget: boolean) => {
		if (isOverBudget) return "destructive"
		if (percentage >= budget.alertAt * 100) return "warning"
		if (percentage >= 70) return "default"
		return "success"
	}

	const statusColor = getStatusColor(budget.percentage, budget.isOverBudget)

	return (
		<Card className="hover:shadow-md transition-shadow">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<CardTitle className="text-lg font-semibold">{budget.name}</CardTitle>
						{budget.description && (
							<p className="text-sm text-muted-foreground mt-1">{budget.description}</p>
						)}
					</div>
					<Badge variant={statusColor as any} className="ml-2">
						{getTypeLabel(budget.type)}
					</Badge>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Target Information */}
				{budget.target && (
					<div className="flex items-center gap-2 text-sm">
						<span className="font-medium">Alvo:</span>
						<span className="text-muted-foreground">{budget.target.name}</span>
					</div>
				)}

				{/* Period */}
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<Calendar className="h-4 w-4" />
					<span>
						{format(new Date(budget.startDate), "dd/MM/yyyy", { locale: ptBR })} -{" "}
						{format(new Date(budget.endDate), "dd/MM/yyyy", { locale: ptBR })}
					</span>
				</div>

				{/* Progress Bar */}
				<BudgetProgressBar budget={budget} />

				{/* Amounts */}
				<div className="grid grid-cols-2 gap-4 pt-2">
					<div>
						<p className="text-xs text-muted-foreground">Gasto</p>
						<p className="text-lg font-semibold">{formatCurrency(budget.spent)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Limite</p>
						<p className="text-lg font-semibold">{formatCurrency(budget.limitAmount)}</p>
					</div>
				</div>

				{/* Remaining Amount */}
				<div className={budget.isOverBudget ? "text-destructive" : "text-muted-foreground"}>
					<p className="text-xs">
						{budget.isOverBudget ? "Ultrapassado em" : "Disponível"}
					</p>
					<p className="text-md font-medium">
						{formatCurrency(Math.abs(budget.remaining))}
					</p>
				</div>

				{/* Actions */}
				<div className="flex gap-2 pt-2">
					{onView && (
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => onView(budget.id)}
						>
							<Eye className="h-4 w-4 mr-1" />
							Ver
						</Button>
					)}
					{onEdit && (
						<Button
							variant="outline"
							size="sm"
							className="flex-1"
							onClick={() => onEdit(budget.id)}
						>
							<Pencil className="h-4 w-4 mr-1" />
							Editar
						</Button>
					)}
					{onDelete && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => onDelete(budget.id)}
							className="text-destructive hover:bg-destructive/10"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
