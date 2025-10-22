"use client"

import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface PriceAlert {
	id: string
	productId: string
	productName: string
	currentPrice: number
	previousPrice: number
	change: number
	marketName: string
	alertType: "increase" | "decrease"
	date: string
}

interface PriceAlertsWidgetProps {
	alerts?: PriceAlert[]
}

export function PriceAlertsWidget({ alerts }: PriceAlertsWidgetProps) {
	if (!alerts || alerts.length === 0) return null

	const priceIncreases = alerts.filter(alert => alert.alertType === "increase")
	const priceDecreases = alerts.filter(alert => alert.alertType === "decrease")

	return (
		<Card className="shadow-xs hover:shadow-lg transition-shadow-sm">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<AlertTriangle className="h-4 w-4 text-amber-500" />
					Alertas de Preços
				</CardTitle>
				<CardDescription>Variações significativas de preços</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Aumentos de preço */}
					{priceIncreases.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<TrendingUp className="h-4 w-4 text-red-500" />
								<span className="text-sm font-medium text-red-600">Aumentos de Preço</span>
							</div>
							<div className="space-y-2">
								{priceIncreases.slice(0, 3).map((alert) => (
									<div key={alert.productId} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-200">
										<div className="flex-1">
											<p className="font-medium text-sm">{alert.productName}</p>
											<p className="text-xs text-muted-foreground">{alert.marketName}</p>
										</div>
										<div className="text-right">
											<p className="font-bold text-red-600">R$ {alert.currentPrice.toFixed(2)}</p>
											<Badge variant="destructive" className="text-xs">
												+{alert.change.toFixed(1)}%
											</Badge>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Diminuições de preço */}
					{priceDecreases.length > 0 && (
						<div>
							<div className="flex items-center gap-2 mb-2">
								<TrendingDown className="h-4 w-4 text-green-500" />
								<span className="text-sm font-medium text-green-600">Oportunidades</span>
							</div>
							<div className="space-y-2">
								{priceDecreases.slice(0, 3).map((alert) => (
									<div key={alert.productId} className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
										<div className="flex-1">
											<p className="font-medium text-sm">{alert.productName}</p>
											<p className="text-xs text-muted-foreground">{alert.marketName}</p>
										</div>
										<div className="text-right">
											<p className="font-bold text-green-600">R$ {alert.currentPrice.toFixed(2)}</p>
											<Badge variant="default" className="text-xs bg-green-600">
												{alert.change.toFixed(1)}%
											</Badge>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{alerts.length > 6 && (
						<Button variant="outline" size="sm" className="w-full mt-3">
							Ver todos os alertas ({alerts.length})
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	)
}