"use client"

import { TrendingDown, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface BestPriceAlertProps {
	productName: string
	currentPrice: number
	previousBestPrice: number
	totalRecords: number
	onClose: () => void
}

export function BestPriceAlert({
	productName,
	currentPrice,
	previousBestPrice,
	totalRecords,
	onClose,
}: BestPriceAlertProps) {
	const [isVisible, setIsVisible] = useState(true)

	const handleClose = () => {
		setIsVisible(false)
		onClose()
	}

	if (!isVisible) return null

	const savings = previousBestPrice - currentPrice

	return (
		<Card className="border-green-200 bg-green-50">
			<CardContent className="p-4">
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-3">
						<div className="rounded-full bg-green-500 p-1">
							<TrendingDown className="h-4 w-4 text-white" />
						</div>
						<div className="flex-1">
							<h4 className="font-semibold text-green-800">🎉 Menor Preço Histórico!</h4>
							<p className="text-sm text-green-700 mt-1">
								<strong>{productName}</strong> por <strong>R$ {currentPrice.toFixed(2)}</strong> é o menor preço entre{" "}
								{totalRecords} registros.
							</p>
							<p className="text-xs text-green-600 mt-1">
								Economia de R$ {savings.toFixed(2)} em relação ao menor preço anterior (R${" "}
								{previousBestPrice.toFixed(2)})
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleClose}
						className="text-green-600 hover:text-green-800 hover:bg-green-100"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
