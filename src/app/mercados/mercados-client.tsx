"use client"

import { BarChart3, ChevronLeft, ChevronRight, Edit, MapPin, Plus, Search, Store, Trash2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDeleteConfirmation, useDeleteMarketMutation, useMarketsQuery, useUrlState } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Market } from "@/types"

interface MercadosClientProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export function MercadosClient({ searchParams }: MercadosClientProps) {
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Market>()
	const [searchValue, setSearchValue] = useState(searchParams.search || "")
	const debouncedSearch = useDebounce(searchValue, 500)

	const { state, updateState, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/mercados",
		// CORREÇÃO: initialValues devem ser SEMPRE os valores padrão, não os searchParams atuais
		initialValues: {
			search: "",
			sort: "name-asc",
			page: 1,
		},
	})

	// Referência estável para o state atual
	const stateRef = React.useRef(state)
	stateRef.current = state

	// Sincronizar searchValue com mudanças no state.search (navegação, etc.)
	React.useEffect(() => {
		setSearchValue(String(state.search))
	}, [state.search])

	// Atualizar a URL quando o debounce terminar - com melhor preservação de estado
	React.useEffect(() => {
		if (debouncedSearch !== state.search) {
			// Usar uma versão mais robusta que preserva explicitamente todos os filtros
			const currentState = stateRef.current
			const newState = {
				...currentState,
				search: debouncedSearch,
				page: 1, // Reset page quando mudar search
			}

			// Usar updateState ao invés de updateSingleValue para ter mais controle
			updateState(newState)
		}
	}, [debouncedSearch, state.search, updateState])

	// Handler otimizado para mudanças no campo de busca
	const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value)
	}, [])

	// Build URLSearchParams for the query
	const params = useMemo(() => {
		const urlParams = new URLSearchParams({
			search: String(state.search),
			sort: String(state.sort),
			page: String(state.page),
			limit: "12",
		})
		return urlParams
	}, [state.search, state.sort, state.page])

	// React Query hooks
	const { data: marketsData, isLoading, error } = useMarketsQuery(params)
	const deleteMarketMutation = useDeleteMarketMutation()

	const sortOptions = [
		{ value: "name-asc", label: "Nome (A-Z)" },
		{ value: "name-desc", label: "Nome (Z-A)" },
		{ value: "location-asc", label: "Localização (A-Z)" },
		{ value: "date-desc", label: "Mais recente" },
		{ value: "date-asc", label: "Mais antigo" },
	]

	const deleteMarket = async () => {
		if (!deleteState.item) return

		try {
			await deleteMarketMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting market:", error)
		}
	}

	// Extract data from React Query
	const markets = marketsData?.markets || []
	const totalCount = marketsData?.totalCount || 0
	const itemsPerPage = 12
	const totalPages = Math.ceil(totalCount / itemsPerPage)

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			updateSingleValue("page", page)
		}
	}

	// Handle error states
	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<Store className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar mercados</h3>
					<p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os dados. Tente recarregar a página.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<>
			<div className="flex items-center gap-2 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input placeholder="Buscar mercados..." value={searchValue} onChange={handleSearchChange} className="pl-10" />
				</div>
				<FilterPopover
					sortValue={state.sort as string}
					onSortChange={(value) => updateSingleValue("sort", value)}
					sortOptions={sortOptions}
					hasActiveFilters={hasActiveFilters}
					onClearFilters={clearFilters}
				/>
			</div>

			<div className="space-y-4">
				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<div className="flex items-center gap-2">
										<Skeleton className="h-5 w-5" />
										<Skeleton className="h-6 w-32" />
									</div>
									<div className="flex items-center gap-1 mt-2">
										<Skeleton className="h-3 w-3" />
										<Skeleton className="h-4 w-24" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex gap-2">
										<Skeleton className="h-8 w-20" />
										<Skeleton className="h-8 w-8" />
										<Skeleton className="h-8 w-8" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : markets.length === 0 ? (
					state.search || state.sort !== "name-asc" ? (
						<Card>
							<CardContent className="text-center py-12">
								<Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">Nenhum mercado encontrado</h3>
								<p className="text-gray-600 mb-4">Nenhum mercado corresponde aos filtros aplicados</p>
								<Button
									variant="outline"
									onClick={() => {
										setSearchValue("") // Reset o input local
										clearFilters()
										updateSingleValue("page", 1)
									}}
								>
									Limpar Filtros
								</Button>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardContent className="text-center py-12">
								<Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">Nenhum mercado cadastrado</h3>
								<p className="text-gray-600 mb-4">Comece adicionando seu primeiro mercado</p>
								<Link href="/mercados/novo">
									<Button>
										<Plus className="mr-2 h-4 w-4" />
										Cadastrar Primeiro Mercado
									</Button>
								</Link>
							</CardContent>
						</Card>
					)
				) : (
					<>
						<div className="flex justify-between items-center text-sm text-gray-600">
							<span>
								Mostrando {markets.length} de {totalCount} mercados
							</span>
							<span>
								Página {state.page} de {totalPages}
							</span>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{markets.map((market: any) => (
								<Card
									key={market.id}
									className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md hover:shadow-xl"
								>
									<CardHeader className="pb-3">
										<div className="flex items-center gap-3 mb-2">
											<div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shadow-sm">
												<Store className="h-6 w-6 text-purple-600" />
											</div>
											<div className="flex-1 min-w-0">
												<CardTitle className="text-lg font-semibold text-gray-900 truncate">{market.name}</CardTitle>
												<CardDescription className="flex items-center gap-1 mt-1 text-sm text-gray-600">
													<MapPin className="h-4 w-4 flex-shrink-0" />
													<span className="truncate">{market.location}</span>
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
											<Link href={`/mercados/${market.id}`} className="flex-1">
												<Button variant="outline" size="sm" className="w-full justify-center">
													<BarChart3 className="h-4 w-4 mr-1" />
													Ver
												</Button>
											</Link>
											<Link href={`/mercados/${market.id}/editar`}>
												<Button variant="outline" size="sm" className="w-10 h-8 p-0">
													<Edit className="h-4 w-4" />
												</Button>
											</Link>
											<Button
												variant="outline"
												size="sm"
												onClick={() => openDeleteConfirm(market)}
												className="w-10 h-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{totalPages > 1 && (
							<div className="flex justify-center items-center gap-2">
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
			</div>

			<Dialog open={deleteState.show} onOpenChange={(open) => !open && closeDeleteConfirm()}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-red-500" />
							Confirmar Exclusão
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p>
							Tem certeza que deseja excluir o mercado <strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita e todas as compras relacionadas a este mercado serão afetadas.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={deleteMarket}
								disabled={deleteMarketMutation.isPending}
								className="flex-1"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{deleteMarketMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
							</Button>
							<Button variant="outline" onClick={closeDeleteConfirm}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}
