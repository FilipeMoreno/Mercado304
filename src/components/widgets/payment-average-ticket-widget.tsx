"use client"

import { TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface PaymentAverageTicketWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentAverageTicketWidget({
	dateFrom,
	dateTo,
}: PaymentAverageTicketWidgetProps) {
	const [loading, setLoading] = useState(true)
	const [averageTicket, setAverageTicket] = useState(0)

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
				setAverageTicket(result.summary.averageTransactionValue)
			}
		} catch (error) {
			console.error("Erro ao buscar ticket médio:", error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center gap-3">
					<div className="bg-purple-100 p-2 rounded-full">
						<TrendingUp className="h-6 w-6 text-purple-600" />
					</div>
					<div>
						<div className="text-2xl font-bold">
							R$ {averageTicket.toFixed(2)}
						</div>
						<div className="text-sm text-muted-foreground">Ticket Médio</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
