"use client"

import { PieChart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { usePaymentStatsQuery } from "@/hooks/use-react-query"

interface PaymentMostUsedWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentMostUsedWidget({
	dateFrom,
	dateTo,
}: PaymentMostUsedWidgetProps) {
    const { data, isLoading } = usePaymentStatsQuery({ dateFrom, dateTo })
    const s = data?.summary?.mostUsedMethod as { label: string; percentage: number } | undefined
    const mostUsedMethod = s ? { label: s.label, percentage: s.percentage } : null

    if (isLoading) {
		return (
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10 rounded-full" />
						<div className="space-y-2">
							<Skeleton className="h-6 w-20" />
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
					<div className="bg-orange-100 p-2 rounded-full">
						<PieChart className="h-6 w-6 text-orange-600" />
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<div className="text-lg font-bold">
								{mostUsedMethod?.label || "N/A"}
							</div>
							{mostUsedMethod && (
								<Badge variant="secondary">
									{mostUsedMethod.percentage.toFixed(1)}%
								</Badge>
							)}
						</div>
						<div className="text-sm text-muted-foreground">Mais Usado</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
