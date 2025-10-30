"use client"

import { AlertTriangle, BarChart3, Package, TrendingDown, TrendingUp } from "lucide-react"
import { useProductWasteUsageQuery } from "@/hooks/use-react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface WasteUsageStats {
	wasteRecords: Array<{
		id: string
		quantity: number
		unit: string
		wasteReason: string
		wasteDate: string
		totalValue: number
		productName: string
	}>
	stockMovements: Array<{
		id: string
		type: string
		quantity: number
		reason: string
		date: string
	}>
	totalWasteValue: number
	totalWasteQuantity: number
	recentWasteCount: number
	recentUsageCount: number
}

interface ProductWasteUsageCardProps {
	productId: string
	productName: string
}

export function ProductWasteUsageCard({ productId }: ProductWasteUsageCardProps) {
	// Fetch waste and usage stats using React Query
	const { data: stats, isLoading: loading } = useProductWasteUsageQuery(productId)

	if (loading) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm flex items-center gap-2">
						<AlertTriangle className="h-4 w-4" />
						Desperdícios e Usos
					</CardTitle>
					<CardDescription>Histórico de desperdícios e usos do produto</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="grid grid-cols-2 gap-3">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={`skeleton-${i}`} className="p-3 border rounded-lg">
								<div className="h-4 bg-gray-200 rounded mb-2" />
								<div className="h-6 bg-gray-200 rounded mb-1" />
								<div className="h-3 bg-gray-200 rounded w-2/3" />
							</div>
						))}
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!stats || (stats.wasteRecords.length === 0 && stats.stockMovements.length === 0)) {
		return (
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-sm flex items-center gap-2">
						<AlertTriangle className="h-4 w-4" />
						Desperdícios e Usos
					</CardTitle>
					<CardDescription>Histórico de desperdícios e usos do produto</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
							<Package className="h-6 w-6 text-gray-400" />
						</div>
						<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
							Nenhum registro encontrado
						</h3>
						<p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
							Não há registros de desperdícios ou usos para este produto ainda.
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader className="pb-3">
				<CardTitle className="text-sm flex items-center gap-2">
					<AlertTriangle className="h-4 w-4" />
					Desperdícios e Usos
				</CardTitle>
				<CardDescription>Histórico de desperdícios e usos do produto</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Estatísticas Resumidas */}
					<div className="grid grid-cols-2 gap-3">
						<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<div className="flex items-center gap-2 mb-1">
								<TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
								<span className="text-xs font-medium text-red-800 dark:text-red-200">Desperdícios</span>
							</div>
							<p className="text-lg font-bold text-red-600 dark:text-red-400">
								{stats.totalWasteQuantity.toFixed(1)}
							</p>
							<p className="text-xs text-red-600 dark:text-red-400">
								R$ {stats.totalWasteValue.toFixed(2)}
							</p>
						</div>

						<div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
							<div className="flex items-center gap-2 mb-1">
								<TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
								<span className="text-xs font-medium text-blue-800 dark:text-blue-200">Usos (30d)</span>
							</div>
							<p className="text-lg font-bold text-blue-600 dark:text-blue-400">
								{stats.recentUsageCount}
							</p>
							<p className="text-xs text-blue-600 dark:text-blue-400">
								{stats.recentWasteCount} desperdícios
							</p>
						</div>
					</div>

					{/* Últimos Desperdícios */}
					{stats.wasteRecords.length > 0 && (
						<div>
							<h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
								<AlertTriangle className="h-3 w-3" />
								Últimos Desperdícios
							</h4>
							<div className="space-y-2">
								{stats.wasteRecords.map((waste) => (
									<div key={waste.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-xs">
										<div className="flex-1 min-w-0">
											<p className="font-medium text-red-800 dark:text-red-200 truncate">
												{waste.quantity} {waste.unit}
											</p>
											<p className="text-red-600 dark:text-red-400 truncate">
												{waste.wasteReason}
											</p>
										</div>
										<div className="text-right ml-2">
											<p className="font-medium text-red-800 dark:text-red-200">
												R$ {waste.totalValue.toFixed(2)}
											</p>
											<p className="text-red-600 dark:text-red-400">
												{new Date(waste.wasteDate).toLocaleDateString('pt-BR')}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Últimos Usos */}
					{stats.stockMovements.length > 0 && (
						<div>
							<h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
								<BarChart3 className="h-3 w-3" />
								Últimos Usos
							</h4>
							<div className="space-y-2">
								{stats.stockMovements.map((movement) => (
									<div key={movement.id} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded text-xs">
										<div className="flex-1 min-w-0">
											<p className="font-medium text-blue-800 dark:text-blue-200 truncate">
												{movement.quantity} unidades
											</p>
											<p className="text-blue-600 dark:text-blue-400 truncate">
												{movement.reason}
											</p>
										</div>
										<div className="text-right ml-2">
											<p className="text-blue-600 dark:text-blue-400">
												{new Date(movement.date).toLocaleDateString('pt-BR')}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
