"use client"

import { CreditCard } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

interface PaymentMethodStat {
	paymentMethod: string
	label: string
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
}

interface PaymentDetailsWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentDetailsWidget({
	dateFrom,
	dateTo,
}: PaymentDetailsWidgetProps) {
	const [loading, setLoading] = useState(true)
	const [paymentStats, setPaymentStats] = useState<PaymentMethodStat[]>([])

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
				setPaymentStats(result.paymentStats || [])
			}
		} catch (error) {
			console.error("Erro ao buscar detalhes de pagamento:", error)
		} finally {
			setLoading(false)
		}
	}

	const colors = [
		"bg-blue-500",
		"bg-green-500",
		"bg-yellow-500",
		"bg-purple-500",
		"bg-pink-500",
		"bg-indigo-500",
		"bg-red-500",
	]

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Estatísticas Detalhadas
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="space-y-2">
								<Skeleton className="h-6 w-full" />
								<Skeleton className="h-12 w-full" />
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
						<CreditCard className="h-5 w-5" />
						Estatísticas Detalhadas
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
					<CreditCard className="h-5 w-5" />
					Estatísticas Detalhadas
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{paymentStats.map((stat, index) => (
						<div key={stat.paymentMethod} className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div
										className={`w-3 h-3 rounded ${colors[index % colors.length]}`}
									/>
									<span className="font-medium">{stat.label}</span>
								</div>
								<Badge variant="secondary">{stat.count} transações</Badge>
							</div>

							<div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground ml-5">
								<div>
									<div className="font-medium">Total</div>
									<div>R$ {stat.totalAmount.toFixed(2)}</div>
								</div>
								<div>
									<div className="font-medium">Média</div>
									<div>R$ {stat.averageAmount.toFixed(2)}</div>
								</div>
							</div>

							{index < paymentStats.length - 1 && <Separator className="mt-3" />}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
