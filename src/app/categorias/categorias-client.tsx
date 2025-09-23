"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Plus, Search, Tag, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React, { useCallback, useMemo, useState } from "react"
import { CategoryCardMemo } from "@/components/memoized"
import { Button } from "@/components/ui/button"
import { Card, CardContent, } from "@/components/ui/card"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptimizedLoading } from "@/components/ui/optimized-loading"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
import { Switch } from "@/components/ui/switch"
import {
	useCategoriesQuery,
	useDeleteCategoryMutation,
	useDeleteConfirmation,
	useUpdateCategoryMutation,
	useUrlState,
} from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Category } from "@/types"

interface CategoriasClientProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export function CategoriasClient({ searchParams }: CategoriasClientProps) {
	const router = useRouter()
	const [editingCategory, setEditingCategory] = useState<Category | null>(null)
	const [editForm, setEditForm] = useState({ name: "", icon: "", color: "", isFood: false })
	const [searchValue, setSearchValue] = useState(searchParams.search || "")
	const debouncedSearch = useDebounce(searchValue, 500)

	// URL state management
	const { state, updateState, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/categorias",
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
	const { data: categoriesData, isLoading, error } = useCategoriesQuery(params)
	const updateCategoryMutation = useUpdateCategoryMutation()
	const deleteCategoryMutation = useDeleteCategoryMutation()

	// Delete confirmation hook
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Category>()

	// Extract data from React Query
	const categories = categoriesData?.categories || []
	const totalCount = categoriesData?.pagination?.totalCount || 0
	const itemsPerPage = 12
	const totalPages = Math.ceil(totalCount / itemsPerPage)

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

	const handleUpdateCategory = async () => {
		if (!editingCategory) return

		try {
			await updateCategoryMutation.mutateAsync({
				id: editingCategory.id,
				data: {
					name: editForm.name,
					icon: editForm.icon,
					color: editForm.color,
					isFood: editForm.isFood,
				},
			})
			setEditingCategory(null)
			setEditForm({ name: "", icon: "", color: "", isFood: false })
		} catch (error) {
			console.error("Error updating category:", error)
		}
	}

	const handleDeleteCategory = async () => {
		if (!deleteState.item) return

		try {
			await deleteCategoryMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting category:", error)
		}
	}

	const _startEdit = (category: Category) => {
		setEditingCategory(category)
		setEditForm({
			name: category.name,
			icon: category.icon || "",
			color: category.color || "",
			isFood: category.isFood || false,
		})
	}

	// Handle error states
	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<Tag className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar categorias</h3>
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
					<Input
						placeholder="Buscar categorias..."
						value={searchValue}
						onChange={handleSearchChange}
						className="pl-10"
					/>
				</div>
				<div className="flex items-center gap-2">
					<FilterPopover
						sortValue={String(state.sort)}
						onSortChange={(value) => updateSingleValue("sort", value)}
						sortOptions={sortOptions}
						hasActiveFilters={hasActiveFilters}
						onClearFilters={clearFilters}
					/>
					<Button
						onClick={() => router.push("/categorias/nova")}
						className="bg-green-600 hover:bg-green-700 text-white"
					>
						<Plus className="h-4 w-4 mr-2" />
						<span className="hidden sm:inline">Nova Categoria</span>
						<span className="sm:hidden">Nova</span>
					</Button>
				</div>
			</motion.div>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
				<OptimizedLoading isLoading={isLoading} skeletonType="category" skeletonCount={6}>
					{categories.length === 0 ? (
						state.search || state.sort !== "name-asc" ? (
							<Card>
								<CardContent className="text-center py-12">
									<Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
									<h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
									<p className="text-gray-600 mb-4">Nenhuma categoria corresponde aos filtros aplicados</p>
									<Button
										variant="outline"
										onClick={() => {
											setSearchValue("") // Reset o input local
											clearFilters()
										}}
									>
										Limpar Filtros
									</Button>
								</CardContent>
							</Card>
						) : (
							<Card>
								<CardContent className="text-center py-12">
									<Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
									<h3 className="text-lg font-medium mb-2">Nenhuma categoria cadastrada</h3>
									<p className="text-gray-600 mb-4">Comece adicionando sua primeira categoria</p>
									<Link href="/categorias/nova">
										<Button>
											<Plus className="mr-2 h-4 w-4" />
											Cadastrar Primeira Categoria
										</Button>
									</Link>
								</CardContent>
							</Card>
						)
					) : (
						<>
							<div className="flex justify-between items-center text-sm text-gray-600">
								<span>
									Mostrando {categories.length} de {totalCount} categorias
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
								{categories.map((category: any, index: number) => (
									<motion.div
										key={category.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<CategoryCardMemo category={category} onDelete={openDeleteConfirm} />
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
				open={!!editingCategory}
				onOpenChange={(open) => !open && setEditingCategory(null)}
				title="Editar Categoria"
				onSubmit={handleUpdateCategory}
				onCancel={() => setEditingCategory(null)}
				submitText={updateCategoryMutation.isPending ? "Atualizando..." : "Atualizar"}
				isLoading={updateCategoryMutation.isPending}
			>
				<div>
					<Label htmlFor="edit-name">Nome</Label>
					<Input
						id="edit-name"
						value={editForm.name}
						onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
						placeholder="Nome da categoria"
					/>
				</div>
				<div>
					<Label htmlFor="edit-icon">Ícone</Label>
					<Input
						id="edit-icon"
						value={editForm.icon}
						onChange={(e) => setEditForm((prev) => ({ ...prev, icon: e.target.value }))}
						placeholder="📦"
					/>
				</div>
				<div>
					<Label htmlFor="edit-color">Cor</Label>
					<Input
						id="edit-color"
						type="color"
						value={editForm.color}
						onChange={(e) => setEditForm((prev) => ({ ...prev, color: e.target.value }))}
					/>
				</div>
				<div className="flex items-center space-x-2">
					<Switch
						id="edit-isFood"
						checked={editForm.isFood}
						onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, isFood: checked }))}
					/>
					<Label htmlFor="edit-isFood">É um alimento?</Label>
				</div>
			</ResponsiveFormDialog>

			{/* Delete Confirmation Dialog */}
			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				description="Esta ação não pode ser desfeita"
				onConfirm={handleDeleteCategory}
				onCancel={closeDeleteConfirm}
				confirmText={deleteCategoryMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteCategoryMutation.isPending}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<p className="text-lg font-medium">
					Tem certeza que deseja excluir a categoria <strong>{deleteState.item?.name}</strong>?
				</p>
				<p className="text-sm text-gray-600 mt-2">Todos os produtos desta categoria ficarão sem categoria.</p>
			</ResponsiveConfirmDialog>
		</>
	)
}
