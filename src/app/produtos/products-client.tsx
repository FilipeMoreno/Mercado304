// src/app/produtos/products-client.tsx
"use client";

import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Edit,
	Filter,
	Package,
	Plus,
	Search,
	Tag,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useMemo } from "react";
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
import { SelectWithSearch } from "@/components/ui/select-with-search";
import { Skeleton } from "@/components/ui/skeleton";
import { 
	useProductsQuery,
	useAllCategoriesQuery,
	useAllBrandsQuery,
	useDeleteProductMutation,
	useDeleteConfirmation, 
	useUrlState 
} from "@/hooks";
import type { Brand, Category, Product } from "@/types";

interface ProductsClientProps {
	searchParams: {
		search?: string;
		category?: string;
		brand?: string;
		sort?: string;
		page?: string;
	};
}

export function ProductsClient({
	searchParams,
}: ProductsClientProps) {
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } =
		useDeleteConfirmation<Product>();

	const { state, updateSingleValue, clearFilters, hasActiveFilters } =
		useUrlState({
			basePath: "/produtos",
			initialValues: {
				search: searchParams.search || "",
				category: searchParams.category || "all",
				brand: searchParams.brand || "all",
				sort: searchParams.sort || "name-asc",
				page: parseInt(searchParams.page || "1"),
			},
		});

	// Build URLSearchParams for the query
	const params = useMemo(() => {
		const urlParams = new URLSearchParams({
			search: state.search,
			category: state.category,
			brand: state.brand,
			sort: state.sort,
			page: state.page.toString(),
			limit: "12",
		});
		return urlParams;
	}, [state.search, state.category, state.brand, state.sort, state.page]);

	// React Query hooks
	const { data: productsData, isLoading: productsLoading, error: productsError } = useProductsQuery(params);
	const { data: categories = [], isLoading: categoriesLoading } = useAllCategoriesQuery();
	const { data: brands = [], isLoading: brandsLoading } = useAllBrandsQuery();
	const deleteProductMutation = useDeleteProductMutation();

	const sortOptions = [
		{ value: "name-asc", label: "Nome (A-Z)" },
		{ value: "name-desc", label: "Nome (Z-A)" },
		{ value: "category", label: "Categoria" },
		{ value: "date-desc", label: "Mais recente" },
	];

	const categoryOptions = useMemo(
		() => [
			{ value: "all", label: "Todas as categorias", icon: "" },
			...(categories || []).map((cat) => ({
				value: cat.id,
				label: cat.name,
				icon: cat.icon,
			})),
		],
		[categories],
	);

	const brandOptions = useMemo(
		() => [
			{ value: "all", label: "Todas as marcas" },
			...(brands || []).map((brand) => ({
				value: brand.id,
				label: brand.name,
			})),
		],
		[brands],
	);

	const deleteProduct = async () => {
		if (!deleteState.item) return;

		try {
			await deleteProductMutation.mutateAsync(deleteState.item.id);
			closeDeleteConfirm();
		} catch (error) {
			console.error("Error deleting product:", error);
		}
	};

	// Extract data from React Query
	const products = productsData?.products || [];
	const pagination = productsData?.pagination || {
		currentPage: 1,
		totalPages: 1,
		totalCount: 0,
		hasMore: false,
	};
	const loading = productsLoading || categoriesLoading || brandsLoading;
	const error = productsError;

	// Handle error states
	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<Package className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">
						Erro ao carregar produtos
					</h3>
					<p className="text-gray-600 mb-4">
						Ocorreu um erro ao buscar os dados. Tente recarregar a página.
					</p>
				</CardContent>
			</Card>
		);
	}

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= pagination.totalPages) {
			updateSingleValue("page", page);
		}
	};

	const additionalFilters = (
		<>
			<SelectWithSearch
				label="Categoria"
				options={categoryOptions}
				value={state.category}
				onValueChange={(value) => updateSingleValue("category", value)}
				placeholder="Todas as categorias"
				emptyMessage="Nenhuma categoria encontrada."
				searchPlaceholder="Buscar categorias..."
			/>

			<SelectWithSearch
				label="Marca"
				options={brandOptions}
				value={state.brand}
				onValueChange={(value) => updateSingleValue("brand", value)}
				placeholder="Todas as marcas"
				emptyMessage="Nenhuma marca encontrada."
				searchPlaceholder="Buscar marcas..."
			/>
		</>
	);

	const renderEmptyState = () => {
		if (pagination.totalCount === 0) {
			return (
				<Card>
					<CardContent className="text-center py-12">
						<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium mb-2">
							Nenhum produto cadastrado
						</h3>
						<p className="text-gray-600 mb-4">
							Comece adicionando seu primeiro produto
						</p>
						<Link href="/produtos/novo">
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Cadastrar Primeiro Produto
							</Button>
						</Link>
					</CardContent>
				</Card>
			);
		}

		if (products.length === 0 && hasActiveFilters) {
			return (
				<Card>
					<CardContent className="text-center py-12">
						<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium mb-2">
							Nenhum produto encontrado
						</h3>
						<p className="text-gray-600 mb-4">
							Tente ajustar os filtros de busca
						</p>
						<Button
							variant="outline"
							onClick={() => {
								clearFilters();
								updateSingleValue("page", 1);
							}}
						>
							<Filter className="h-4 w-4 mr-2" />
							Limpar Filtros
						</Button>
					</CardContent>
				</Card>
			);
		}

		return null;
	};

	return (
		<>
			<div className="flex items-center gap-2 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Nome, código ou escaneie..."
						value={state.search}
						onChange={(e) => updateSingleValue("search", e.target.value)}
						className="pl-10"
					/>
				</div>
				<FilterPopover
					sortValue={state.sort}
					onSortChange={(value) => updateSingleValue("sort", value)}
					sortOptions={sortOptions}
					additionalFilters={additionalFilters}
					hasActiveFilters={hasActiveFilters}
					onClearFilters={() => {
						clearFilters();
						updateSingleValue("page", 1);
					}}
				/>
			</div>

			<div className="space-y-4">
				{loading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 9 }).map((_, i) => (
							<Card key={i}>
								<CardHeader>
									<div className="flex items-center gap-2">
										<Skeleton className="h-5 w-5" />
										<Skeleton className="h-6 w-28" />
									</div>
									<div className="space-y-1">
										<div className="flex items-center gap-1">
											<Skeleton className="h-3 w-3" />
											<Skeleton className="h-4 w-20" />
										</div>
										<Skeleton className="h-4 w-24" />
									</div>
								</CardHeader>
								<CardContent>
									<div className="flex gap-2">
										<Skeleton className="h-8 w-8" />
										<Skeleton className="h-8 w-8" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				) : products.length > 0 ? (
					<>
						<div className="flex justify-between items-center text-sm text-gray-600">
							<span>
								Mostrando {products.length} de {pagination.totalCount} produtos
							</span>
							<span>
								Página {pagination.currentPage} de {pagination.totalPages}
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{products.map((product) => (
								<Card
									key={product.id}
									className="hover:shadow-md transition-shadow"
								>
									<CardHeader className="pb-3">
										<div className="flex justify-between items-start">
											<CardTitle className="text-lg flex items-center gap-2">
												<Package className="h-5 w-5" />
												{product.name}
											</CardTitle>
										</div>
										<CardDescription className="space-y-1">
											{product.category && (
												<div className="flex items-center gap-1">
													<Tag className="h-3 w-3" />
													<span>
														{product.category.icon} {product.category.name}
													</span>
												</div>
											)}
											{product.brand && (
												<div className="text-sm text-gray-600">
													Marca: {product.brand.name}
												</div>
											)}
											<div className="text-sm text-gray-600">
												Unidade: {product.unit}
											</div>
										</CardDescription>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex gap-2">
											<Link href={`/produtos/${product.id}`}>
												<Button variant="outline" size="sm">
													<BarChart3 className="h-4 w-4 mr-1" />
													Detalhes
												</Button>
											</Link>
											<Link href={`/produtos/${product.id}/editar`}>
												<Button variant="outline" size="sm">
													<Edit className="h-4 w-4" />
												</Button>
											</Link>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => openDeleteConfirm(product)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{pagination.totalPages > 1 && (
							<div className="flex justify-center items-center gap-2 pt-6">
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
									{Array.from(
										{ length: pagination.totalPages },
										(_, i) => i + 1,
									)
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
														pagination.currentPage === page
															? "default"
															: "outline"
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
					</>
				) : (
					renderEmptyState()
				)}
			</div>

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
							Tem certeza que deseja excluir o produto{" "}
							<strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita e todas as informações
							relacionadas ao produto serão perdidas.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={deleteProduct}
								disabled={deleteProductMutation.isPending}
								className="flex-1"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{deleteProductMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
							</Button>
							<Button variant="outline" onClick={closeDeleteConfirm}>
								Cancelar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
