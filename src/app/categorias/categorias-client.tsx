"use client"

import { ArrowRight, ChevronLeft, ChevronRight, Edit, MoreHorizontal, Plus, Search, Tag, Trash2 } from "lucide-react"
import Link from "next/link"
import React, { useCallback, useMemo, useState } from "react"
import { CategoriesSkeleton } from "@/components/skeletons/categories-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
			<div className="flex items-center gap-2 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Buscar categorias..."
						value={searchValue}
						onChange={handleSearchChange}
						className="pl-10"
					/>
				</div>
				<FilterPopover
					sortValue={String(state.sort)}
					onSortChange={(value) => updateSingleValue("sort", value)}
					sortOptions={sortOptions}
					hasActiveFilters={hasActiveFilters}
					onClearFilters={clearFilters}
				/>
			</div>

			<div className="space-y-4">
				{isLoading ? (
					<CategoriesSkeleton />
				) : categories.length === 0 ? (
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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{categories.map((category: any) => (
								<Card
									key={category.id}
									className="group hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl flex flex-col"
								>
									<CardHeader className="pb-3">
										<div className="flex items-center gap-3 mb-2">
											{category.icon ? (
												<div
													className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm"
													style={{ backgroundColor: category.color ? `${category.color}20` : "#f3f4f6" }}
												>
													{category.icon}
												</div>
											) : (
												<div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm">
													<Tag className="h-5 w-5 text-gray-400" />
												</div>
											)}
											<div className="flex-1 min-w-0">
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<CardTitle className="text-lg font-semibold text-gray-900 truncate cursor-help">
																{category.name}
															</CardTitle>
														</TooltipTrigger>
														<TooltipContent side="top" className="max-w-xs">
															<p>{category.name}</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
												<div className="flex items-center gap-2 mt-1">
													<CardDescription className="text-sm text-gray-600">
														{category._count?.products || 0} produtos
													</CardDescription>
													{category.isFood && (
														<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
															Alimento
														</span>
													)}
												</div>
											</div>
										</div>
									</CardHeader>
									<CardContent className="flex-1" />
									<CardFooter className="pt-3 border-t border-gray-100 dark:border-gray-800">
										<div className="flex gap-2 w-full">
											<Link href={`/categorias/${category.id}`} className="flex-1">
												<Button variant="outline" className="w-full justify-center">
													<ArrowRight className="h-4 w-4 mr-2" />
													Ver Categoria
												</Button>
											</Link>
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button variant="outline" size="icon">
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem onClick={() => _startEdit(category)}>
														<Edit className="h-4 w-4 mr-2" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => openDeleteConfirm(category)}
														className="text-red-600 focus:text-red-600"
													>
														<Trash2 className="h-4 w-4 mr-2" />
														Excluir
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</CardFooter>
								</Card>
							))}
						</div>

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
			</div>

			{/* Edit Dialog */}
			<Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Categoria</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
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
						<div className="flex gap-2 pt-4">
							<Button onClick={handleUpdateCategory} disabled={updateCategoryMutation.isPending} className="flex-1">
								{updateCategoryMutation.isPending ? "Atualizando..." : "Atualizar"}
							</Button>
							<Button variant="outline" onClick={() => setEditingCategory(null)}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteState.show} onOpenChange={(open) => !open && closeDeleteConfirm()}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-red-500" />
							Confirmar Exclusão
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p>
							Tem certeza que deseja excluir a categoria <strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita. Todos os produtos desta categoria ficarão sem categoria.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={handleDeleteCategory}
								disabled={deleteCategoryMutation.isPending}
								className="flex-1"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{deleteCategoryMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
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
