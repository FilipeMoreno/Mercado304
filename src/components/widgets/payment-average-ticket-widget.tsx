"use client"

import { TrendingUp } from "lucide-react"
import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePaymentStatsQuery } from "@/hooks/use-react-query"

interface PaymentAverageTicketWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentAverageTicketWidget({
	dateFrom,
	dateTo,
}: PaymentAverageTicketWidgetProps) {
    const { data, isLoading } = usePaymentStatsQuery({ dateFrom, dateTo })
    const averageTicket = useMemo(() => data?.summary?.averageTransactionValue ?? 0, [data])

    if (isLoading) {
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
