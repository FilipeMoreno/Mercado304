"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, Search, Store, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { MarketCardMemo } from "@/components/memoized"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
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
	const router = useRouter()
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
					<Store className="size-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar mercados</h3>
					<p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os dados. Tente recarregar a página.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<>
			{/* Header with search and create button */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center gap-2 mb-6"
			>
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
					<Input placeholder="Buscar mercados..." value={searchValue} onChange={handleSearchChange} className="pl-10" />
				</div>
				<div className="flex items-center gap-2">
					<FilterPopover
						sortValue={state.sort as string}
						onSortChange={(value) => updateSingleValue("sort", value)}
						sortOptions={sortOptions}
						hasActiveFilters={hasActiveFilters}
						onClearFilters={clearFilters}
					/>
					<Button onClick={() => router.push("/mercados/novo")} className="bg-green-600 hover:bg-green-700 text-white">
						<Plus className="size-4 mr-2" />
						<span className="hidden sm:inline">Novo Mercado</span>
						<span className="sm:hidden">Novo</span>
					</Button>
				</div>
			</motion.div>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
				<OptimizedLoading isLoading={isLoading} skeletonType="market" skeletonCount={6}>
					{markets.length === 0 ? (
						state.search || state.sort !== "name-asc" ? (
							<Empty className="border border-dashed py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<Store className="size-6" />
									</EmptyMedia>
									<EmptyTitle>Nenhum mercado encontrado</EmptyTitle>
									<EmptyDescription>Nenhum mercado corresponde aos filtros aplicados</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Button
										variant="outline"
										onClick={() => {
											setSearchValue("")
											clearFilters()
											updateSingleValue("page", 1)
										}}
									>
										Limpar Filtros
									</Button>
								</EmptyContent>
							</Empty>
						) : (
							<Empty className="border border-dashed py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<Store className="size-6" />
									</EmptyMedia>
									<EmptyTitle>Nenhum mercado cadastrado</EmptyTitle>
									<EmptyDescription>Comece adicionando seu primeiro mercado</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Link href="/mercados/novo">
										<Button>
											<Plus className="mr-2 size-4" />
											Cadastrar Primeiro Mercado
										</Button>
									</Link>
								</EmptyContent>
							</Empty>
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
							<motion.div
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.2 }}
							>
								{markets.map((market: any, index: number) => (
									<motion.div
										key={market.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<MarketCardMemo 
											market={market} 
											onDelete={openDeleteConfirm} 
											onEdit={(market) => router.push(`/mercados/${market.id}/editar`)}
										/>
									</motion.div>
								))}
							</motion.div>

							{totalPages > 1 && (
								<div className="flex justify-center items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handlePageChange((state.page as number) - 1)}
										disabled={state.page === 1}
									>
										<ChevronLeft className="size-4" />
										Anterior
									</Button>

									<div className="flex gap-1">
										{Array.from({ length: totalPages }, (_, i) => i + 1)
											.filter(
												(page) => page === 1 || page === totalPages || Math.abs(page - (state.page as number)) <= 2,
											)
											.map((page, index, array) => (
												<React.Fragment key={page}>
													{index > 0 && array[index - 1] !== page - 1 && (
														<span className="px-2 py-1 text-gray-400">...</span>
													)}
													<Button
														variant={state.page === page ? "default" : "outline"}
														size="sm"
														onClick={() => handlePageChange(page)}
														className="size-8 p-0"
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
										<ChevronRight className="size-4" />
									</Button>
								</div>
							)}
						</>
					)}
				</OptimizedLoading>
			</motion.div>

			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				description="Esta ação não pode ser desfeita"
				onConfirm={deleteMarket}
				onCancel={closeDeleteConfirm}
				confirmText={deleteMarketMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteMarketMutation.isPending}
				icon={<Trash2 className="size-8 text-red-500" />}
			>
				<p className="text-lg font-medium">
					Tem certeza que deseja excluir o mercado <strong>{deleteState.item?.name}</strong>?
				</p>
				<p className="text-sm text-gray-600 mt-2">Todas as compras relacionadas a este mercado serão afetadas.</p>
			</ResponsiveConfirmDialog>
		</>
	)
}
