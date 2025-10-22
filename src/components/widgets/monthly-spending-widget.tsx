"use client"

import { lazy, Suspense } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const MonthlySpendingChart = lazy(() =>
	import("@/components/monthly-spending-chart").then((module) => ({
		default: module.MonthlySpendingChart,
	})),
)

interface MonthlySpendingWidgetProps {
	data?: Array<{ month: string; amount: number; purchases: number }>
	loading?: boolean
}

export function MonthlySpendingWidget({ data, loading }: MonthlySpendingWidgetProps) {
	if (!data || data.length === 0) return null

	return (
		<Suspense
			fallback={
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-48 mb-2" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent>
						<Skeleton className="h-64 w-full" />
					</CardContent>
				</Card>
			}
		>
			<MonthlySpendingChart data={data} loading={loading} />
		</Suspense>
	)
}