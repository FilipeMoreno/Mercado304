"use client"

import { Wallet } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePaymentStatsQuery } from "@/hooks/use-react-query"

interface PaymentTransactionsWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentTransactionsWidget({
	dateFrom,
	dateTo,
}: PaymentTransactionsWidgetProps) {
    const { data, isLoading } = usePaymentStatsQuery({ dateFrom, dateTo })
    const totalTransactions = data?.summary?.totalTransactions ?? 0

    if (isLoading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-8 w-16" />
							<Skeleton className="h-4 w-32" />
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
					<div className="bg-blue-100 p-2 rounded-full">
						<Wallet className="h-6 w-6 text-blue-600" />
					</div>
					<div>
						<div className="text-2xl font-bold">{totalTransactions}</div>
						<div className="text-sm text-muted-foreground">
							Total de Transações
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
