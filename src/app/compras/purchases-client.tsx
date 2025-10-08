"use client"

import { format, startOfMonth, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { motion } from "framer-motion"
import {
	Calendar,
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	Filter,
	Plus,
	Search,
	ShoppingCart,
	Store,
	Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useId, useMemo, useState } from "react"
import { PurchasesSkeleton } from "@/components/skeletons/purchases-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// removed unused imports
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	useDeleteConfirmation,
	useDeletePurchaseMutation,
	useMarketsQuery,
	usePurchaseQuery,
	usePurchasesQuery,
	useUrlState,
} from "@/hooks"
// removed unused imports
import { formatLocalDate } from "@/lib/date-utils"
import type { Purchase } from "@/types"

interface PurchasesClientProps {
	searchParams: {
		search?: string
		market?: string
		sort?: string
		period?: string
		dateFrom?: string
		dateTo?: string
		page?: string
	}
}

export function PurchasesClient({ searchParams }: PurchasesClientProps) {
	const router = useRouter()
	const id = useId()
	const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)
	const itemsPerPage = 12

	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Purchase>()

	const { state, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/compras",
		initialValues: {
			search: searchParams.search || "",
			market: searchParams.market || "all",
			sort: searchParams.sort || "date-desc",
			period: searchParams.period || "all",
			dateFrom: searchParams.dateFrom || "",
			dateTo: searchParams.dateTo || "",
			page: parseInt(searchParams.page || "1", 10),
		},
	})

	// Build URLSearchParams for the queries
	const purchaseParams = useMemo(() => {
		const params: Record<string, string> = {
			search: String(state.search),
			market: String(state.market),
			sort: String(state.sort),
			period: String(state.period),
			dateFrom: String(state.dateFrom),
			dateTo: String(state.dateTo),
			page: String(state.page),
			limit: itemsPerPage.toString(),
		}
		return new URLSearchParams(params)
	}, [state.search, state.market, state.sort, state.period, state.dateFrom, state.dateTo, state.page])

	// React Query hooks
	const { data: purchasesData, isLoading: purchasesLoading, error: purchasesError } = usePurchasesQuery(purchaseParams)
	const { data: marketsData, isLoading: marketsLoading } = useMarketsQuery()
	const { data: purchaseDetails, isLoading: detailsLoading } = usePurchaseQuery(viewingPurchase?.id || "", {
		enabled: !!viewingPurchase?.id,
	})
	const deletePurchaseMutation = useDeletePurchaseMutation()

	// Extract data from React Query
	const purchases = purchasesData?.purchases || []
	const totalCount = purchasesData?.totalCount || 0
	const markets = marketsData?.markets || []
	const totalPages = Math.ceil(totalCount / itemsPerPage)
	const _isLoading = purchasesLoading || marketsLoading
	_isLoading
	const sortOptions = [
		{ value: "date-desc", label: "Mais recente" },
		{ value: "date-asc", label: "Mais antigo" },
		{ value: "value-desc", label: "Valor (maior)" },
		{ value: "value-asc", label: "Valor (menor)" },
	]

	const marketOptions = useMemo(
		() => [
			{ value: "all", label: "Todos os mercados" },
			...(markets || []).map((market: any) => ({
				value: market.id,
				label: market.name,
			})),
		],
		[markets],
	)

	const handlePeriodChange = (value: string) => {
		updateSingleValue("period", value)
		if (value === "all") {
			updateSingleValue("dateFrom", "")
			updateSingleValue("dateTo", "")
		} else if (value === "last7") {
			updateSingleValue("dateFrom", format(subDays(new Date(), 7), "yyyy-MM-dd"))
			updateSingleValue("dateTo", format(new Date(), "yyyy-MM-dd"))
		} else if (value === "last30") {
			updateSingleValue("dateFrom", format(subDays(new Date(), 30), "yyyy-MM-dd"))
			updateSingleValue("dateTo", format(new Date(), "yyyy-MM-dd"))
		} else if (value === "currentMonth") {
			updateSingleValue("dateFrom", format(startOfMonth(new Date()), "yyyy-MM-dd"))
			updateSingleValue("dateTo", format(new Date(), "yyyy-MM-dd"))
		} else {
			updateSingleValue("dateFrom", "")
			updateSingleValue("dateTo", "")
		}
	}

	const deletePurchase = async () => {
		if (!deleteState.item) return

		try {
			await deletePurchaseMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting purchase:", error)
		}
	}

	const viewPurchaseDetails = async (purchase: Purchase) => {
		setViewingPurchase(purchase)
	}

	// React Query handles data synchronization automatically

	// Handle loading and error states
	if (purchasesLoading && purchases.length === 0) {
		return <PurchasesSkeleton />
	}

	if (purchasesError) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<ShoppingCart className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar compras</h3>
					<p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os dados. Tente recarregar a página.</p>
				</CardContent>
			</Card>
		)
	}

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			updateSingleValue("page", page)
		}
	}

	const additionalFilters = (
		<>
			<div className="space-y-2">
				<Label>Mercado</Label>
				<Select value={state.market as string} onValueChange={(value) => updateSingleValue("market", value)}>
					<SelectTrigger>
						<SelectValue placeholder="Todos os mercados" />
					</SelectTrigger>
					<SelectContent>
						{marketOptions.map((option: any) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<Label>Período</Label>
				<Select value={state.period as string} onValueChange={handlePeriodChange}>
					<SelectTrigger>
						<SelectValue placeholder="Selecione um período" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todo o histórico</SelectItem>
						<SelectItem value="last7">Últimos 7 dias</SelectItem>
						<SelectItem value="last30">Últimos 30 dias</SelectItem>
						<SelectItem value="currentMonth">Mês atual</SelectItem>
						<SelectItem value="custom">Intervalo personalizado</SelectItem>
					</SelectContent>
				</Select>
			</div>
			{(state.period === "custom" || (state.dateFrom && state.dateTo)) && (
				<div className="grid grid-cols-2 gap-2">
					<div className="space-y-2">
						<Label htmlFor={`dateFrom-${id}`}>De</Label>
						<Input
							type="date"
							id={`dateFrom-${id}`}
							value={state.dateFrom as string}
							onChange={(e) => updateSingleValue("dateFrom", e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor={`dateTo-${id}`}>Até</Label>
						<Input
							type="date"
							id={`dateTo-${id}`}
							value={state.dateTo as string}
							onChange={(e) => updateSingleValue("dateTo", e.target.value)}
						/>
					</div>
				</div>
			)}
		</>
	)

	return (
		<>
			{/* Header with search and create button */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center gap-2 mb-6"
			>
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Buscar produtos..."
						value={state.search as string}
						onChange={(e) => updateSingleValue("search", e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex items-center gap-2">
					<FilterPopover
						sortValue={state.sort as string}
						onSortChange={(value) => updateSingleValue("sort", value)}
						sortOptions={sortOptions}
						additionalFilters={additionalFilters}
						hasActiveFilters={hasActiveFilters}
						onClearFilters={() => {
							clearFilters()
							updateSingleValue("page", 1)
						}}
					/>
					<Button onClick={() => router.push("/compras/nova")} className="bg-green-600 hover:bg-green-700 text-white">
						<Plus className="h-4 w-4 mr-2" />
						<span className="hidden sm:inline">Nova Compra</span>
						<span className="sm:hidden">Nova</span>
					</Button>
				</div>
			</motion.div>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
				{purchases.length === 0 ? (
					<Empty className="border border-dashed py-12">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<ShoppingCart className="h-6 w-6" />
							</EmptyMedia>
							<EmptyTitle>{hasActiveFilters ? "Nenhuma compra encontrada" : "Nenhuma compra cadastrada"}</EmptyTitle>
							<EmptyDescription>
								{hasActiveFilters ? "Tente ajustar os filtros de busca" : "Comece adicionando sua primeira compra"}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<div className="flex items-center justify-center gap-2">
								{hasActiveFilters && (
									<Button
										variant="outline"
										onClick={() => {
											clearFilters()
											updateSingleValue("page", 1)
										}}
									>
										<Filter className="h-4 w-4 mr-2" />
										Limpar Filtros
									</Button>
								)}
								<Button
									onClick={() => router.push("/compras/nova")}
									className="bg-green-600 hover:bg-green-700 text-white"
								>
									<Plus className="h-4 w-4 mr-2" />
									Nova Compra
								</Button>
							</div>
						</EmptyContent>
					</Empty>
				) : (
					<>
						<div className="flex justify-between items-center text-sm text-gray-600">
							<span>
								Mostrando {purchases.length} de {totalCount} compras
							</span>
							<span>
								Página {state.page} de {totalPages}
							</span>
						</div>

						{purchases.map((purchase: any, index: number) => (
							<motion.div
								key={purchase.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
							>
								<Card>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="flex items-center gap-2">
													<ShoppingCart className="h-5 w-5" />
													Compra em {purchase.market?.name}
												</CardTitle>
												<CardDescription className="space-y-1 mt-2">
													<div className="flex items-center gap-1">
														<Store className="h-3 w-3" />
														{purchase.market?.location}
													</div>
													<div className="flex items-center gap-1">
														<Calendar className="h-3 w-3" />
														{formatLocalDate(purchase.purchaseDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
													</div>
												</CardDescription>
											</div>
											<div className="text-right">
												<div className="flex items-center gap-1 text-lg font-bold">
													R$ {purchase.totalAmount.toFixed(2)}
												</div>
												<div className="text-sm text-gray-500">{purchase.items?.length || 0} itens</div>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => viewPurchaseDetails(purchase)}>
												<Eye className="h-4 w-4 mr-1" />
												Detalhes
											</Button>
											<Link href={`/compras/editar/${purchase.id}`}>
												<Button variant="outline" size="sm">
													<Edit className="h-4 w-4" />
												</Button>
											</Link>
											<Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(purchase)}>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						))}

						{totalPages > 1 && (
							<div className="flex justify-center items-center gap-2 pt-6">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange((state.page as number) - 1)}
									disabled={state.page === 1}
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</Button>
								<div className="flex gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter((page) => page === 1 || page === totalPages || Math.abs(page - (state.page as number)) <= 2)
										.map((page, index, array) => (
											<React.Fragment key={page}>
												{index > 0 && array[index - 1] !== page - 1 && (
													<span className="px-2 py-1 text-gray-400">...</span>
												)}
												<Button
													variant={state.page === page ? "default" : "outline"}
													size="sm"
													onClick={() => handlePageChange(page)}
													className="w-8 h-8 p-0"
												>
													{page}
												</Button>
											</React.Fragment>
										))}
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange((state.page as number) + 1)}
									disabled={state.page === totalPages}
								>
									Próxima
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						)}
					</>
				)}
			</motion.div>

			<ResponsiveDialog
				open={!!viewingPurchase}
				onOpenChange={(open) => !open && setViewingPurchase(null)}
				title="Detalhes da Compra"
				maxWidth="2xl"
			>
				{detailsLoading ? (
					<div className="space-y-4">
						<div className="animate-pulse space-y-2">
							<div className="h-4 bg-gray-200 rounded w-3/4"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2"></div>
						</div>
					</div>
				) : purchaseDetails && !detailsLoading ? (
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4 pb-4 border-b">
							<div>
								<p className="text-sm text-gray-600">Mercado</p>
								<p className="font-medium">{purchaseDetails.market?.name}</p>
							</div>
							<div>
								<p className="text-sm text-gray-600">Data</p>
								<p className="font-medium">
									{formatLocalDate(purchaseDetails.purchaseDate, "dd/MM/yyyy", { locale: ptBR })}
								</p>
							</div>
						</div>

						<div>
							<h4 className="font-medium mb-3">Itens da Compra</h4>
							<div className="space-y-2 max-h-60 overflow-y-auto">
								{purchaseDetails.items?.map((item: any, index: number) => (
									<div key={item.id ?? `${index}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
										<div>
											<p className="font-medium">
												{item.product?.name || item.productName}
												{!item.product && <span className="text-red-500 text-xs ml-1">(produto removido)</span>}
											</p>
											<p className="text-sm text-gray-600">
												{item.quantity} {item.product?.unit || item.productUnit} × R$ {item.unitPrice.toFixed(2)}
											</p>
										</div>
										<p className="font-medium">R$ {item.totalPrice.toFixed(2)}</p>
									</div>
								))}
							</div>
						</div>

						<div className="flex justify-between items-center pt-4 border-t">
							<span className="text-lg font-bold">Total:</span>
							<span className="text-lg font-bold">R$ {purchaseDetails.totalAmount.toFixed(2)}</span>
						</div>
					</div>
				) : null}
			</ResponsiveDialog>

			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				description="Esta ação não pode ser desfeita"
				onConfirm={deletePurchase}
				onCancel={closeDeleteConfirm}
				confirmText={deletePurchaseMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deletePurchaseMutation.isPending}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<p className="text-lg font-medium">
					Tem certeza que deseja excluir esta compra de <strong>{deleteState.item?.market?.name}</strong>?
				</p>
				<p className="text-sm text-gray-600 mt-2">Todos os itens da compra serão perdidos permanentemente.</p>
			</ResponsiveConfirmDialog>
		</>
	)
}
