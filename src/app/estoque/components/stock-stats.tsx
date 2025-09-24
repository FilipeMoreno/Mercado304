"use client"

import { DollarSign, Package, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StockStatsProps {
	stats: {
		totalItems: number
		totalValue: number
		expiringSoon: number
		lowStock: number
	} | null
	isLoading: boolean
}

export function StockStats({ stats, isLoading }: StockStatsProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={`stats-skeleton-${i}`}>
						<CardHeader className="pb-2 sm:pb-3">
							<Skeleton className="h-3 sm:h-4 w-16 sm:w-20" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (!stats) {
		return null
	}

	return (
		<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
					<CardTitle className="text-xs sm:text-sm font-medium">Total de Itens</CardTitle>
					<Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
				</CardHeader>
				<CardContent>
					<div className="text-lg sm:text-2xl font-bold">{stats.totalItems}</div>
					<p className="text-xs text-gray-500">Produtos em estoque</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
					<CardTitle className="text-xs sm:text-sm font-medium">Valor Total</CardTitle>
					<DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
				</CardHeader>
				<CardContent>
					<div className="text-lg sm:text-2xl font-bold">R$ {stats.totalValue.toFixed(2)}</div>
					<p className="text-xs text-gray-500">Investimento total</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
					<CardTitle className="text-xs sm:text-sm font-medium">Vencendo em Breve</CardTitle>
					<TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
				</CardHeader>
				<CardContent>
					<div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.expiringSoon || 0}</div>
					<p className="text-xs text-gray-500">Próximos 7 dias</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
					<CardTitle className="text-xs sm:text-sm font-medium">Estoque Baixo</CardTitle>
					<TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="text-lg sm:text-2xl font-bold text-red-600">{stats.lowStock || 0}</div>
					<p className="text-xs text-gray-500">Precisam reposição</p>
				</CardContent>
			</Card>
		</div>
	)
}
