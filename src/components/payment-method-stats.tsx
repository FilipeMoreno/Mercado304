"use client"

import { ArrowDownRight, ArrowUpRight, CreditCard, DollarSign, PieChart, TrendingUp, Wallet } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface PaymentMethodStat {
	paymentMethod: string
	label: string
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
}

interface PaymentMethodStatsProps {
	dateFrom?: string
	dateTo?: string
}

export function PaymentMethodStats({ dateFrom, dateTo }: PaymentMethodStatsProps) {
	const [loading, setLoading] = useState(true)
	const [data, setData] = useState<{
		paymentStats: PaymentMethodStat[]
		summary: {
			totalTransactions: number
			totalAmount: number
			averageTransactionValue: number
			mostUsedMethod: PaymentMethodStat
			highestValueMethod: PaymentMethodStat
		}
	} | null>(null)

	useEffect(() => {
		fetchPaymentStats()
	}, [dateFrom, dateTo])

	const fetchPaymentStats = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (dateFrom) params.append("dateFrom", dateFrom)
			if (dateTo) params.append("dateTo", dateTo)

			const response = await fetch(`/api/dashboard/payment-stats?${params}`)
			if (response.ok) {
				const result = await response.json()
				setData(result)
			}
		} catch (error) {
			console.error("Erro ao buscar estatísticas de pagamento:", error)
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardContent className="pt-6">
						<div className="animate-pulse space-y-4">
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="h-8 bg-gray-200 rounded w-1/2"></div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<div className="animate-pulse space-y-4">
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="h-8 bg-gray-200 rounded w-1/2"></div>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!data || data.paymentStats.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Métodos de Pagamento
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-gray-500 text-center py-8">Nenhuma compra registrada no período selecionado.</p>
				</CardContent>
			</Card>
		)
	}

	// Calcular cores para o gráfico de pizza simulado
	const colors = [
		"bg-blue-500",
		"bg-green-500",
		"bg-yellow-500",
		"bg-purple-500",
		"bg-pink-500",
		"bg-indigo-500",
		"bg-red-500",
	]

	return (
		<div className="space-y-6">
			{/* Cards de Resumo */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<Wallet className="h-5 w-5 text-blue-600" />
							<div>
								<div className="text-2xl font-bold">{data.summary.totalTransactions}</div>
								<div className="text-sm text-gray-600">Total de Transações</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<DollarSign className="h-5 w-5 text-green-600" />
							<div>
								<div className="text-2xl font-bold">R$ {data.summary.totalAmount.toFixed(2)}</div>
								<div className="text-sm text-gray-600">Valor Total</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5 text-purple-600" />
							<div>
								<div className="text-2xl font-bold">R$ {data.summary.averageTransactionValue.toFixed(2)}</div>
								<div className="text-sm text-gray-600">Ticket Médio</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-2">
							<PieChart className="h-5 w-5 text-orange-600" />
							<div>
								<div className="text-lg font-bold">{data.summary.mostUsedMethod?.label || "N/A"}</div>
								<div className="text-sm text-gray-600">Mais Usado</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Estatísticas Detalhadas */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Gráfico de Pizza Simulado */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<PieChart className="h-5 w-5" />
							Distribuição por Método
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{data.paymentStats.map((stat, index) => (
								<div key={stat.paymentMethod} className="flex items-center gap-3">
									<div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
									<div className="flex-1">
										<div className="flex justify-between items-center">
											<span className="text-sm font-medium">{stat.label}</span>
											<span className="text-sm text-gray-600">{stat.percentage.toFixed(1)}%</span>
										</div>
										<div className="w-full bg-gray-200 rounded-full h-2 mt-1">
											<div
												className={`h-2 rounded-full ${colors[index % colors.length]}`}
												style={{ width: `${stat.percentage}%` }}
											></div>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Lista Detalhada */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CreditCard className="h-5 w-5" />
							Estatísticas Detalhadas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{data.paymentStats.map((stat, index) => (
								<div key={stat.paymentMethod} className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className={`w-3 h-3 rounded ${colors[index % colors.length]}`}></div>
											<span className="font-medium">{stat.label}</span>
										</div>
										<Badge variant="secondary">{stat.count} transações</Badge>
									</div>

									<div className="grid grid-cols-2 gap-4 text-sm text-gray-600 ml-5">
										<div>
											<div className="font-medium">Total</div>
											<div>R$ {stat.totalAmount.toFixed(2)}</div>
										</div>
										<div>
											<div className="font-medium">Média</div>
											<div>R$ {stat.averageAmount.toFixed(2)}</div>
										</div>
									</div>

									{index < data.paymentStats.length - 1 && <Separator className="mt-3" />}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Insights */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Insights
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<ArrowUpRight className="h-4 w-4 text-green-600" />
								<span className="font-medium">Método Mais Popular</span>
							</div>
							<p className="text-sm text-gray-600">
								<strong>{data.summary.mostUsedMethod?.label}</strong> representa{" "}
								<strong>{data.summary.mostUsedMethod?.percentage.toFixed(1)}%</strong> das transações
							</p>
						</div>

						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<DollarSign className="h-4 w-4 text-blue-600" />
								<span className="font-medium">Maior Volume Financeiro</span>
							</div>
							<p className="text-sm text-gray-600">
								<strong>{data.summary.highestValueMethod?.label}</strong> movimentou{" "}
								<strong>R$ {data.summary.highestValueMethod?.totalAmount.toFixed(2)}</strong>
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
