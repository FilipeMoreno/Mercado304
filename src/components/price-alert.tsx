"use client"

import { AlertTriangle, MapPin, TrendingDown, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "./ui/button"

interface PriceAlertData {
	hasAlert: boolean
	alertType?: "price_warning" | "high_price"
	message: string
	details?: {
		currentPrice: number
		suggestedPrice?: number
		averagePrice?: number
		savings?: number
		savingsPercent?: number
		suggestedMarket?: {
			name: string
		}
		difference?: number
		percentDifference?: number
		totalComparisons: number
		historicalPurchases?: number
	}
}

interface PriceAlertProps {
	alertData: PriceAlertData | null
	loading?: boolean
	onClose?: () => void
}

export function PriceAlert({ alertData, loading, onClose }: PriceAlertProps) {
	if (loading) {
		return (
			<div className="animate-pulse">
				<div className="h-16 bg-gray-100 rounded-lg"></div>
			</div>
		)
	}

	if (!alertData || !alertData.hasAlert) {
		return null
	}

	const isWarning = alertData.alertType === "price_warning"
	const isHighPrice = alertData.alertType === "high_price"

	return (
		<Alert className={`border-l-4 ${isWarning ? "border-l-yellow-500 bg-yellow-50" : "border-l-red-500 bg-red-50"}`}>
			<div className="flex items-start gap-3">
				{isWarning ? (
					<TrendingDown className="h-5 w-5 text-yellow-600 mt-0.5" />
				) : (
					<AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
				)}

				<div className="flex-1 space-y-2">
					<AlertDescription className="font-medium text-sm">{alertData.message}</AlertDescription>

					{alertData.details && isWarning && (
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<MapPin className="h-4 w-4 text-yellow-600" />
								<span className="font-medium">{alertData.details.suggestedMarket?.name}</span>
								<Badge variant="secondary" className="text-xs">
									R$ {alertData.details.suggestedPrice?.toFixed(2)}
								</Badge>
							</div>

							<div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
								<div>
									<span className="font-medium">Economia possível:</span>
									<div className="text-green-600 font-bold">
										R$ {alertData.details.savings?.toFixed(2)} ({alertData.details.savingsPercent?.toFixed(1)}%)
									</div>
								</div>
								<div>
									<span className="font-medium">Baseado em:</span>
									<div>{alertData.details.historicalPurchases} compras anteriores</div>
								</div>
							</div>
						</div>
					)}

					{alertData.details && isHighPrice && (
						<div className="space-y-2">
							<div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
								<div>
									<span className="font-medium">Preço atual:</span>
									<div className="text-red-600 font-bold">R$ {alertData.details.currentPrice.toFixed(2)}</div>
								</div>
								<div>
									<span className="font-medium">Média histórica:</span>
									<div className="text-gray-700 font-bold">R$ {alertData.details.averagePrice?.toFixed(2)}</div>
								</div>
							</div>

							<div className="text-xs text-gray-600">
								<span className="font-medium">Diferença:</span>
								<span className="text-red-600 font-bold ml-1">
									+{alertData.details.percentDifference?.toFixed(1)}% acima da média
								</span>
							</div>
						</div>
					)}
				</div>
			</div>
			{onClose && (
				<Button variant="ghost" size="icon" className="absolute top-2 right-2 h-auto w-auto" onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			)}
		</Alert>
	)
}
