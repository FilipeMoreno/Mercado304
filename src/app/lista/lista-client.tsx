// src/app/lista/lista-client.tsx
"use client";

import {
	ChevronLeft,
	ChevronRight,
	Edit,
	Eye,
	Filter,
	List,
	Plus,
	Search,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { AiShoppingList } from "@/components/ai-shopping-list";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDataMutation, useDeleteConfirmation, useUrlState } from "@/hooks";
import type { ShoppingList } from "@/types";

interface ListaClientProps {
	initialShoppingLists: ShoppingList[];
	initialTotalCount: number;
	searchParams: {
		search?: string;
		sort?: string;
		page?: string;
		status?: string;
	};
}

export function ListaClient({
	initialShoppingLists,
	initialTotalCount,
	searchParams,
}: ListaClientProps) {
	const [shoppingLists, setShoppingLists] =
		useState<ShoppingList[]>(initialShoppingLists);
	const [totalCount, setTotalCount] = useState(initialTotalCount);
	const itemsPerPage = 12;

	const { remove, loading } = useDataMutation();
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } =
		useDeleteConfirmation<ShoppingList>();

	const { state, updateSingleValue, clearFilters, hasActiveFilters } =
		useUrlState({
			basePath: "/lista",
			initialValues: {
				search: searchParams.search || "",
				sort: searchParams.sort || "date-desc",
				status: searchParams.status || "all",
				page: parseInt(searchParams.page || "1"),
			},
		});

	const totalPages = Math.ceil(totalCount / itemsPerPage);

	const sortOptions = [
		{ value: "date-desc", label: "Mais recente" },
		{ value: "date-asc", label: "Mais antiga" },
		{ value: "name-asc", label: "Nome (A-Z)" },
		{ value: "name-desc", label: "Nome (Z-A)" },
	];

	React.useEffect(() => {
		setShoppingLists(initialShoppingLists);
		setTotalCount(initialTotalCount);
	}, [initialShoppingLists, initialTotalCount]);

	const deleteShoppingList = async () => {
		if (!deleteState.item) return;

		await remove(`/api/shopping-lists/${deleteState.item.id}`, {
			successMessage: "Lista excluída com sucesso!",
			onSuccess: closeDeleteConfirm,
		});
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			updateSingleValue("page", page);
		}
	};

	const handleGenerateAutoList = async (type: "weekly" | "monthly") => {
		try {
			const response = await fetch("/api/predictions/auto-shopping-list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type }),
			});
			return await response.json();
		} catch (error) {
			console.error("Erro ao gerar lista:", error);
			throw error;
		}
	};

	const handleCreateAutoList = async (items: any[]) => {
		try {
			const listResponse = await fetch("/api/shopping-lists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: `Lista IA - ${new Date().toLocaleDateString("pt-BR")}`,
					description: "Gerada automaticamente pela IA",
				}),
			});
			const newList = await listResponse.json();
			await Promise.all(
				items.map((item) =>
					fetch(`/api/shopping-lists/${newList.id}/items`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(item),
					}),
				),
			);
			toast.success(`Lista criada com ${items.length} itens!`);
			window.location.reload();
		} catch (error) {
			console.error("Erro ao criar lista:", error);
			throw error;
		}
	};

	const additionalFilters = (
		<div className="space-y-2">
			<Label>Status</Label>
			<Select
				value={state.status}
				onValueChange={(value) => updateSingleValue("status", value)}
			>
				<SelectTrigger>
					<SelectValue placeholder="Todos" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todas as listas</SelectItem>
					<SelectItem value="active">Ativas</SelectItem>
					<SelectItem value="inactive">Inativas</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);

	return (
		<div className="flex flex-col md:flex-row gap-6">
			<div className="flex-1 space-y-4">
				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Buscar listas..."
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

				{shoppingLists.length === 0 ? (
					<Card>
						<CardContent className="text-center py-12">
							<List className="h-12 w-12 mx-auto text-gray-400 mb-4" />
							<h3 className="text-lg font-medium mb-2">
								{hasActiveFilters
									? "Nenhuma lista encontrada"
									: "Nenhuma lista criada"}
							</h3>
							<p className="text-gray-600 mb-4">
								{hasActiveFilters
									? "Tente ajustar os filtros"
									: "Comece criando sua primeira lista de compras"}
							</p>
							{hasActiveFilters && (
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
							)}
						</CardContent>
					</Card>
				) : (
					<>
						<div className="flex justify-between items-center text-sm text-gray-600">
							<span>
								Mostrando {shoppingLists.length} de {totalCount} listas
							</span>
							<span>
								Página {state.page} de {totalPages}
							</span>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
							{shoppingLists.map((list) => (
								<Card key={list.id}>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="flex items-center gap-2">
													<List className="h-5 w-5" />
													{list.name}
												</CardTitle>
												<CardDescription className="mt-2">
													{list.items?.length || 0} itens • Criada em{" "}
													{new Date(list.createdAt).toLocaleDateString("pt-BR")}
												</CardDescription>
											</div>
											<div className="text-right">
												<div className="text-sm text-gray-500">
													{list.items?.length || 0} itens
												</div>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex gap-2">
											<Link href={`/lista/${list.id}`}>
												<Button variant="outline" size="sm">
													<Eye className="h-4 w-4 mr-1" />
													Ver Lista
												</Button>
											</Link>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													window.open(`/lista/${list.id}/editar`, "_blank")
												}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => openDeleteConfirm(list)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{totalPages > 1 && (
							<div className="flex justify-center items-center gap-2 pt-6">
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
										.filter(
											(page) =>
												page === 1 ||
												page === totalPages ||
												Math.abs(page - state.page) <= 2,
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

			<div className="w-full md:w-1/3 flex-shrink-0">
				<AiShoppingList
					onGenerateList={handleGenerateAutoList}
					onCreateShoppingList={handleCreateAutoList}
				/>
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
							Tem certeza que deseja excluir a lista{" "}
							<strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita e todos os itens da lista serão
							perdidos.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={deleteShoppingList}
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
