"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Factory, Plus, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useCallback, useId, useMemo, useState } from "react"
import { BrandCardMemo } from "@/components/memoized"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
import {
	useBrandsQuery,
	useDeleteBrandMutation,
	useDeleteConfirmation,
	useUpdateBrandMutation,
	useUrlState,
} from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Brand } from "@/types"

interface MarcasClientProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export function MarcasClient({ searchParams }: MarcasClientProps) {
	const router = useRouter()
	const id = useId()
	const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
	const [editForm, setEditForm] = useState({ name: "" })
	const [searchValue, setSearchValue] = useState(searchParams.search || "")
	const debouncedSearch = useDebounce(searchValue, 500)

	// URL state management
	const { state, updateState, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/marcas",
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
	const { data: brandsData, isLoading, error } = useBrandsQuery(params)
	const updateBrandMutation = useUpdateBrandMutation()
	const deleteBrandMutation = useDeleteBrandMutation()

	// Delete confirmation hook
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Brand>()

	// Extract data from React Query
	const brands = brandsData?.brands || []
	const totalCount = brandsData?.pagination?.totalCount || 0
	const itemsPerPage = 12
	const totalPages = brandsData?.pagination?.totalPages || Math.ceil(totalCount / itemsPerPage)

	const sortOptions = [
		{ value: "name-asc", label: "Nome (A-Z)" },
		{ value: "name-desc", label: "Nome (Z-A)" },
		{ value: "products-desc", label: "Mais produtos" },
		{ value: "products-asc", label: "Menos produtos" },
		{ value: "date-desc", label: "Mais recente" },
		{ value: "date-asc", label: "Mais antigo" },
	]

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			updateSingleValue("page", page)
		}
	}

	const handleUpdateBrand = async () => {
		if (!editingBrand) return

		try {
			await updateBrandMutation.mutateAsync({
				id: editingBrand.id,
				data: {
					name: editForm.name,
				},
			})
			setEditingBrand(null)
			setEditForm({ name: "" })
		} catch (error) {
			console.error("Error updating brand:", error)
		}
	}

	const handleDeleteBrand = async () => {
		if (!deleteState.item) return

		try {
			await deleteBrandMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting brand:", error)
		}
	}

	// Handle error states
	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<Factory className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar marcas</h3>
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
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input placeholder="Buscar marcas..." value={searchValue} onChange={handleSearchChange} className="pl-10" />
				</div>
				<div className="flex items-center gap-2">
					<FilterPopover
						sortValue={String(state.sort)}
						onSortChange={(value) => updateSingleValue("sort", value)}
						sortOptions={sortOptions}
						hasActiveFilters={hasActiveFilters}
						onClearFilters={clearFilters}
					/>
					<Button onClick={() => router.push("/marcas/nova")} className="bg-green-600 hover:bg-green-700 text-white">
						<Plus className="h-4 w-4 mr-2" />
						<span className="hidden sm:inline">Nova Marca</span>
						<span className="sm:hidden">Nova</span>
					</Button>
				</div>
			</motion.div>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
				<OptimizedLoading isLoading={isLoading} skeletonType="brand" skeletonCount={6}>
					{brands.length === 0 ? (
						state.search || state.sort !== "name-asc" ? (
							<Empty className="border border-dashed py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<Factory className="h-6 w-6" />
									</EmptyMedia>
									<EmptyTitle>Nenhuma marca encontrada</EmptyTitle>
									<EmptyDescription>Nenhuma marca corresponde aos filtros aplicados</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<div className="flex flex-col sm:flex-row gap-2">
										{state.search && (
											<Link href={`/marcas/nova?name=${encodeURIComponent(String(state.search))}`}>
												<Button>
													<Plus className="mr-2 h-4 w-4" />
													Cadastrar Marca "{state.search}"
												</Button>
											</Link>
										)}
										<Button
											variant="outline"
											onClick={() => {
												setSearchValue("") // Reset o input local
												clearFilters()
											}}
										>
											Limpar Filtros
										</Button>
									</div>
								</EmptyContent>
							</Empty>
						) : (
							<Empty className="border border-dashed py-12">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<Factory className="h-6 w-6" />
									</EmptyMedia>
									<EmptyTitle>Nenhuma marca cadastrada</EmptyTitle>
									<EmptyDescription>Comece adicionando sua primeira marca</EmptyDescription>
								</EmptyHeader>
								<EmptyContent>
									<Link href="/marcas/nova">
										<Button>
											<Plus className="mr-2 h-4 w-4" />
											Cadastrar Primeira Marca
										</Button>
									</Link>
								</EmptyContent>
							</Empty>
						)
					) : (
						<>
							<div className="flex justify-between items-center text-sm text-gray-600">
								<span>
									Mostrando {brands.length} de {totalCount} marcas
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
								{brands.map((brand: Brand, index: number) => (
									<motion.div
										key={brand.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<BrandCardMemo
											brand={brand}
											onDelete={openDeleteConfirm}
											onEdit={(brand) => router.push(`/marcas/${brand.id}/editar`)}
										/>
									</motion.div>
								))}
							</motion.div>

							{totalPages > 1 && (
								<div className="flex justify-center items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => handlePageChange(Number(state.page) - 1)}
										disabled={Number(state.page) === 1}
									>
										<ChevronLeft className="h-4 w-4" />
										Anterior
									</Button>

									<div className="flex gap-1">
										{Array.from({ length: totalPages }, (_, i) => i + 1)
											.filter((page) => page === 1 || page === totalPages || Math.abs(page - Number(state.page)) <= 2)
											.map((page, index, array) => (
												<React.Fragment key={page}>
													{index > 0 && array[index - 1] !== page - 1 && (
														<span className="px-2 py-1 text-gray-400">...</span>
													)}
													<Button
														variant={Number(state.page) === page ? "default" : "outline"}
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
										onClick={() => handlePageChange(Number(state.page) + 1)}
										disabled={Number(state.page) === totalPages}
									>
										Próxima
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							)}
						</>
					)}
				</OptimizedLoading>
			</motion.div>

			{/* Edit Dialog */}
			<ResponsiveFormDialog
				open={!!editingBrand}
				onOpenChange={(open) => !open && setEditingBrand(null)}
				title="Editar Marca"
				onSubmit={handleUpdateBrand}
				onCancel={() => setEditingBrand(null)}
				submitText={updateBrandMutation.isPending ? "Atualizando..." : "Atualizar"}
				isLoading={updateBrandMutation.isPending}
			>
				<div>
					<Label htmlFor={`edit-name-${id}`}>Nome</Label>
					<Input
						id={`edit-name-${id}`}
						value={editForm.name}
						onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
						placeholder="Nome da marca"
					/>
				</div>
			</ResponsiveFormDialog>

			{/* Delete Confirmation Dialog */}
			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				description="Esta ação não pode ser desfeita"
				onConfirm={handleDeleteBrand}
				onCancel={closeDeleteConfirm}
				confirmText={deleteBrandMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteBrandMutation.isPending}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<p className="text-lg font-medium">
					Tem certeza que deseja excluir a marca <strong>{deleteState.item?.name}</strong>?
				</p>
				<p className="text-sm text-gray-600 mt-2">Todos os produtos desta marca ficarão sem marca.</p>
			</ResponsiveConfirmDialog>
		</>
	)
}
