"use client"

import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

interface WasteStatsProps {
	stats: {
		totalValue: number
		totalQuantity: number
		totalCount: number
		reasonStats: Array<{
			wasteReason: string
			_count: { wasteReason: number }
		}>
	} | null
	isLoading: boolean
}

const wasteReasonLabels = {
	EXPIRED: "Vencido",
	DAMAGED: "Danificado",
	OVERSTOCK: "Excesso de Estoque",
	QUALITY: "Problema de Qualidade",
	POWER_OUTAGE: "Falta de Energia",
	FORGOTTEN: "Esquecido",
	OTHER: "Outro",
}

export function WasteStats({ stats, isLoading }: WasteStatsProps) {
	if (isLoading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={`stats-skeleton-${i}`}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="size-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16 mb-1" />
							<Skeleton className="h-3 w-24" />
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (!stats || stats.totalCount === 0) {
		return (
			<Card className="border-dashed border-2 border-green-200 bg-green-50/50 dark:bg-green-950/20">
				<CardContent className="py-12">
					<Empty>
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<CheckCircle2 className="size-12 text-green-600" />
							</EmptyMedia>
							<EmptyTitle className="text-green-900 dark:text-green-100">Excelente! Sem desperdícios</EmptyTitle>
							<EmptyDescription className="text-green-700 dark:text-green-300">
								Continue assim! Manter o desperdício zerado é ótimo para seu bolso e para o meio ambiente.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Valor Total Perdido</CardTitle>
					<TrendingDown className="size-4 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-red-600">R$ {stats.totalValue.toFixed(2)}</div>
					<p className="text-xs text-gray-500">Valor total em desperdícios</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Quantidade Total</CardTitle>
					<TrendingDown className="size-4 text-orange-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-orange-600">{stats.totalQuantity}</div>
					<p className="text-xs text-gray-500">Itens desperdiçados</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
					<TrendingUp className="size-4 text-blue-500" />
				</CardHeader>
				<CardContent>
					<div className="text-2xl font-bold text-blue-600">{stats.totalCount}</div>
					<p className="text-xs text-gray-500">Registros de desperdício</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">Motivo Mais Frequente</CardTitle>
					<AlertTriangle className="size-4 text-purple-500" />
				</CardHeader>
				<CardContent>
					<div className="text-lg font-bold text-purple-600">
						{stats.reasonStats.length > 0
							? wasteReasonLabels[stats.reasonStats[0].wasteReason as keyof typeof wasteReasonLabels]
							: "N/A"}
					</div>
					<p className="text-xs text-gray-500">
						Mais frequente ({stats?.reasonStats?.[0]?._count.wasteReason || 0} vezes)
					</p>
				</CardContent>
			</Card>

			{/* Gráfico de motivos */}
			<Card className="md:col-span-2 lg:col-span-4">
				<CardHeader>
					<CardTitle className="text-lg">Distribuição por Motivo</CardTitle>
					<CardDescription>Principais causas de desperdício</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{stats.reasonStats
							.slice(0, 5)
							.map((stat: { wasteReason: string; _count: { wasteReason: number } }, index: number) => {
								const percentage = ((stat._count.wasteReason / stats.totalCount) * 100).toFixed(1)
								const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-gray-500"]
								return (
									<div key={`reason-stat-${stat.wasteReason}`} className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className={`w-3 h-3 rounded-full ${colors[index]}`} />
											<span className="text-sm font-medium">
												{wasteReasonLabels[stat.wasteReason as keyof typeof wasteReasonLabels]}
											</span>
										</div>
										<div className="text-right">
											<div className="text-sm font-bold">{stat._count.wasteReason}</div>
											<div className="text-xs text-gray-500">{percentage}%</div>
										</div>
									</div>
								)
							})}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
