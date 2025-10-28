"use client"

import { Calendar, TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuoteStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"

export function QuoteTrendWidget() {
	const { data, isLoading, error } = useQuoteStatsQuery()

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<Skeleton className="h-5 w-48" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-[300px] w-full" />
				</CardContent>
			</Card>
		)
	}

	if (error || !data || !data.monthlyTrend) return null

	const chartData = data.monthlyTrend.map((item) => ({
		month: new Date(`${item.month}-01`).toLocaleDateString("pt-BR", {
			month: "short",
			year: "2-digit",
		}),
		Cotações: item.count,
		"Valor Total": item.totalValue,
		Economia: item.totalSavings,
	}))

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<TrendingUp className="h-5 w-5" />
					Tendência de Cotações
				</CardTitle>
				<CardDescription>Evolução das cotações nos últimos 6 meses</CardDescription>
			</CardHeader>
			<CardContent>
				{chartData.length === 0 ? (
					<div className="flex h-[300px] items-center justify-center text-muted-foreground">
						<div className="text-center space-y-2">
							<Calendar className="h-12 w-12 mx-auto opacity-50" />
							<p>Nenhum dado disponível</p>
						</div>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={300}>
						<BarChart data={chartData}>
							<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
							<XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
							<YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--background))",
									border: "1px solid hsl(var(--border))",
									borderRadius: "var(--radius)",
								}}
								formatter={(value: any, name: string) => {
									if (name === "Cotações") return [value, name]
									return [formatCurrency(Number(value)), name]
								}}
							/>
							<Legend />
							<Bar dataKey="Cotações" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				)}

				<div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-center">
					<div>
						<p className="text-sm text-muted-foreground">Período</p>
						<p className="text-lg font-bold">6 meses</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Total</p>
						<p className="text-lg font-bold">{data.monthlyTrend.reduce((sum, item) => sum + item.count, 0)}</p>
					</div>
					<div>
						<p className="text-sm text-muted-foreground">Economia</p>
						<p className="text-lg font-bold text-green-600">
							{formatCurrency(data.monthlyTrend.reduce((sum, item) => sum + item.totalSavings, 0))}
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
