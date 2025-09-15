"use client"

import { ChevronLeft, ChevronRight, Edit, Factory, Filter, Plus, Search, Tag, Trash2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BrandsSkeleton } from "@/components/skeletons/brands-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	useBrandsQuery,
	useCreateBrandMutation,
	useDeleteBrandMutation,
	useDeleteConfirmation,
	useUpdateBrandMutation,
	useUrlState,
} from "@/hooks"
import type { Brand } from "@/types"

interface MarcasClientProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
	}
}

export function MarcasClient({ searchParams }: MarcasClientProps) {
	const [showForm, setShowForm] = useState(false)
	const [newBrand, setNewBrand] = useState({
		name: "",
	})
	const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
	const [editForm, setEditForm] = useState({ name: "" })

	// URL state management
	const { state, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/marcas",
		initialValues: {
			search: searchParams.search || "",
			sort: searchParams.sort || "name",
			page: parseInt(searchParams.page || "1"),
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
	const { data: brandsData, isLoading, error } = useBrandsQuery(params)
	const createBrandMutation = useCreateBrandMutation()
	const updateBrandMutation = useUpdateBrandMutation()
	const deleteBrandMutation = useDeleteBrandMutation()

	// Delete confirmation hook
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Brand>()

	// Extract data from React Query
	const brands = brandsData?.brands || []
	const totalCount = brandsData?.totalCount || 0
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

	const handleCreateBrand = async () => {
		try {
			await createBrandMutation.mutateAsync({
				name: newBrand.name,
			})
			setNewBrand({ name: "" })
			setShowForm(false)
		} catch (error) {
			console.error("Error creating brand:", error)
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

	const startEdit = (brand: Brand) => {
		setEditingBrand(brand)
		setEditForm({
			name: brand.name,
		})
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
			<div className="flex items-center gap-2 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Buscar marcas..."
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
			</div>

			<div className="space-y-4">
				{isLoading ? (
					<BrandsSkeleton />
				) : brands.length === 0 ? (
					state.search || state.sort !== "name" ? (
						<Card>
							<CardContent className="text-center py-12">
								<Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">Nenhuma marca encontrada</h3>
								<p className="text-gray-600 mb-4">Nenhuma marca corresponde aos filtros aplicados</p>
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
								<Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h3>
								<p className="text-gray-600 mb-4">Comece adicionando sua primeira marca</p>
								<Button onClick={() => setShowForm(true)}>
									<Plus className="mr-2 h-4 w-4" />
									Cadastrar Primeira Marca
								</Button>
							</CardContent>
						</Card>
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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{brands.map((brand) => (
								<Card key={brand.id}>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="flex items-center gap-2">
													<Factory className="h-5 w-5" />
													{brand.name}
												</CardTitle>
												<CardDescription className="mt-2">{brand._count?.products || 0} produtos</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex gap-2">
											<Button variant="outline" size="sm" onClick={() => startEdit(brand)}>
												<Edit className="h-4 w-4" />
											</Button>
											<Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(brand)}>
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
						<DialogTitle>Nova Marca</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Nome</Label>
							<Input
								id="name"
								value={newBrand.name}
								onChange={(e) => setNewBrand((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="Nome da marca"
							/>
						</div>
						<div className="flex gap-2 pt-4">
							<Button onClick={handleCreateBrand} disabled={createBrandMutation.isPending} className="flex-1">
								{createBrandMutation.isPending ? "Criando..." : "Criar Marca"}
							</Button>
							<Button variant="outline" onClick={() => setShowForm(false)}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Edit Dialog */}
			<Dialog open={!!editingBrand} onOpenChange={(open) => !open && setEditingBrand(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Marca</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label htmlFor="edit-name">Nome</Label>
							<Input
								id="edit-name"
								value={editForm.name}
								onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="Nome da marca"
							/>
						</div>
						<div className="flex gap-2 pt-4">
							<Button onClick={handleUpdateBrand} disabled={updateBrandMutation.isPending} className="flex-1">
								{updateBrandMutation.isPending ? "Atualizando..." : "Atualizar"}
							</Button>
							<Button variant="outline" onClick={() => setEditingBrand(null)}>
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
							Tem certeza que deseja excluir a marca <strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita. Todos os produtos desta marca ficarão sem marca.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={handleDeleteBrand}
								disabled={deleteBrandMutation.isPending}
								className="flex-1"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{deleteBrandMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
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
