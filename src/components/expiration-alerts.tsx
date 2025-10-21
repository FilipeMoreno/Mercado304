"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertTriangle, Calendar, CheckCircle, Clock, Package, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ExpirationAlertsData {
	alerts: {
		expired: any[]
		expiringToday: any[]
		expiringSoon: any[]
		lowStock: any[]
	}
	stats: {
		expired: number
		expiringToday: number
		expiringSoon: number
		lowStock: number
		potentialWasteValue: number
	}
	actionSuggestions: any[]
}

interface ExpirationAlertsProps {
	data: ExpirationAlertsData | null
	loading: boolean
	onRefresh?: () => void
}

export function ExpirationAlerts({ data, loading, onRefresh }: ExpirationAlertsProps) {
	const [processingAction, setProcessingAction] = useState<string | null>(null)

	const handleMarkAsUsed = async (itemId: string, quantity: number) => {
		setProcessingAction(itemId)
		try {
			const response = await fetch(`/api/stock/${itemId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ consumed: quantity }),
			})

			if (response.ok) {
				onRefresh?.()
			} else {
				toast.error("Erro ao marcar como usado")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao processar")
		} finally {
			setProcessingAction(null)
		}
	}

	const handleRemoveExpired = async (itemId: string) => {
		setProcessingAction(itemId)
		try {
			const response = await fetch(`/api/stock/${itemId}`, {
				method: "DELETE",
			})

			if (response.ok) {
				onRefresh?.()
			} else {
				toast.error("Erro ao remover item")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao remover")
		} finally {
			setProcessingAction(null)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<AlertTriangle className="size-5" />
						Alertas de Validade
					</CardTitle>
					<CardDescription>Produtos vencendo ou com estoque baixo</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3 animate-pulse">
						{[1, 2, 3].map((i) => (
							<div key={i} className="h-16 bg-gray-200 rounded-sm"></div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	if (
		!data ||
		(!data.alerts.expired.length &&
			!data.alerts.expiringToday.length &&
			!data.alerts.expiringSoon.length &&
			!data.alerts.lowStock.length)
	) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CheckCircle className="size-5 text-green-600" />
						Estoque em Ordem
					</CardTitle>
					<CardDescription>Nenhum alerta de validade ou estoque</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8 space-y-3">
						<Package className="size-12 text-green-400 mx-auto" />
						<p className="text-green-600 font-medium">
							Todos os produtos estão dentro da validade e com estoque adequado!
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	const allAlerts = [
		...data.alerts.expired.map((item: any) => ({
			...item,
			alertType: "expired",
			priority: 3,
		})),
		...data.alerts.expiringToday.map((item: any) => ({
			...item,
			alertType: "today",
			priority: 2,
		})),
		...data.alerts.expiringSoon.map((item: any) => ({
			...item,
			alertType: "soon",
			priority: 1,
		})),
		...data.alerts.lowStock.map((item: any) => ({
			...item,
			alertType: "lowStock",
			priority: 0,
		})),
	].sort((a, b) => b.priority - a.priority)

	const getAlertColor = (alertType: string) => {
		switch (alertType) {
			case "expired":
				return "border-l-red-500 bg-red-50"
			case "today":
				return "border-l-orange-500 bg-orange-50"
			case "soon":
				return "border-l-yellow-500 bg-yellow-50"
			case "lowStock":
				return "border-l-blue-500 bg-blue-50"
			default:
				return "border-l-gray-500 bg-gray-50"
		}
	}

	const getAlertIcon = (alertType: string) => {
		switch (alertType) {
			case "expired":
				return <AlertTriangle className="size-4 text-red-600" />
			case "today":
				return <Calendar className="size-4 text-orange-600" />
			case "soon":
				return <Clock className="size-4 text-yellow-600" />
			case "lowStock":
				return <Package className="size-4 text-blue-600" />
			default:
				return <AlertTriangle className="size-4 text-gray-600" />
		}
	}

	const getAlertMessage = (item: any, alertType: string) => {
		switch (alertType) {
			case "expired":
				return `Vencido em ${format(new Date(item.expirationDate), "dd/MM", { locale: ptBR })}`
			case "today":
				return "Vence hoje!"
			case "soon": {
				const daysLeft = Math.ceil((new Date(item.expirationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
				return `Vence em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}`
			}
			case "lowStock":
				return `Estoque: ${item.quantity} ${item.product.unit} (mín: ${item.product.minStock})`
			default:
				return "Alerta"
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<AlertTriangle className="size-5" />
					Alertas de Validade e Estoque
					<Badge variant="destructive" className="ml-2">
						{data.stats.expired + data.stats.expiringToday + data.stats.expiringSoon + data.stats.lowStock}
					</Badge>
				</CardTitle>
				<CardDescription>
					{data.stats.potentialWasteValue > 0 && (
						<span className="text-red-600">Risco de desperdício: R$ {data.stats.potentialWasteValue.toFixed(2)}</span>
					)}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{allAlerts.slice(0, 8).map((alert) => (
					<div key={alert.id} className={`border-l-4 ${getAlertColor(alert.alertType)} p-4 rounded-r-lg`}>
						<div className="flex items-start justify-between">
							<div className="flex items-start gap-3 flex-1">
								{getAlertIcon(alert.alertType)}

								<div className="flex-1">
									<h4 className="font-medium">{alert.product.name}</h4>
									{alert.product.brand && <p className="text-sm text-gray-500">{alert.product.brand.name}</p>}

									<div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
										<span>{getAlertMessage(alert, alert.alertType)}</span>
										{alert.location && <span className="flex items-center gap-1">📍 {alert.location}</span>}
									</div>
								</div>
							</div>

							<div className="flex gap-2 ml-3">
								{alert.alertType === "expired" ? (
									<Button
										variant="destructive"
										size="sm"
										onClick={() => handleRemoveExpired(alert.id)}
										disabled={processingAction === alert.id}
									>
										<Trash2 className="h-3 w-3" />
									</Button>
								) : (
									<Button
										variant="outline"
										size="sm"
										onClick={() => handleMarkAsUsed(alert.id, alert.quantity)}
										disabled={processingAction === alert.id}
									>
										{processingAction === alert.id ? "..." : "Usar"}
									</Button>
								)}
							</div>
						</div>
					</div>
				))}

				{/* Sugestões de Ação */}
				{data.actionSuggestions.length > 0 && (
					<div className="pt-4 border-t space-y-2">
						<h4 className="font-medium text-sm">Ações Sugeridas</h4>
						{data.actionSuggestions.slice(0, 3).map((suggestion, index) => (
							<div key={index} className="bg-blue-50 border border-blue-200 rounded-sm p-3">
								<div className="flex items-center justify-between">
									<div>
										<div className="font-medium text-sm text-blue-800">{suggestion.title}</div>
										<div className="text-xs text-blue-600">{suggestion.description}</div>
									</div>
									<Badge variant={suggestion.priority === "high" ? "destructive" : "secondary"} className="text-xs">
										{suggestion.priority === "high" ? "Urgente" : "Médio"}
									</Badge>
								</div>
							</div>
						))}
					</div>
				)}

				<div className="pt-4 border-t text-center">
					<Button variant="outline" size="sm" onClick={onRefresh}>
						Atualizar Alertas
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
