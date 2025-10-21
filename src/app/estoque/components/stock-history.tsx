"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	AlertTriangle,
	ArrowUpDown,
	Calendar,
	Download,
	Filter,
	History,
	Package,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useStockHistoryQuery } from "@/hooks"

interface StockHistoryProps {
	productId?: string
	stockItemId?: string
	productName?: string
	onPageChange?: (page: number) => void
	currentPage?: number
}

interface MovementRecord {
	id: string
	type: string
	quantity: number
	reason?: string
	notes?: string
	date: string
	isWaste?: boolean
	recordType?: "movement" | "waste"
	stockItem: {
		id: string
		location: string
		product: {
			id: string
			name: string
			unit: string
			brand?: { name: string }
			category?: { name: string }
		}
	}
}

const movementTypeColors = {
	ENTRADA: "bg-green-100 text-green-800 border-green-200",
	SAIDA: "bg-blue-100 text-blue-800 border-blue-200",
	AJUSTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
	VENCIMENTO: "bg-orange-100 text-orange-800 border-orange-200",
	PERDA: "bg-red-100 text-red-800 border-red-200",
	DESPERDICIO: "bg-red-100 text-red-800 border-red-200",
}

const movementTypeLabels = {
	ENTRADA: "Entrada",
	SAIDA: "Saída",
	AJUSTE: "Ajuste",
	VENCIMENTO: "Vencimento",
	PERDA: "Perda",
	DESPERDICIO: "Desperdício",
}

export function StockHistory({
	productId,
	stockItemId,
	productName,
	onPageChange,
	currentPage = 1,
}: StockHistoryProps) {
	const [filters, setFilters] = useState({
		type: "all",
		startDate: "",
		endDate: "",
		limit: 6,
	})

	// Build URLSearchParams for the history query
	const historyParams = new URLSearchParams({
		...(productId && { productId }),
		...(stockItemId && { stockItemId }),
		...(filters.type !== "all" && { type: filters.type }),
		...(filters.startDate && { startDate: filters.startDate }),
		...(filters.endDate && { endDate: filters.endDate }),
		page: currentPage.toString(),
		limit: filters.limit.toString(),
	})

	const { data: historyData, isLoading, error } = useStockHistoryQuery(historyParams)

	const getMovementIcon = (type: string) => {
		switch (type) {
			case "ENTRADA":
				return <TrendingUp className="size-4" />
			case "SAIDA":
				return <TrendingDown className="size-4" />
			case "AJUSTE":
				return <ArrowUpDown className="size-4" />
			case "VENCIMENTO":
				return <Calendar className="size-4" />
			case "PERDA":
				return <AlertTriangle className="size-4" />
			case "DESPERDICIO":
				return <Trash2 className="size-4" />
			default:
				return <Package className="size-4" />
		}
	}

	const _formatQuantity = (quantity: number, unit: string) => {
		return `${quantity} ${unit}`
	}

	const exportHistory = async () => {
		try {
			const params = new URLSearchParams({
				...(productId && { productId }),
				...(stockItemId && { stockItemId }),
				...(filters.type !== "all" && { type: filters.type }),
				...(filters.startDate && { startDate: filters.startDate }),
				...(filters.endDate && { endDate: filters.endDate }),
				export: "csv",
			})

			window.open(`/api/stock/history?${params}`, "_blank")
		} catch (error) {
			console.error("Erro ao exportar histórico:", error)
		}
	}

	const historyRecords = historyData?.historyRecords || []
	const stats = historyData?.stats

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-2 mb-6">
				<History className="size-5" />
				<h2 className="text-2xl font-bold">Histórico de Movimentações</h2>
				{productName && <span className="text-lg text-gray-600">- {productName}</span>}
			</div>

			{/* Filtros */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
				<div className="space-y-2">
					<Label>Tipo de Movimento</Label>
					<Select
						value={filters.type}
						onValueChange={(value) => {
							setFilters((prev) => ({ ...prev, type: value }))
							onPageChange?.(1)
						}}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Todos</SelectItem>
							<SelectItem value="ENTRADA">Entrada</SelectItem>
							<SelectItem value="SAIDA">Saída</SelectItem>
							<SelectItem value="AJUSTE">Ajuste</SelectItem>
							<SelectItem value="VENCIMENTO">Vencimento</SelectItem>
							<SelectItem value="PERDA">Perda</SelectItem>
							<SelectItem value="DESPERDICIO">Desperdício</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<DateInput
					label="Data Inicial"
					value={filters.startDate}
					onChange={(value) => {
						setFilters((prev) => ({ ...prev, startDate: value }))
						onPageChange?.(1)
					}}
				/>

				<DateInput
					label="Data Final"
					value={filters.endDate}
					onChange={(value) => {
						setFilters((prev) => ({ ...prev, endDate: value }))
						onPageChange?.(1)
					}}
				/>

				<div className="flex items-end gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							setFilters({
								type: "all",
								startDate: "",
								endDate: "",
								limit: 20,
							})
							onPageChange?.(1)
						}}
					>
						<Filter className="size-4 mr-1" />
						Limpar
					</Button>
					<Button variant="outline" size="sm" onClick={exportHistory}>
						<Download className="size-4 mr-1" />
						Exportar
					</Button>
				</div>
			</div>

			{/* Estatísticas */}
			{stats && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">Total de Movimentos</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalMovements}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">Quantidade Total</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.totalQuantity.toFixed(1)}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">Valor Total</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">R$ {stats.totalValue.toFixed(2)}</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm text-gray-600">Produtos Únicos</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stats.topProducts.length}</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Grid de Movimentos */}
			<div className="flex-1 overflow-auto">
				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }, (_, i) => (
							<Card key={`history-skeleton-${Date.now()}-${i}`} className="h-48">
								<CardContent className="p-4 h-full">
									<div className="flex flex-col gap-3 h-full">
										<div className="flex items-center gap-3">
											<Skeleton className="size-10 rounded-lg" />
											<div className="space-y-2 flex-1">
												<Skeleton className="h-4 w-3/4" />
												<Skeleton className="h-3 w-1/2" />
											</div>
										</div>
										<div className="space-y-2 flex-1">
											<Skeleton className="h-3 w-full" />
											<Skeleton className="h-3 w-2/3" />
											<Skeleton className="h-3 w-1/2" />
										</div>
										<div className="flex justify-between items-end">
											<Skeleton className="h-3 w-20" />
											<Skeleton className="h-4 w-16" />
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : error ? (
					<Card>
						<CardContent className="p-12 text-center">
							<div className="text-red-400 mb-4">
								<AlertTriangle className="size-12 mx-auto" />
							</div>
							<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar histórico</h3>
							<p className="text-red-500">Tente novamente mais tarde.</p>
						</CardContent>
					</Card>
				) : historyRecords.length === 0 ? (
					<Card>
						<CardContent className="p-12 text-center">
							<div className="text-gray-400 mb-4">
								<History className="size-12 mx-auto" />
							</div>
							<h3 className="text-lg font-medium mb-2 text-gray-600">Nenhum movimento encontrado</h3>
							<p className="text-gray-500">Não há movimentações para os filtros selecionados.</p>
						</CardContent>
					</Card>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{historyRecords.map((movement: MovementRecord) => (
							<Card
								key={movement.id}
								className={`h-56 transition-all hover:shadow-md ${
									movement.type === "DESPERDICIO"
										? "border-red-200 bg-red-50/50 hover:bg-red-50"
										: movement.type === "VENCIMENTO"
											? "border-orange-200 bg-orange-50/50 hover:bg-orange-50"
											: "hover:bg-gray-50"
								}`}
							>
								<CardContent className="p-4 h-full flex flex-col">
									<div className="flex items-start gap-3 mb-3">
										<div
											className={`p-2 rounded-lg ${
												movement.type === "DESPERDICIO"
													? "bg-red-100 text-red-600"
													: movement.type === "VENCIMENTO"
														? "bg-orange-100 text-orange-600"
														: movement.type === "ENTRADA"
															? "bg-green-100 text-green-600"
															: movement.type === "SAIDA"
																? "bg-blue-100 text-blue-600"
																: "bg-gray-100 text-gray-600"
											}`}
										>
											{getMovementIcon(movement.type)}
										</div>
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<Badge
													className={`text-xs ${movementTypeColors[movement.type as keyof typeof movementTypeColors]}`}
												>
													{movementTypeLabels[movement.type as keyof typeof movementTypeLabels]}
												</Badge>
											</div>
											<div className="text-sm font-semibold text-gray-900 truncate">
												{movement.stockItem.product.name}
											</div>
											{movement.stockItem.product.brand && (
												<div className="text-xs text-gray-500 truncate">{movement.stockItem.product.brand.name}</div>
											)}
										</div>
									</div>

									<div className="flex-1 space-y-2">
										<div className="flex items-center justify-between">
											<span className="text-sm font-medium text-gray-700">
												{movement.quantity} {movement.stockItem.product.unit}
											</span>
											<span className="text-xs text-gray-500">{movement.stockItem.location}</span>
										</div>

										{movement.reason && (
											<div className="text-xs text-gray-600 bg-gray-100 p-2 rounded-sm">{movement.reason}</div>
										)}
										{movement.isWaste && movement.recordType === "waste" && (
											<div className="text-xs text-red-600 bg-red-100 p-2 rounded-sm">
												<strong>Motivo:</strong> {movement.reason}
											</div>
										)}
										{movement.notes && (
											<div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-sm">{movement.notes}</div>
										)}
									</div>

									<div className="mt-auto pt-2 border-t border-gray-100">
										<div className="text-xs text-gray-500 text-center">
											{format(new Date(movement.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>

			{/* Paginação */}
			{historyData?.pagination && historyData.pagination.totalPages > 1 && (
				<div className="flex items-center justify-center gap-2 mt-6">
					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1}
					>
						Anterior
					</Button>

					<div className="flex items-center gap-1">
						{Array.from({ length: Math.min(5, historyData.pagination.totalPages) }, (_, i) => {
							const startPage = Math.max(1, currentPage - 2)
							const page = startPage + i
							if (page > historyData.pagination.totalPages) return null

							return (
								<Button
									key={page}
									variant={currentPage === page ? "default" : "outline"}
									size="sm"
									onClick={() => onPageChange?.(page)}
									className="size-8 p-0"
								>
									{page}
								</Button>
							)
						})}
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={() => onPageChange?.(Math.min(historyData.pagination.totalPages, currentPage + 1))}
						disabled={currentPage === historyData.pagination.totalPages}
					>
						Próximo
					</Button>
				</div>
			)}
		</div>
	)
}
