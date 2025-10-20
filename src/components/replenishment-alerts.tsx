"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertCircle, Brain, Clock, Plus, ShoppingCart, TrendingUp } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ConsumptionPattern {
	product: {
		id: string
		name: string
		unit: string
		brand?: { name: string }
		category?: { name: string }
	}
	consumption: {
		totalPurchases: number
		avgIntervalDays: number
		avgQuantityPerPurchase: number
		lastPurchaseDate: string
		daysSinceLastPurchase: number
		nextPurchaseExpected: string
		daysUntilNextPurchase: number
		urgency: number
		confidence: number
		shouldReplenish: boolean
	}
}

interface ReplenishmentData {
	replenishmentAlerts: ConsumptionPattern[]
	stats: {
		totalProductsAnalyzed: number
		productsWithRegularPattern: number
		replenishmentAlertsCount: number
	}
}

interface ReplenishmentAlertsProps {
	data: ReplenishmentData | null
	loading: boolean
	onAddToShoppingList?: (productId: string, quantity: number) => Promise<void>
}

export function ReplenishmentAlerts({ data, loading, onAddToShoppingList }: ReplenishmentAlertsProps) {
	const [addingToList, setAddingToList] = useState<string | null>(null)

	const getUrgencyColor = (urgency: number) => {
		if (urgency >= 80) return "bg-red-100 text-red-800 border-red-200"
		if (urgency >= 60) return "bg-orange-100 text-orange-800 border-orange-200"
		if (urgency >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200"
		return "bg-blue-100 text-blue-800 border-blue-200"
	}

	const getUrgencyText = (urgency: number) => {
		if (urgency >= 80) return "Urgente"
		if (urgency >= 60) return "Alta"
		if (urgency >= 40) return "Média"
		return "Baixa"
	}

	const handleAddToList = async (product: ConsumptionPattern) => {
		if (!onAddToShoppingList) return

		setAddingToList(product.product.id)
		try {
			await onAddToShoppingList(product.product.id, Math.ceil(product.consumption.avgQuantityPerPurchase))
		} catch (error) {
			console.error("Erro ao adicionar à lista:", error)
		} finally {
			setAddingToList(null)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="size-5" />
						Alertas Inteligentes
					</CardTitle>
					<CardDescription>Predições baseadas no seu histórico</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3 animate-pulse">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-20 bg-gray-200 rounded-sm"></div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!data || data.replenishmentAlerts.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="size-5" />
						Alertas Inteligentes
					</CardTitle>
					<CardDescription>Predições baseadas no seu histórico</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 space-y-3">
						<TrendingUp className="size-12 text-gray-400 mx-auto" />
						<p className="text-gray-500">Continue comprando para que eu possa aprender seus padrões!</p>
						<p className="text-xs text-gray-400">{data?.stats.totalProductsAnalyzed || 0} produtos analisados</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Brain className="size-5" />
					Alertas Inteligentes
					<Badge variant="secondary" className="ml-2">
						{data.replenishmentAlerts.length}
					</Badge>
				</CardTitle>
				<CardDescription>Produtos que podem estar acabando baseado no seu padrão de consumo</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{data.replenishmentAlerts.slice(0, 5).map((alert) => (
					<div key={alert.product.id} className="border rounded-lg p-4 space-y-3">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<h4 className="font-medium">{alert.product.name}</h4>
									<Badge variant="outline" className={getUrgencyColor(alert.consumption.urgency)}>
										{getUrgencyText(alert.consumption.urgency)}
									</Badge>
								</div>

								{alert.product.brand && <p className="text-sm text-gray-500">{alert.product.brand.name}</p>}

								<div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
									<div className="flex items-center gap-1">
										<Clock className="h-3 w-3" />
										<span>A cada {alert.consumption.avgIntervalDays} dias</span>
									</div>
									<div>
										<span>
											Última: {format(new Date(alert.consumption.lastPurchaseDate), "dd/MM", { locale: ptBR })}
										</span>
									</div>
									<div>
										<span>{alert.consumption.confidence}% confiança</span>
									</div>
								</div>
							</div>

							<Button
								size="sm"
								variant="outline"
								onClick={() => handleAddToList(alert)}
								disabled={addingToList === alert.product.id}
								className="ml-3"
							>
								{addingToList === alert.product.id ? (
									<div className="flex items-center gap-1">
										<div className="h-3 w-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
										<span>Adicionando...</span>
									</div>
								) : (
									<div className="flex items-center gap-1">
										<Plus className="h-3 w-3" />
										<span>À Lista</span>
									</div>
								)}
							</Button>
						</div>

						<div className="bg-gray-50 rounded-sm p-3 space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<AlertCircle className="size-4 text-orange-500" />
								<span className="font-medium">Predição:</span>
							</div>

							<div className="grid grid-cols-2 gap-4 text-xs">
								<div>
									<span className="text-gray-600">Quantidade sugerida:</span>
									<div className="font-bold">
										{Math.ceil(alert.consumption.avgQuantityPerPurchase)} {alert.product.unit}
									</div>
								</div>
								<div>
									<span className="text-gray-600">Próxima compra:</span>
									<div className="font-bold">
										{alert.consumption.daysUntilNextPurchase > 0
											? `em ${alert.consumption.daysUntilNextPurchase} dias`
											: `${Math.abs(alert.consumption.daysUntilNextPurchase)} dias atrás`}
									</div>
								</div>
							</div>

							{alert.consumption.urgency >= 80 && (
								<div className="text-xs text-red-600 font-medium bg-red-50 p-2 rounded-sm">
									⚠️ Produto pode estar acabando!
								</div>
							)}
						</div>
					</div>
				))}

				{data.stats && (
					<div className="pt-4 border-t text-center space-y-1">
						<p className="text-xs text-gray-500">IA analisou {data.stats.totalProductsAnalyzed} produtos</p>
						<p className="text-xs text-gray-500">
							{data.stats.productsWithRegularPattern} com padrão regular detectado
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
