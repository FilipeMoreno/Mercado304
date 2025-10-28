"use client"

import { Store, } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuoteStatsQuery } from "@/hooks/use-react-query"
import { formatCurrency } from "@/lib/utils"

const COLORS = [
	"hsl(var(--chart-1))",
	"hsl(var(--chart-2))",
	"hsl(var(--chart-3))",
	"hsl(var(--chart-4))",
	"hsl(var(--chart-5))",
]

export function QuoteByMarketWidget() {
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

	if (error || !data || !data.byMarket || data.byMarket.length === 0) return null

	const chartData = data.byMarket.map((item) => ({
		name: item.marketName,
		value: item.count,
		totalValue: item.totalValue,
	}))

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Store className="h-5 w-5" />
					Cotações por Mercado
				</CardTitle>
				<CardDescription>Distribuição de cotações entre mercados</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					<PieChart>
						<Pie
							data={chartData}
							cx="50%"
							cy="50%"
							labelLine={false}
							label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
							outerRadius={80}
							fill="#8884d8"
							dataKey="value"
						>
							{chartData.map((_entry, index) => (
								<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
							))}
						</Pie>
						<Tooltip
							contentStyle={{
								backgroundColor: "hsl(var(--background))",
								border: "1px solid hsl(var(--border))",
								borderRadius: "var(--radius)",
							}}
							formatter={(value: any, _name: string, props: any) => [
								`${value} orçamento(s) - ${formatCurrency(props.payload.totalValue)}`,
								props.payload.name,
							]}
						/>
					</PieChart>
				</ResponsiveContainer>

				<div className="mt-4 space-y-2">
					{data.byMarket.slice(0, 5).map((market, index) => (
						<div key={market.marketId} className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-2">
								<div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
								<span className="font-medium">{market.marketName}</span>
							</div>
							<div className="text-right">
								<div className="font-semibold">{market.count} orçamento(s)</div>
								<div className="text-xs text-muted-foreground">{formatCurrency(market.totalValue)}</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
