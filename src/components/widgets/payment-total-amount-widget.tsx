"use client"

import { DollarSign } from "lucide-react"
import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { usePaymentStatsQuery } from "@/hooks/use-react-query"

interface PaymentTotalAmountWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentTotalAmountWidget({
	dateFrom,
	dateTo,
}: PaymentTotalAmountWidgetProps) {
    const { data, isLoading } = usePaymentStatsQuery({ dateFrom, dateTo })
    const totalAmount = useMemo(() => data?.summary?.totalAmount ?? 0, [data])

    if (isLoading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-8 w-24" />
							<Skeleton className="h-4 w-20" />
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
					<div className="bg-green-100 p-2 rounded-full">
						<DollarSign className="h-6 w-6 text-green-600" />
					</div>
					<div>
						<div className="text-2xl font-bold">
							R$ {totalAmount.toFixed(2)}
						</div>
						<div className="text-sm text-muted-foreground">Valor Total</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
