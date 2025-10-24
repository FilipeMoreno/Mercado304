"use client"

import { Calendar, TrendingDown, TrendingUp, DollarSign, ShoppingCart } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface MonthlyStats {
	month: string
	totalSpent: number
	totalPurchases: number
	averagePerPurchase: number
}

interface MonthlyPurchaseStatsProps {
	data?: {
		monthlySpending: MonthlyStats[]
		monthlyComparison: {
			currentMonth: {
				totalSpent: number
				totalPurchases: number
				averagePerPurchase: number
			}
			lastMonth: {
				totalSpent: number
				totalPurchases: number
				averagePerPurchase: number
			}
			spentChange: number
			purchasesChange: number
		}
	}
	loading?: boolean
}

export function MonthlyPurchaseStats({ data, loading }: MonthlyPurchaseStatsProps) {
	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-blue-600" />
						Histórico Mensal de Compras
					</CardTitle>
					<CardDescription>Análise dos gastos mensais e tendências</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{['stat-1', 'stat-2', 'stat-3', 'stat-4'].map((id) => (
							<div key={id} className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-6 w-16" />
								<Skeleton className="h-3 w-12" />
							</div>
						))}
					</div>
					<div className="space-y-3">
						<Skeleton className="h-4 w-32" />
						<div className="space-y-2">
							{['row-1', 'row-2', 'row-3'].map((id) => (
								<Skeleton key={id} className="h-8 w-full" />
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!data?.monthlySpending || data.monthlySpending.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5 text-blue-600" />
						Histórico Mensal de Compras
					</CardTitle>
					<CardDescription>Análise dos gastos mensais e tendências</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">
						<Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
						<p className="text-gray-600">Nenhum dado de compras encontrado</p>
						<p className="text-sm text-gray-500">Registre algumas compras para ver as estatísticas mensais</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	const monthlyData = data.monthlySpending
	const comparison = data.monthlyComparison

	// Calcular estatísticas
	const totalSpent = monthlyData.reduce((sum, month) => sum + month.totalSpent, 0)
	const averageMonthlySpent = totalSpent / monthlyData.length
	const highestSpendingMonth = monthlyData.reduce((max, month) => 
		month.totalSpent > max.totalSpent ? month : max
	)
	const lowestSpendingMonth = monthlyData.reduce((min, month) => 
		month.totalSpent < min.totalSpent ? month : min
	)

	// Formatar mês para exibição
	const formatMonth = (monthStr: string) => {
		const [year, month] = monthStr.split('-')
		const date = new Date(parseInt(year), parseInt(month) - 1)
		return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
	}

	// Formatar valor monetário
	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(value)
	}

	// Formatar percentual
	const formatPercentage = (value: number) => {
		const sign = value >= 0 ? '+' : ''
		return `${sign}${value.toFixed(1)}%`
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="h-5 w-5 text-blue-600" />
					Histórico Mensal de Compras
				</CardTitle>
				<CardDescription>Análise dos gastos mensais e tendências</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Estatísticas principais */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<div className="text-center">
						<div className="flex items-center justify-center gap-1 mb-1">
							<TrendingUp className="h-4 w-4 text-green-600" />
							<span className="text-sm font-medium text-gray-600">Maior Gasto</span>
						</div>
						<p className="text-lg font-bold text-green-600">
							{formatCurrency(highestSpendingMonth.totalSpent)}
						</p>
						<p className="text-xs text-gray-500">
							{formatMonth(highestSpendingMonth.month)}
						</p>
					</div>

					<div className="text-center">
						<div className="flex items-center justify-center gap-1 mb-1">
							<TrendingDown className="h-4 w-4 text-red-600" />
							<span className="text-sm font-medium text-gray-600">Menor Gasto</span>
						</div>
						<p className="text-lg font-bold text-red-600">
							{formatCurrency(lowestSpendingMonth.totalSpent)}
						</p>
						<p className="text-xs text-gray-500">
							{formatMonth(lowestSpendingMonth.month)}
						</p>
					</div>

					<div className="text-center">
						<div className="flex items-center justify-center gap-1 mb-1">
							<DollarSign className="h-4 w-4 text-blue-600" />
							<span className="text-sm font-medium text-gray-600">Média Mensal</span>
						</div>
						<p className="text-lg font-bold text-blue-600">
							{formatCurrency(averageMonthlySpent)}
						</p>
						<p className="text-xs text-gray-500">
							{monthlyData.length} meses
						</p>
					</div>

					<div className="text-center">
						<div className="flex items-center justify-center gap-1 mb-1">
							<ShoppingCart className="h-4 w-4 text-purple-600" />
							<span className="text-sm font-medium text-gray-600">Total Gasto</span>
						</div>
						<p className="text-lg font-bold text-purple-600">
							{formatCurrency(totalSpent)}
						</p>
						<p className="text-xs text-gray-500">
							Período analisado
						</p>
					</div>
				</div>

				{/* Comparação mês atual vs anterior */}
				{comparison && (
					<div className="bg-gray-50 rounded-lg p-4">
						<h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							Comparação Mensal
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Gastos</span>
									<Badge 
										variant={comparison.spentChange >= 0 ? "destructive" : "default"}
										className="text-xs"
									>
										{formatPercentage(comparison.spentChange)}
									</Badge>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span>Este mês: {formatCurrency(comparison.currentMonth.totalSpent)}</span>
									<span>Mês anterior: {formatCurrency(comparison.lastMonth.totalSpent)}</span>
								</div>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<span className="text-sm text-gray-600">Compras</span>
									<Badge 
										variant={comparison.purchasesChange >= 0 ? "destructive" : "default"}
										className="text-xs"
									>
										{formatPercentage(comparison.purchasesChange)}
									</Badge>
								</div>
								<div className="flex items-center justify-between text-sm">
									<span>Este mês: {comparison.currentMonth.totalPurchases}</span>
									<span>Mês anterior: {comparison.lastMonth.totalPurchases}</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Histórico dos últimos meses */}
				<div>
					<h4 className="font-semibold text-sm mb-3">Últimos Meses</h4>
					<div className="space-y-2">
						{monthlyData.slice(-6).reverse().map((month) => (
							<div 
								key={month.month}
								className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
							>
								<div className="flex items-center gap-3">
									<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
									<div>
										<p className="font-medium text-sm">
											{formatMonth(month.month)}
										</p>
										<p className="text-xs text-gray-500">
											{month.totalPurchases} compras
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className="font-semibold text-sm">
										{formatCurrency(month.totalSpent)}
									</p>
									<p className="text-xs text-gray-500">
										Média: {formatCurrency(month.averagePerPurchase)}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
