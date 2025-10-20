"use client"

import { Calendar, DollarSign, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TemporalData {
	currentMonth: {
		purchases: number
		spent: number
		avgTicket: number
		topProducts: any[]
		topMarkets: any[]
	}
	lastMonth: {
		purchases: number
		spent: number
		avgTicket: number
		topProducts: any[]
		topMarkets: any[]
	}
	changes: {
		spent: number
		purchases: number
		avgTicket: number
	}
	insights: {
		spentMore: boolean
		purchasedMore: boolean
		higherTicket: boolean
	}
}

interface TemporalComparisonCardProps {
	temporalData: TemporalData | null
	loading: boolean
}

export function TemporalComparisonCard({ temporalData, loading }: TemporalComparisonCardProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="size-5" />
						Comparação Mensal
					</CardTitle>
					<CardDescription>Mês atual vs mês anterior</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4 animate-pulse">
						<div className="h-4 bg-gray-200 rounded-sm w-3/4"></div>
						<div className="h-4 bg-gray-200 rounded-sm w-1/2"></div>
						<div className="h-4 bg-gray-200 rounded-sm w-2/3"></div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!temporalData || !temporalData.changes) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="size-5" />
						Comparação Mensal
					</CardTitle>
					<CardDescription>Mês atual vs mês anterior</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-center text-gray-500 py-4">Dados insuficientes para comparação</p>
				</CardContent>
			</Card>
		)
	}

	const formatChange = (change: number) => {
		const absChange = Math.abs(change)
		const isPositive = change > 0
		return {
			value: absChange.toFixed(1),
			isPositive,
			icon: isPositive ? TrendingUp : TrendingDown,
			color: isPositive ? "text-red-600" : "text-green-600",
			bgColor: isPositive ? "bg-red-50" : "bg-green-50",
		}
	}

	const spentChange = formatChange(temporalData.changes?.spent || 0)
	const purchasesChange = formatChange(temporalData.changes?.purchases || 0)
	const ticketChange = formatChange(temporalData.changes?.avgTicket || 0)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="size-5" />
					Comparação Mensal
				</CardTitle>
				<CardDescription>Mês atual vs mês anterior</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Resumo Principal */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="text-center space-y-1">
						<div className="flex items-center justify-center gap-1">
							<DollarSign className="size-4 text-gray-500" />
							<span className="text-sm text-gray-600">Gastos</span>
						</div>
						<div className="text-lg font-bold">R$ {(temporalData.currentMonth?.spent || 0).toFixed(2)}</div>
						<div className={`flex items-center justify-center gap-1 text-xs ${spentChange.color}`}>
							<spentChange.icon className="h-3 w-3" />
							{spentChange.value}%
						</div>
					</div>

					<div className="text-center space-y-1">
						<div className="flex items-center justify-center gap-1">
							<ShoppingCart className="size-4 text-gray-500" />
							<span className="text-sm text-gray-600">Compras</span>
						</div>
						<div className="text-lg font-bold">{temporalData.currentMonth?.purchases || 0}</div>
						<div className={`flex items-center justify-center gap-1 text-xs ${purchasesChange.color}`}>
							<purchasesChange.icon className="h-3 w-3" />
							{purchasesChange.value}%
						</div>
					</div>

					<div className="text-center space-y-1">
						<div className="flex items-center justify-center gap-1">
							<TrendingUp className="size-4 text-gray-500" />
							<span className="text-sm text-gray-600">Ticket Médio</span>
						</div>
						<div className="text-lg font-bold">R$ {(temporalData.currentMonth?.avgTicket || 0).toFixed(2)}</div>
						<div className={`flex items-center justify-center gap-1 text-xs ${ticketChange.color}`}>
							<ticketChange.icon className="h-3 w-3" />
							{ticketChange.value}%
						</div>
					</div>
				</div>

				{/* Insights */}
				{(temporalData.insights?.spentMore ||
					temporalData.insights?.purchasedMore ||
					temporalData.insights?.higherTicket) && (
					<div className="space-y-2">
						<h4 className="font-medium text-sm">Insights do Mês</h4>
						<div className="flex flex-wrap gap-2">
							{temporalData.insights?.spentMore && (
								<Badge variant="destructive" className="text-xs">
									Gastou mais que o mês passado
								</Badge>
							)}
							{temporalData.insights?.purchasedMore && (
								<Badge variant="secondary" className="text-xs">
									Fez mais compras
								</Badge>
							)}
							{temporalData.insights?.higherTicket && (
								<Badge variant="outline" className="text-xs">
									Ticket médio maior
								</Badge>
							)}
						</div>
					</div>
				)}

				{/* Comparação Mês Anterior */}
				<div className="pt-4 border-t">
					<h4 className="font-medium text-sm mb-3">Mês Anterior</h4>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm text-gray-600">
						<div>
							<div>R$ {(temporalData.lastMonth?.spent || 0).toFixed(2)}</div>
							<div className="text-xs">gastos</div>
						</div>
						<div>
							<div>{temporalData.lastMonth?.purchases || 0}</div>
							<div className="text-xs">compras</div>
						</div>
						<div>
							<div>R$ {(temporalData.lastMonth?.avgTicket || 0).toFixed(2)}</div>
							<div className="text-xs">ticket médio</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
