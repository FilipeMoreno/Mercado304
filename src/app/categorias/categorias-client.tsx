"use client";

import {
	ChevronLeft,
	ChevronRight,
	Edit,
	Filter,
	Plus,
	Search,
	Tag,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { CategoriesSkeleton } from "@/components/skeletons/categories-skeleton";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FilterPopover } from "@/components/ui/filter-popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDataMutation, useDeleteConfirmation, useUrlState } from "@/hooks";

interface Category {
	id: string;
	name: string;
	icon?: string;
	color?: string;
	createdAt: string;
	updatedAt: string;
	_count: {
		products: number;
	};
}

interface CategoriasClientProps {
	categoriesData: {
		categories: Category[];
		pagination: {
			currentPage: number;
			totalPages: number;
			totalCount: number;
			hasMore: boolean;
		};
	};
	searchParams: {
		search?: string;
		sort?: string;
		page?: string;
	};
}

export function CategoriasClient({
	categoriesData,
	searchParams,
}: CategoriasClientProps) {
	const [categories, setCategories] = useState<Category[]>(
		categoriesData.categories,
	);
	const [pagination, setPagination] = useState(categoriesData.pagination);
	const [dataLoading, setDataLoading] = useState(false); // Variável renomeada
	const [showForm, setShowForm] = useState(false);
	const [newCategory, setNewCategory] = useState({
		name: "",
		icon: "",
		color: "",
	});
	const [editingCategory, setEditingCategory] = useState<Category | null>(null);
	const [editForm, setEditForm] = useState({ name: "", icon: "", color: "" });
	const itemsPerPage = 12;

	// Hooks customizados
	const { create, update, remove, loading } = useDataMutation();
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } =
		useDeleteConfirmation<Category>();

	const { state, updateSingleValue, clearFilters, hasActiveFilters } =
		useUrlState({
			basePath: "/categorias",
			initialValues: {
				search: searchParams.search || "",
				sort: searchParams.sort || "name",
				page: parseInt(searchParams.page || "1"),
			},
		});

	const fetchCategories = async () => {
		setDataLoading(true); // Usando a nova variável
		try {
			const params = new URLSearchParams({
				search: state.search,
				sort: state.sort,
				page: state.page.toString(),
				limit: "12",
			});

			const response = await fetch(`/api/categories?${params.toString()}`);
			if (!response.ok) throw new Error("Erro ao carregar categorias");

			const data = await response.json();
			setCategories(data.categories);
			setPagination(data.pagination);
		} catch (error) {
			console.error("Erro:", error);
		} finally {
			setDataLoading(false); // Usando a nova variável
		}
	};

	React.useEffect(() => {
		fetchCategories();
	}, [state.search, state.sort, state.page]);

	// Opções de ordenação para o FilterPopover
	const sortOptions = [
		{ value: "name", label: "Nome" },
		{ value: "products", label: "Nº Produtos" },
		{ value: "date", label: "Data" },
	];

	const createCategory = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!newCategory.name.trim()) {
			toast.error("Nome da categoria é obrigatório");
			return;
		}

		await create("/api/categories", newCategory, {
			successMessage: "Categoria criada com sucesso!",
			onSuccess: () => {
				setNewCategory({ name: "", icon: "", color: "" });
				setShowForm(false);
			},
		});
	};

	const openEditDialog = (category: Category) => {
		setEditingCategory(category);
		setEditForm({
			name: category.name,
			icon: category.icon || "",
			color: category.color || "",
		});
	};

	const closeEditDialog = () => {
		setEditingCategory(null);
		setEditForm({ name: "", icon: "", color: "" });
	};

	const updateCategory = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editingCategory) return;

		await update(`/api/categories/${editingCategory.id}`, editForm, {
			successMessage: "Categoria atualizada com sucesso!",
			onSuccess: closeEditDialog,
		});
	};

	const deleteCategory = async () => {
		if (!deleteState.item) return;

		await remove(`/api/categories/${deleteState.item.id}`, {
			successMessage: "Categoria excluída com sucesso!",
			onSuccess: closeDeleteConfirm,
		});
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= pagination.totalPages) {
			updateSingleValue("page", page);
		}
	};

	if (dataLoading) {
		// Usando a nova variável aqui
		return <CategoriesSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Categorias</h1>
					<p className="text-gray-600 mt-2">
						Gerencie as categorias dos seus produtos
					</p>
				</div>
				<Button onClick={() => setShowForm(true)}>
					<Plus className="h-4 w-4 mr-2" />
					Nova Categoria
				</Button>
			</div>

			{/* Barra de Pesquisa e Filtros */}
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
						clearFilters();
						updateSingleValue("page", 1);
					}}
				/>
			</div>

			{/* Informações de Paginação */}
			<div className="flex justify-between items-center text-sm text-gray-600">
				<span>
					Mostrando {categories.length} de {pagination.totalCount} categorias
				</span>
				<span>
					Página {pagination.currentPage} de {pagination.totalPages}
				</span>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{categories.map((category) => (
					<Card key={category.id}>
						<Link href={`/categorias/${category.id}`} className="block">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									{category.icon ? (
										<span className="text-lg">{category.icon}</span>
									) : (
										<Tag className="h-5 w-5" />
									)}
									{category.name}
								</CardTitle>
								<CardDescription>
									{category._count.products}{" "}
									{category._count.products === 1 ? "produto" : "produtos"}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => openEditDialog(category)}
									>
										<Edit className="h-4 w-4" />
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => openDeleteConfirm(category)}
										disabled={category._count.products > 0}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								</div>
								{category._count.products > 0 && (
									<p className="text-xs text-gray-500 mt-2">
										Não é possível excluir categoria com produtos
									</p>
								)}
							</CardContent>
						</Link>
					</Card>
				))}
			</div>

			{/* Controles de Paginação */}
			{pagination.totalPages > 1 && (
				<div className="flex justify-center items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => handlePageChange(pagination.currentPage - 1)}
						disabled={pagination.currentPage === 1}
					>
						<ChevronLeft className="h-4 w-4" />
						Anterior
					</Button>

					<div className="flex gap-1">
						{Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
							.filter(
								(page) =>
									page === 1 ||
									page === pagination.totalPages ||
									Math.abs(page - pagination.currentPage) <= 2,
							)
							.map((page, index, array) => (
								<React.Fragment key={page}>
									{index > 0 && array[index - 1] !== page - 1 && (
										<span className="px-2 py-1 text-gray-400">...</span>
									)}
									<Button
										variant={
											pagination.currentPage === page ? "default" : "outline"
										}
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
						onClick={() => handlePageChange(pagination.currentPage + 1)}
						disabled={pagination.currentPage === pagination.totalPages}
					>
						Próxima
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			)}

			{categories.length === 0 && pagination.totalCount > 0 && !dataLoading && (
				<Card>
					<CardContent className="text-center py-12">
						<Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium mb-2">
							Nenhuma categoria encontrada
						</h3>
						<p className="text-gray-600 mb-4">
							Tente ajustar os filtros ou termo de busca
						</p>
						<Button
							variant="outline"
							onClick={() => {
								clearFilters();
								updateSingleValue("page", 1);
							}}
						>
							<Filter className="mr-2 h-4 w-4" />
							Limpar filtros
						</Button>
					</CardContent>
				</Card>
			)}

			{pagination.totalCount === 0 && !dataLoading && (
				<Card>
					<CardContent className="text-center py-12">
						<Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium mb-2">
							Nenhuma categoria cadastrada
						</h3>
						<p className="text-gray-600 mb-4">
							Crie a primeira categoria para organizar seus produtos
						</p>
						<Button onClick={() => setShowForm(true)}>
							<Plus className="h-4 w-4 mr-2" />
							Nova Categoria
						</Button>
					</CardContent>
				</Card>
			)}

			{/* Dialog de Nova Categoria */}
			<Dialog open={showForm} onOpenChange={setShowForm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nova Categoria</DialogTitle>
					</DialogHeader>
					<form onSubmit={createCategory} className="space-y-4">
						<div>
							<Label htmlFor="name">Nome *</Label>
							<Input
								id="name"
								value={newCategory.name}
								onChange={(e) =>
									setNewCategory({ ...newCategory, name: e.target.value })
								}
								placeholder="Nome da categoria"
								required
							/>
						</div>
						<div>
							<Label htmlFor="icon">Ícone (emoji)</Label>
							<Input
								id="icon"
								value={newCategory.icon}
								onChange={(e) =>
									setNewCategory({ ...newCategory, icon: e.target.value })
								}
								placeholder="🥕 (opcional)"
								maxLength={2}
							/>
						</div>
						<div>
							<Label htmlFor="color">Cor (hex)</Label>
							<Input
								id="color"
								value={newCategory.color}
								onChange={(e) =>
									setNewCategory({ ...newCategory, color: e.target.value })
								}
								placeholder="#ff6b6b (opcional)"
							/>
						</div>
						<div className="flex gap-2 pt-4">
							<Button type="submit" disabled={loading} className="flex-1">
								{loading ? "Salvando..." : "Criar Categoria"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowForm(false)}
							>
								Cancelar
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog de Edição */}
			<Dialog
				open={!!editingCategory}
				onOpenChange={(open) => !open && closeEditDialog()}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Categoria</DialogTitle>
					</DialogHeader>
					<form onSubmit={updateCategory} className="space-y-4">
						<div>
							<Label htmlFor="editName">Nome *</Label>
							<Input
								id="editName"
								value={editForm.name}
								onChange={(e) =>
									setEditForm({ ...editForm, name: e.target.value })
								}
								placeholder="Nome da categoria"
								required
							/>
						</div>
						<div>
							<Label htmlFor="editIcon">Ícone (emoji)</Label>
							<Input
								id="editIcon"
								value={editForm.icon}
								onChange={(e) =>
									setEditForm({ ...editForm, icon: e.target.value })
								}
								placeholder="🥕 (opcional)"
								maxLength={2}
							/>
						</div>
						<div>
							<Label htmlFor="editColor">Cor (hex)</Label>
							<Input
								id="editColor"
								value={editForm.color}
								onChange={(e) =>
									setEditForm({ ...editForm, color: e.target.value })
								}
								placeholder="#ff6b6b (opcional)"
							/>
						</div>
						<div className="flex gap-2 pt-4">
							<Button type="submit" disabled={loading} className="flex-1">
								{loading ? "Salvando..." : "Salvar Alterações"}
							</Button>
							<Button type="button" variant="outline" onClick={closeEditDialog}>
								Cancelar
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Dialog de Confirmação de Exclusão */}
			<Dialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-red-500" />
							Confirmar Exclusão
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p>
							Tem certeza que deseja excluir a categoria{" "}
							<strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={deleteCategory}
								disabled={loading}
								className="flex-1"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{loading ? "Excluindo..." : "Sim, Excluir"}
							</Button>
							<Button variant="outline" onClick={closeDeleteConfirm}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
