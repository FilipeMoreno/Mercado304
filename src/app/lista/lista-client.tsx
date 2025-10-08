"use client"

import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight, Edit, Eye, Filter, List, Plus, Search, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { AiShoppingList } from "@/components/ai-shopping-list"
import { ShoppingListSkeleton } from "@/components/skeletons/shopping-list-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDeleteConfirmation, useDeleteShoppingListMutation, useShoppingListsQuery, useUrlState } from "@/hooks"

interface ListaClientProps {
	searchParams: {
		search?: string
		sort?: string
		page?: string
		status?: string
	}
}

export function ListaClient({ searchParams }: ListaClientProps) {
	const router = useRouter()
	const itemsPerPage = 12

	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<ShoppingList>()

	const { state, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/lista",
		initialValues: {
			search: searchParams.search || "",
			sort: searchParams.sort || "date-desc",
			status: searchParams.status || "all",
			page: parseInt(searchParams.page || "1", 10),
		},
	})

	// Build URLSearchParams for the shopping lists query
	const shoppingListParams = React.useMemo(() => {
		const params: Record<string, string> = {
			search: String(state.search),
			sort: String(state.sort),
			status: String(state.status),
			page: String(state.page),
			limit: itemsPerPage.toString(),
		}
		return new URLSearchParams(params)
	}, [state.search, state.sort, state.status, state.page])

	// React Query hooks
	const { data: shoppingListsData, isLoading, error } = useShoppingListsQuery(shoppingListParams)
	const deleteShoppingListMutation = useDeleteShoppingListMutation()

	// Extract data from React Query
	const shoppingLists = shoppingListsData?.lists || []
	const totalCount = shoppingListsData?.totalCount || 0
	const totalPages = Math.ceil(totalCount / itemsPerPage)

	const sortOptions = [
		{ value: "date-desc", label: "Mais recente" },
		{ value: "date-asc", label: "Mais antiga" },
		{ value: "name-asc", label: "Nome (A-Z)" },
		{ value: "name-desc", label: "Nome (Z-A)" },
	]

	// Handle loading and error states
	if (isLoading && shoppingLists.length === 0) {
		return <ShoppingListSkeleton />
	}

	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<List className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar listas</h3>
					<p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os dados. Tente recarregar a página.</p>
				</CardContent>
			</Card>
		)
	}

	const deleteShoppingList = async () => {
		if (!deleteState.item) return

		try {
			await deleteShoppingListMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting shopping list:", error)
		}
	}

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			updateSingleValue("page", page)
		}
	}

	const handleGenerateAutoList = async (type: "weekly" | "monthly") => {
		try {
			const response = await fetch("/api/predictions/auto-shopping-list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ type }),
			})
			return await response.json()
		} catch (error) {
			console.error("Erro ao gerar lista:", error)
			throw error
		}
	}

	const handleCreateAutoList = async (items: any[]) => {
		try {
			const listResponse = await fetch("/api/shopping-lists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: `Lista IA - ${new Date().toLocaleDateString("pt-BR")}`,
					description: "Gerada automaticamente pela IA",
				}),
			})
			const newList = await listResponse.json()
			await Promise.all(
				items.map((item) =>
					fetch(`/api/shopping-lists/${newList.id}/items`, {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(item),
					}),
				),
			)
			toast.success(`Lista criada com ${items.length} itens!`)
			window.location.reload()
		} catch (error) {
			console.error("Erro ao criar lista:", error)
			throw error
		}
	}

	const additionalFilters = (
		<div className="space-y-2">
			<Label>Status</Label>
			<Select value={state.status as string} onValueChange={(value) => updateSingleValue("status", value)}>
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
	)

	return (
		<div className="flex flex-col md:flex-row gap-6">
			<div className="flex-1 space-y-4">
				{/* Header with search and create button */}
				<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Buscar listas..."
							value={state.search as string}
							onChange={(e) => updateSingleValue("search", e.target.value)}
							className="pl-10"
						/>
					</div>
					<div className="flex items-center gap-2">
						<FilterPopover
							sortValue={state.sort as string}
							onSortChange={(value) => updateSingleValue("sort", value)}
							sortOptions={sortOptions}
							additionalFilters={additionalFilters}
							hasActiveFilters={hasActiveFilters}
							onClearFilters={() => {
								clearFilters()
								updateSingleValue("page", 1)
							}}
						/>
						<Button onClick={() => router.push("/lista/nova")} className="bg-green-600 hover:bg-green-700 text-white">
							<Plus className="h-4 w-4 mr-2" />
							<span className="hidden sm:inline">Nova Lista</span>
							<span className="sm:hidden">Nova</span>
						</Button>
					</div>
				</motion.div>

				{shoppingLists.length === 0 ? (
					<Empty className="border border-dashed py-12">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<List className="h-6 w-6" />
							</EmptyMedia>
							<EmptyTitle>{hasActiveFilters ? "Nenhuma lista encontrada" : "Nenhuma lista criada"}</EmptyTitle>
							<EmptyDescription>
								{hasActiveFilters ? "Tente ajustar os filtros" : "Comece criando sua primeira lista de compras"}
							</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<div className="flex items-center justify-center gap-2">
								{hasActiveFilters && (
									<Button
										variant="outline"
										onClick={() => {
											clearFilters()
											updateSingleValue("page", 1)
										}}
									>
										<Filter className="h-4 w-4 mr-2" />
										Limpar Filtros
									</Button>
								)}
								<Button onClick={() => router.push("/lista/nova")} className="bg-green-600 hover:bg-green-700 text-white">
									<Plus className="h-4 w-4 mr-2" />
									Nova Lista
								</Button>
							</div>
						</EmptyContent>
					</Empty>
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

						<motion.div
							className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.2 }}
						>
							{shoppingLists.map((list: any, index: number) => (
								<motion.div
									key={list.id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<Card>
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
													<div className="text-sm text-gray-500">{list.items?.length || 0} itens</div>
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
												<Link href={`/lista/${list.id}/editar`}>
													<Button variant="outline" size="sm">
														<Edit className="h-4 w-4" />
													</Button>
												</Link>
												<Button variant="destructive" size="sm" onClick={() => openDeleteConfirm(list)}>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</CardContent>
									</Card>
								</motion.div>
							))}
						</motion.div>

						{totalPages > 1 && (
							<div className="flex justify-center items-center gap-2 pt-6">
								<Button
									variant="outline"
									size="sm"
									onClick={() => handlePageChange((state.page as number) - 1)}
									disabled={state.page === 1}
								>
									<ChevronLeft className="h-4 w-4" />
									Anterior
								</Button>

								<div className="flex gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1)
										.filter((page) => page === 1 || page === totalPages || Math.abs(page - (state.page as number)) <= 2)
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
									onClick={() => handlePageChange((state.page as number) + 1)}
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
				<AiShoppingList onGenerateList={handleGenerateAutoList} onCreateShoppingList={handleCreateAutoList} />
			</div>

			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				description="Esta ação não pode ser desfeita"
				onConfirm={deleteShoppingList}
				onCancel={closeDeleteConfirm}
				confirmText={deleteShoppingListMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteShoppingListMutation.isPending}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<p className="text-lg font-medium">
					Tem certeza que deseja excluir a lista <strong>{deleteState.item?.name}</strong>?
				</p>
				<p className="text-sm text-gray-600 mt-2">
					Esta ação não pode ser desfeita e todos os itens da lista serão perdidos.
				</p>
			</ResponsiveConfirmDialog>
		</div>
	)
}
