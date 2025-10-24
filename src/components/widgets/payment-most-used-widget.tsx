"use client"

import { PieChart } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface PaymentMostUsedWidgetProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentMostUsedWidget({
	dateFrom,
	dateTo,
}: PaymentMostUsedWidgetProps) {
	const [loading, setLoading] = useState(true)
	const [mostUsedMethod, setMostUsedMethod] = useState<{
		label: string
		percentage: number
	} | null>(null)

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
				if (result.summary.mostUsedMethod) {
					setMostUsedMethod({
						label: result.summary.mostUsedMethod.label,
						percentage: result.summary.mostUsedMethod.percentage,
					})
				}
			}
		} catch (error) {
			console.error("Erro ao buscar método mais usado:", error)
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
