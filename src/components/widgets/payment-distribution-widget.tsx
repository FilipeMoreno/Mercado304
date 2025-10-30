"use client"

import { PieChart } from "lucide-react"
import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePaymentStatsQuery } from "@/hooks/use-react-query"

interface PaymentMethodStat {
	paymentMethod: string
	label: string
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
}

interface PaymentDistributionWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentDistributionWidget({
	dateFrom,
	dateTo,
}: PaymentDistributionWidgetProps) {
    const { data, isLoading } = usePaymentStatsQuery({ dateFrom, dateTo })
    const paymentStats = useMemo(() => (data?.paymentStats as PaymentMethodStat[]) || [], [data])

	const colors = [
		"bg-blue-500",
		"bg-green-500",
		"bg-yellow-500",
		"bg-purple-500",
		"bg-pink-500",
		"bg-indigo-500",
		"bg-red-500",
	]

    if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PieChart className="h-5 w-5" />
						Distribuição por Método
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-2 w-full" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (paymentStats.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<PieChart className="h-5 w-5" />
						Distribuição por Método
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-center py-8">
						Nenhum dado disponível
					</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<PieChart className="h-5 w-5" />
					Distribuição por Método
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{paymentStats.map((stat, index) => (
						<div key={stat.paymentMethod} className="flex items-center gap-3">
							<div
								className={`w-4 h-4 rounded ${colors[index % colors.length]}`}
							/>
							<div className="flex-1">
								<div className="flex justify-between items-center">
									<span className="text-sm font-medium">{stat.label}</span>
									<span className="text-sm text-muted-foreground">
										{stat.percentage.toFixed(1)}%
									</span>
								</div>
								<div className="w-full bg-secondary rounded-full h-2 mt-1">
									<div
										className={`h-2 rounded-full ${colors[index % colors.length]}`}
										style={{ width: `${stat.percentage}%` }}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
