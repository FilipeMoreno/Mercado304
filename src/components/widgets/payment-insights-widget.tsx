"use client"

import { TrendingUp, ArrowUpRight, DollarSign } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
	const [loading, setLoading] = useState(true)
	const [insights, setInsights] = useState<{
		mostUsedMethod: PaymentMethodStat | null
		highestValueMethod: PaymentMethodStat | null
	}>({
		mostUsedMethod: null,
		highestValueMethod: null,
	})

	useEffect(() => {
		fetchData()
	}, [dateFrom, dateTo])

	const fetchData = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (dateFrom) params.append("dateFrom", dateFrom)
			if (dateTo) params.append("dateTo", dateTo)

			const response = await fetch(`/api/dashboard/payment-stats?${params}`)
			if (response.ok) {
				const result = await response.json()
				setInsights({
					mostUsedMethod: result.summary.mostUsedMethod || null,
					highestValueMethod: result.summary.highestValueMethod || null,
				})
			}
		} catch (error) {
			console.error("Erro ao buscar insights de pagamento:", error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
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
