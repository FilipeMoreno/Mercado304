"use client"

import { format, startOfMonth, subDays } from "date-fns"
import { motion } from "framer-motion"
import {
	ChevronLeft,
	ChevronRight, Filter, Plus,
	Search,
	ShoppingCart, Trash2
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useEffect, useId, useMemo, useState } from "react"
import { PurchaseCardMemo } from "@/components/memoized"
import { MissingNutritionalInfoDialog } from "@/components/missing-nutritional-info-dialog"
import { PurchaseDetailsDialog } from "@/components/purchases/purchase-details-dialog"
import { PurchasesSkeleton } from "@/components/skeletons/purchases-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DateInput } from "@/components/ui/date-input"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { FilterPopover } from "@/components/ui/filter-popover"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// removed unused imports
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
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
	const [showNutritionalDialog, setShowNutritionalDialog] = useState(false)
	const [productsWithoutNutrition, setProductsWithoutNutrition] = useState<
		Array<{ productId: string; productName: string }>
	>([])
	const [searchValue, setSearchValue] = useState(searchParams.search || "")
	const itemsPerPage = 12

	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Purchase>()

	const { state, updateState, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/compras",
		initialValues: {
			search: "",
			market: "all",
			sort: "date-desc",
			period: "all",
			dateFrom: "",
			dateTo: "",
			page: 1,
		},
	})

	// Referência estável para o state atual
	const stateRef = React.useRef(state)
	stateRef.current = state

	// Sincronizar searchValue com mudanças no state.search
	React.useEffect(() => {
		setSearchValue(String(state.search))
	}, [state.search])

	// Debounce da busca
	React.useEffect(() => {
		const timer = setTimeout(() => {
			if (searchValue !== state.search) {
				const currentState = stateRef.current
				const newState = {
					...currentState,
					search: searchValue,
					page: 1,
				}
				updateState(newState)
			}
		}, 500)

		return () => clearTimeout(timer)
	}, [searchValue, state.search, updateState])

	// Build URLSearchParams for the queries
	const purchaseParams = useMemo(() => {
		const params: Record<string, string> = {
			page: String(state.page),
			limit: itemsPerPage.toString(),
		}

		// Adicionar apenas parâmetros com valores válidos
		if (state.search && state.search !== "undefined") {
			params.search = String(state.search)
		}
		if (state.market && state.market !== "all" && state.market !== "undefined") {
			params.marketId = String(state.market)
		}
		if (state.sort && state.sort !== "undefined") {
			params.sort = String(state.sort)
		}
		if (state.dateFrom && state.dateFrom !== "undefined" && state.dateFrom !== "") {
			params.dateFrom = String(state.dateFrom)
		}
		if (state.dateTo && state.dateTo !== "undefined" && state.dateTo !== "") {
			params.dateTo = String(state.dateTo)
		}

		return new URLSearchParams(params)
	}, [state.search, state.market, state.sort, state.dateFrom, state.dateTo, state.page])

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

	// Verificar se há produtos sem informações nutricionais no sessionStorage
	useEffect(() => {
		const stored = sessionStorage.getItem("productsWithoutNutrition")
		if (stored) {
			try {
				const products = JSON.parse(stored)
				if (products && products.length > 0) {
					setProductsWithoutNutrition(products)
					setShowNutritionalDialog(true)
					// Limpar do sessionStorage para não mostrar novamente
					sessionStorage.removeItem("productsWithoutNutrition")
				}
			} catch (error) {
				console.error("Erro ao processar produtos sem informações nutricionais:", error)
			}
		}
	}, [])

	const handleNutritionalDialogClose = () => {
		setShowNutritionalDialog(false)
	}

	const handleAddNutritionalInfo = (productIds: string[]) => {
		// Abrir a primeira página de produto para adicionar informações nutricionais
		if (productIds.length > 0) {
			const firstProductId = productIds[0]
			const queryParams = new URLSearchParams()
			queryParams.set("focusNutrition", "true")
			// Abrir no mesmo tab para múltiplos produtos
			router.push(`/produtos/${firstProductId}/editar?${queryParams.toString()}`)
		}
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
					<DateInput
						id={`dateFrom-${id}`}
						label="De"
						value={state.dateFrom as string}
						onChange={(value) => updateSingleValue("dateFrom", value)}
					/>
					<DateInput
						id={`dateTo-${id}`}
						label="Até"
						value={state.dateTo as string}
						onChange={(value) => updateSingleValue("dateTo", value)}
					/>
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
						value={searchValue}
						onChange={(e) => setSearchValue(e.target.value)}
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
						<div className="flex justify-between items-center text-sm text-gray-600 mb-4">
							<span>
								Mostrando {purchases.length} de {totalCount} compras
							</span>
							<span>
								Página {state.page} de {totalPages}
							</span>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
							{purchases.map((purchase: any, index: number) => (
								<motion.div
									key={purchase.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.03, duration: 0.3 }}
								>
									<PurchaseCardMemo
										purchase={purchase}
										onDelete={openDeleteConfirm}
										onEdit={() => router.push(`/compras/editar/${purchase.id}`)}
										onView={viewPurchaseDetails}
									/>
								</motion.div>
							))}
						</div>

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

			<PurchaseDetailsDialog
				purchase={purchaseDetails || viewingPurchase}
				isOpen={!!viewingPurchase}
				onClose={() => setViewingPurchase(null)}
				isLoading={detailsLoading}
			/>

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

			<MissingNutritionalInfoDialog
				isOpen={showNutritionalDialog}
				onClose={handleNutritionalDialogClose}
				onAddNutritionalInfo={handleAddNutritionalInfo}
				productsWithoutNutrition={productsWithoutNutrition}
			/>

			<FloatingActionButton
				onClick={() => router.push("/compras/nova")}
				icon={ShoppingCart}
				label="Nova Compra"
			/>
		</>
	)
}
