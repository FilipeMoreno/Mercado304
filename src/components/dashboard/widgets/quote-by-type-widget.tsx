"use client"

import { Grid3X3, ListChecks, Store } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuoteStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"

const COLORS = {
	BY_ITEMS: "#3b82f6", // blue-600
	BY_CATEGORY: "#a855f7", // purple-600
	BY_MARKET: "#22c55e", // green-600
}

const TYPE_LABELS = {
	BY_ITEMS: "Por Itens",
	BY_CATEGORY: "Por Categoria",
	BY_MARKET: "Por Mercado",
}

const TYPE_ICONS = {
	BY_ITEMS: ListChecks,
	BY_CATEGORY: Grid3X3,
	BY_MARKET: Store,
}

export function QuoteByTypeWidget() {
	const { data: stats, isLoading } = useQuoteStatsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Cotações por Tipo</CardTitle>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		)
	}

	if (!stats?.byType) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Cotações por Tipo</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center text-sm text-muted-foreground py-8">Nenhum dado disponível</div>
				</CardContent>
			</Card>
		)
	}

	const chartData = Object.entries(stats.byType).map(([type, data]: [string, any]) => ({
		name: TYPE_LABELS[type as keyof typeof TYPE_LABELS] || type,
		value: data.count,
		totalValue: data.totalValue,
		totalSavings: data.totalSavings,
		type: type,
	}))

	const totalBudgets = chartData.reduce((sum, item) => sum + item.value, 0)

	return (
		<Card>
			<CardHeader>
				<CardTitle>Orçamentos por Tipo</CardTitle>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="text-center text-sm text-muted-foreground py-8">Nenhum orçamento encontrado</div>
				) : (
					<div className="space-y-4">
						<ResponsiveContainer width="100%" height={200}>
							<PieChart>
								<Pie
									data={chartData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{chartData.map((entry) => (
										<Cell key={`cell-${entry.type}`} fill={COLORS[entry.type as keyof typeof COLORS]} />
									))}
								</Pie>
								<Tooltip
									content={({ active, payload }) => {
										if (active && payload && payload.length) {
											const data = payload[0].payload
											return (
												<div className="rounded-lg border bg-background p-3 shadow-sm">
													<div className="font-medium">{data.name}</div>
													<div className="text-sm text-muted-foreground mt-1">
														<div>Quantidade: {data.value}</div>
														<div>Valor: {formatCurrency(data.totalValue)}</div>
														<div>Economia: {formatCurrency(data.totalSavings)}</div>
													</div>
												</div>
											)
										}
										return null
									}}
								/>
							</PieChart>
						</ResponsiveContainer>

						<div className="space-y-2">
							{chartData.map((item) => {
								const Icon = TYPE_ICONS[item.type as keyof typeof TYPE_ICONS]
								const percentage = ((item.value / totalBudgets) * 100).toFixed(1)

								return (
									<div key={item.type} className="flex items-center justify-between p-3 rounded-lg border">
										<div className="flex items-center gap-3">
											<div
												className="w-3 h-3 rounded-full"
												style={{
													backgroundColor: COLORS[item.type as keyof typeof COLORS],
												}}
											/>
											<Icon
												className="h-4 w-4"
												style={{
													color: COLORS[item.type as keyof typeof COLORS],
												}}
											/>
											<div>
												<div className="font-medium text-sm">{item.name}</div>
												<div className="text-xs text-muted-foreground">
													{item.value} orçamento{item.value !== 1 ? "s" : ""} ({percentage}%)
												</div>
											</div>
										</div>
										<div className="text-right">
											<div className="font-medium text-sm">{formatCurrency(item.totalValue)}</div>
											{item.totalSavings > 0 && (
												<div className="text-xs text-green-600">-{formatCurrency(item.totalSavings)}</div>
											)}
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
