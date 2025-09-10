"use client";

import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Edit,
	MapPin,
	Plus,
	Search,
	Store,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useState } from "react";
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
import { useDataMutation, useDeleteConfirmation, useUrlState } from "@/hooks";
import type { Market } from "@/types";

interface MercadosClientProps {
	initialMarkets: Market[];
	initialTotalCount: number;
	searchParams: {
		search?: string;
		sort?: string;
		page?: string;
	};
}

export function MercadosClient({
	initialMarkets,
	initialTotalCount,
	searchParams,
}: MercadosClientProps) {
	const [markets, setMarkets] = useState<Market[]>(initialMarkets);
	const [totalCount, setTotalCount] = useState(initialTotalCount);
	const itemsPerPage = 12;

	// Hooks customizados
	const { remove, loading } = useDataMutation();
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } =
		useDeleteConfirmation<Market>();

	const { state, updateSingleValue, clearFilters, hasActiveFilters } =
		useUrlState({
			basePath: "/mercados",
			initialValues: {
				search: searchParams.search || "",
				sort: searchParams.sort || "name-asc",
				page: parseInt(searchParams.page || "1", 10),
			},
		});

	const sortOptions = [
		{ value: "name-asc", label: "Nome (A-Z)" },
		{ value: "name-desc", label: "Nome (Z-A)" },
		{ value: "location-asc", label: "Localização (A-Z)" },
		{ value: "date-desc", label: "Mais recente" },
		{ value: "date-asc", label: "Mais antigo" },
	];

	const totalPages = Math.ceil(totalCount / itemsPerPage);

	const deleteMarket = async () => {
		if (!deleteState.item) return;

		await remove(`/api/markets/${deleteState.item.id}`, {
			successMessage: "Mercado excluído com sucesso!",
			onSuccess: closeDeleteConfirm,
		});
	};

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			updateSingleValue("page", page);
		}
	};

	React.useEffect(() => {
		setMarkets(initialMarkets);
		setTotalCount(initialTotalCount);
	}, [initialMarkets, initialTotalCount]);

	return (
		<>
			<div className="flex items-center gap-2 mb-6">
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Buscar mercados..."
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

			<div className="space-y-4">
				{markets.length === 0 ? (
					state.search || state.sort !== "name-asc" ? (
						<Card>
							<CardContent className="text-center py-12">
								<Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
								<h3 className="text-lg font-medium mb-2">
									Nenhum mercado encontrado
								</h3>
								<p className="text-gray-600 mb-4">
									Nenhum mercado corresponde aos filtros aplicados
								</p>
								<Button
									variant="outline"
									onClick={() => {
										clearFilters();
										updateSingleValue("page", 1);
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
								<h3 className="text-lg font-medium mb-2">
									Nenhum mercado cadastrado
								</h3>
								<p className="text-gray-600 mb-4">
									Comece adicionando seu primeiro mercado
								</p>
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
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{markets.map((market) => (
								<Card key={market.id}>
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<CardTitle className="flex items-center gap-2">
													<Store className="h-5 w-5" />
													{market.name}
												</CardTitle>
												<CardDescription className="flex items-center gap-1 mt-2">
													<MapPin className="h-3 w-3" />
													{market.location}
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex gap-2">
											<Link href={`/mercados/${market.id}`}>
												<Button variant="outline" size="sm">
													<BarChart3 className="h-4 w-4 mr-1" />
													Detalhes
												</Button>
											</Link>
											<Link href={`/mercados/${market.id}/editar`}>
												<Button variant="outline" size="sm">
													<Edit className="h-4 w-4" />
												</Button>
											</Link>
											<Button
												variant="destructive"
												size="sm"
												onClick={() => openDeleteConfirm(market)}
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
							Tem certeza que deseja excluir o mercado{" "}
							<strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita e todas as compras relacionadas a
							este mercado serão afetadas.
						</p>
						<div className="flex gap-2 pt-4">
							<Button
								variant="destructive"
								onClick={deleteMarket}
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
		</>
	);
}
