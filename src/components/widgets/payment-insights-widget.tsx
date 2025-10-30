"use client"

import { TrendingUp, ArrowUpRight, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePaymentStatsQuery } from "@/hooks/use-react-query"

interface PaymentInsightsWidgetProps {
	dateFrom?: string
	dateTo?: string
}

interface PaymentMethodStat {
	label: string
	percentage: number
	totalAmount: number
}

export function PaymentInsightsWidget({
	dateFrom,
	dateTo,
}: PaymentInsightsWidgetProps) {
    const { data, isLoading } = usePaymentStatsQuery({ dateFrom, dateTo })
    const insights = {
        mostUsedMethod: (data?.summary?.mostUsedMethod as PaymentMethodStat) || null,
        highestValueMethod: (data?.summary?.highestValueMethod as PaymentMethodStat) || null,
    }

    if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Insights
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{[1, 2].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-6 w-40" />
								<Skeleton className="h-4 w-full" />
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!insights.mostUsedMethod && !insights.highestValueMethod) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Insights
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
					<TrendingUp className="h-5 w-5" />
					Insights
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{insights.mostUsedMethod && (
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<ArrowUpRight className="h-4 w-4 text-green-600" />
								<span className="font-medium">Método Mais Popular</span>
							</div>
							<p className="text-sm text-muted-foreground">
								<strong>{insights.mostUsedMethod.label}</strong> representa{" "}
								<strong>
									{insights.mostUsedMethod.percentage.toFixed(1)}%
								</strong>{" "}
								das transações
							</p>
						</div>
					)}

					{insights.highestValueMethod && (
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<DollarSign className="h-4 w-4 text-blue-600" />
								<span className="font-medium">Maior Volume Financeiro</span>
							</div>
							<p className="text-sm text-muted-foreground">
								<strong>{insights.highestValueMethod.label}</strong> movimentou{" "}
								<strong>
									R$ {insights.highestValueMethod.totalAmount.toFixed(2)}
								</strong>
							</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
