"use client"

import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SpendingTrendsWidgetProps {
	data?: {
		thisWeek: number
		lastWeek: number
		thisMonth: number
		lastMonth: number
		trend: "up" | "down" | "stable"
		weeklyChange: number
		monthlyChange: number
	}
}

export function SpendingTrendsWidget({ data }: SpendingTrendsWidgetProps) {
	if (!data) return null

	const getTrendIcon = (trend: string) => {
		switch (trend) {
			case "up":
				return <TrendingUp className="h-4 w-4 text-red-500" />
			case "down":
				return <TrendingDown className="h-4 w-4 text-green-500" />
			default:
				return <Minus className="h-4 w-4 text-gray-500" />
		}
	}

	const getTrendColor = (change: number) => {
		if (change > 0) return "text-red-500"
		if (change < 0) return "text-green-500"
		return "text-gray-500"
	}

	return (
		<Card className="shadow-xs hover:shadow-lg transition-shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{getTrendIcon(data.trend)}
					Tendências de Gastos
				</CardTitle>
				<CardDescription>Comparação de gastos por período</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Semanal */}
					<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
						<div>
							<p className="text-sm font-medium">Esta Semana</p>
							<p className="text-2xl font-bold">R$ {data.thisWeek.toFixed(2)}</p>
						</div>
						<div className="text-right">
							<Badge variant={data.weeklyChange > 0 ? "destructive" : data.weeklyChange < 0 ? "default" : "secondary"}>
								<span className={getTrendColor(data.weeklyChange)}>
									{data.weeklyChange > 0 ? "+" : ""}{data.weeklyChange.toFixed(1)}%
								</span>
							</Badge>
							<p className="text-xs text-muted-foreground mt-1">vs. semana passada</p>
						</div>
					</div>

					{/* Mensal */}
					<div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
						<div>
							<p className="text-sm font-medium">Este Mês</p>
							<p className="text-2xl font-bold">R$ {data.thisMonth.toFixed(2)}</p>
						</div>
						<div className="text-right">
							<Badge variant={data.monthlyChange > 0 ? "destructive" : data.monthlyChange < 0 ? "default" : "secondary"}>
								<span className={getTrendColor(data.monthlyChange)}>
									{data.monthlyChange > 0 ? "+" : ""}{data.monthlyChange.toFixed(1)}%
								</span>
							</Badge>
							<p className="text-xs text-muted-foreground mt-1">vs. mês passado</p>
						</div>
					</div>

					{/* Insights */}
					<div className="pt-2 border-t">
						<p className="text-xs text-muted-foreground">
							{data.trend === "up" && "Seus gastos estão aumentando. Considere revisar o orçamento."}
							{data.trend === "down" && "Parabéns! Você está economizando mais este período."}
							{data.trend === "stable" && "Seus gastos estão estáveis."}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}