"use client"

import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import { DashboardStatsCardMemo } from "@/components/memoized"

interface TemporalComparisonWidgetProps {
	temporalData?: {
		currentMonth: { spent: number; purchases: number }
		lastMonth: { spent: number; purchases: number }
		changes: { spent: number; purchases: number }
	}
}

export function TemporalComparisonWidget({ temporalData }: TemporalComparisonWidgetProps) {
	if (!temporalData) return null

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5 }}
			className="md:col-span-2"
		>
			<DashboardStatsCardMemo
				title="Comparação Mensal"
				description="Comparação entre este mês e o anterior"
				icon={<TrendingUp className="size-5" />}
			>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="text-center p-4 border border-border bg-card rounded-sm shadow-xs">
						<div className="text-2xl font-bold text-blue-600">R$ {temporalData.currentMonth.spent.toFixed(2)}</div>
						<div className="text-sm text-muted-foreground">Este Mês</div>
						<div className="text-xs text-muted-foreground mt-1">{temporalData.currentMonth.purchases} compras</div>
					</div>

					<div className="text-center p-4 border border-border bg-card rounded-sm shadow-xs">
						<div className="text-2xl font-bold text-foreground">R$ {temporalData.lastMonth.spent.toFixed(2)}</div>
						<div className="text-sm text-muted-foreground">Mês Passado</div>
						<div className="text-xs text-muted-foreground mt-1">{temporalData.lastMonth.purchases} compras</div>
					</div>

					<div className="text-center p-4 border border-border bg-card rounded-sm shadow-xs">
						{temporalData.lastMonth.purchases === 0 ? (
							<>
								<div className="text-2xl font-bold text-blue-600">Novo</div>
								<div className="text-sm text-muted-foreground">Primeiro mês</div>
								<div className="text-xs text-muted-foreground mt-1">sem comparação</div>
							</>
						) : (
							<>
								<div
									className={`text-2xl font-bold ${
										temporalData.changes.spent > 0
											? "text-red-600"
											: temporalData.changes.spent < 0
												? "text-green-600"
												: "text-muted-foreground"
									}`}
								>
									{temporalData.changes.spent > 0 ? "+" : ""}
									{temporalData.changes.spent.toFixed(1)}%
								</div>
								<div className="text-sm text-muted-foreground">
									{temporalData.changes.spent > 0
										? "Aumento"
										: temporalData.changes.spent < 0
											? "Economia"
											: "Estável"}
								</div>
								<div className="text-xs text-muted-foreground mt-1">vs. mês anterior</div>
							</>
						)}
					</div>
				</div>
			</DashboardStatsCardMemo>
		</motion.div>
	)
}