"use client"

import { ChevronLeft, ChevronRight, Edit, Plus, Search, Tag, Trash2 } from "lucide-react"
import React, { useMemo, useState } from "react"
import { CategoriesSkeleton } from "@/components/skeletons/categories-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
	useCategoriesQuery,
	useCreateCategoryMutation,
	useDeleteCategoryMutation,
	useDeleteConfirmation,
	useUpdateCategoryMutation,
	useUrlState,
} from "@/hooks"
import type { Category } from "@/types"

interface CategoriasClientProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export function CategoriasClient({ searchParams }: CategoriasClientProps) {
	const [showForm, setShowForm] = useState(false)
	const [newCategory, setNewCategory] = useState({
		name: "",
		icon: "",
		color: "",
		isFood: false,
	})
	const [editingCategory, setEditingCategory] = useState<Category | null>(null)
	const [editForm, setEditForm] = useState({ name: "", icon: "", color: "", isFood: false })

	// URL state management
	const { state, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/categorias",
		initialValues: {
			search: searchParams.search || "",
			sort: searchParams.sort || "name",
			page: parseInt(searchParams.page || "1", 10),
		},
	})

	// Build URLSearchParams for the query
	const params = useMemo(() => {
		const urlParams = new URLSearchParams({
			search: state.search,
			sort: state.sort,
			page: state.page.toString(),
			limit: "12",
		})
		return urlParams
	}, [state.search, state.sort, state.page])

	// React Query hooks
	const { data: categoriesData, isLoading, error } = useCategoriesQuery(params)
	const createCategoryMutation = useCreateCategoryMutation()
	const updateCategoryMutation = useUpdateCategoryMutation()
	const deleteCategoryMutation = useDeleteCategoryMutation()

	// Delete confirmation hook
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Category>()

	// Extract data from React Query
	const categories = categoriesData?.categories || []
	// --- CORREÇÃO APLICADA AQUI ---
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

	const handleCreateCategory = async () => {
		try {
			await createCategoryMutation.mutateAsync({
				name: newCategory.name,
				icon: newCategory.icon,
				color: newCategory.color,
				isFood: newCategory.isFood,
			})
			setNewCategory({ name: "", icon: "", color: "", isFood: false })
			setShowForm(false)
		} catch (error) {
			console.error("Error creating category:", error)
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

	const startEdit = (category: Category) => {
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
						value={state.search}
						onChange={(e) => updateSingleValue("search", e.target.value)}
						className="pl-10"
					/>
				</div>
				<FilterPopover
					sortValue={state.sort}
					onSortChange={(value) => updateSingleValue("sort", value)}
					sortOptions={sortOptions}
					hasActiveFilters={hasActiveFilters}
					onClearFilters={() => {
						clearFilters()
						updateSingleValue("page", 1)
					}}
				/>
				<Button onClick={() => setShowForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Nova Categoria
				</Button>
			</div>

			<div className="space-y-4">
				{isLoading ? (
					<CategoriesSkeleton />
				) : categories.length === 0 ? (
					state.search || state.sort !== "name" ? (
						<Card>
							<CardContent className="text-center py-12">
								<Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
								<p className="text-gray-600 mb-4">Nenhuma categoria corresponde aos filtros aplicados</p>
								<Button
									variant="outline"
									onClick={() => {
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
								<Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">Nenhuma categoria cadastrada</h3>
								<p className="text-gray-600 mb-4">Comece adicionando sua primeira categoria</p>
								<Button onClick={() => setShowForm(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Cadastrar Primeira Categoria
								</Button>
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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{categories.map((category: any) => (
								<Card key={category.id}>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="flex items-center gap-2">
													{category.icon && <span className="text-lg">{category.icon}</span>}
													{category.name}
												</CardTitle>
												<CardDescription className="mt-2 flex items-center gap-2">
													{category._count?.products || 0} produtos
													{category.isFood && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Alimento</span>}
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => startEdit(category)}>
												<Edit className="h-4 w-4" />
											</Button>
											<Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(category)}>
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
									onClick={() => handlePageChange(state.page - 1)}
									disabled={state.page === 1}
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</Button>

								<div className="flex gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter((page) => page === 1 || page === totalPages || Math.abs(page - state.page) <= 2)
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
									onClick={() => handlePageChange(state.page + 1)}
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

			{/* Form Dialog */}
			<Dialog open={showForm} onOpenChange={setShowForm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nova Categoria</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Nome</Label>
							<Input
								id="name"
								value={newCategory.name}
								onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="Nome da categoria"
							/>
						</div>
						<div>
							<Label htmlFor="icon">Ícone</Label>
							<Input
								id="icon"
								value={newCategory.icon}
								onChange={(e) => setNewCategory((prev) => ({ ...prev, icon: e.target.value }))}
								placeholder="📦"
							/>
						</div>
						<div>
							<Label htmlFor="color">Cor</Label>
							<Input
								id="color"
								type="color"
								value={newCategory.color}
								onChange={(e) => setNewCategory((prev) => ({ ...prev, color: e.target.value }))}
							/>
						</div>
						<div className="flex items-center space-x-2">
							<Switch
								id="isFood"
								checked={newCategory.isFood}
								onCheckedChange={(checked) => setNewCategory((prev) => ({ ...prev, isFood: checked }))}
							/>
							<Label htmlFor="isFood">É um alimento?</Label>
						</div>
						<div className="flex gap-2 pt-4">
							<Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending} className="flex-1">
								{createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
							</Button>
							<Button variant="outline" onClick={() => setShowForm(false)}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

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
