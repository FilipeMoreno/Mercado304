"use client"

import {
	BarChart3,
	ChevronLeft,
	ChevronRight,
	Edit,
	Filter,
	MoreHorizontal,
	Package,
	Plus,
	Search,
	Trash2,
	Archive,
	Heart,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Input } from "@/components/ui/input"
import { SelectWithSearch } from "@/components/ui/select-with-search"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SwipeableCard } from "@/components/ui/swipeable-card"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { AnimatedList, ListItem } from "@/components/ui/animated-list"
import { useMobile } from "@/hooks/use-mobile"
import {
	useAllBrandsQuery,
	useAllCategoriesQuery,
	useDeleteConfirmation,
	useDeleteProductMutation,
	useProductsQuery,
	useUrlState,
} from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Product } from "@/types"
import { toast } from "sonner"

interface ProductsClientProps {
	searchParams: {
		search?: string
		category?: string
		brand?: string
		sort?: string
		page?: string
	}
}

export function ProductsClient({ searchParams }: ProductsClientProps) {
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Product>()
	const [searchValue, setSearchValue] = useState(searchParams.search || "")
	const debouncedSearch = useDebounce(searchValue, 500)
	const mobile = useMobile()

	const { state, updateState, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
		basePath: "/produtos",
		initialValues: {
			search: "",
			category: "all",
			brand: "all",
			sort: "name-asc",
			page: 1,
		},
	})

	// Referência estável para o state atual
	const stateRef = React.useRef(state)
	stateRef.current = state

	// Sincronizar searchValue com mudanças no state.search (navegação, clearFilters, etc.)
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
			category: String(state.category),
			brand: String(state.brand),
			sort: String(state.sort),
			page: String(state.page),
			limit: "12",
		})
		return urlParams
	}, [state.search, state.category, state.brand, state.sort, state.page])

	// React Query hooks
	const { data: productsData, isLoading: productsLoading, error: productsError } = useProductsQuery(params)
	const { data: categories = [], isLoading: categoriesLoading } = useAllCategoriesQuery()
	const { data: brands = [], isLoading: brandsLoading } = useAllBrandsQuery()
	const deleteProductMutation = useDeleteProductMutation()

	const sortOptions = [
		{ value: "name-asc", label: "Nome (A-Z)" },
		{ value: "name-desc", label: "Nome (Z-A)" },
		{ value: "category", label: "Categoria" },
		{ value: "date-desc", label: "Mais recente" },
	]

	const categoryOptions = useMemo(
		() => [
			{ value: "all", label: "Todas as categorias", icon: "" },
			...(categories || []).map((cat: any) => ({
				value: cat.id,
				label: cat.name,
				icon: cat.icon,
			})),
		],
		[categories],
	)

	const brandOptions = useMemo(
		() => [
			{ value: "all", label: "Todas as marcas" },
			...(brands || []).map((brand: any) => ({
				value: brand.id,
				label: brand.name,
			})),
		],
		[brands],
	)

	const deleteProduct = async () => {
		if (!deleteState.item) return

		try {
			await deleteProductMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting product:", error)
		}
	}

	// Mobile-specific action handlers
	const handleProductEdit = (product: any) => {
		if (mobile.isTouchDevice) {
			toast.success(`Editando ${product.name}`)
		}
		window.location.href = `/produtos/${product.id}/editar`
	}

	const handleProductDelete = (product: any) => {
		openDeleteConfirm(product)
	}

	const handleProductFavorite = (product: any) => {
		toast.success(`${product.name} adicionado aos favoritos!`)
	}

	const handleProductArchive = (product: any) => {
		toast.info(`${product.name} foi arquivado`)
	}

	// FAB actions for mobile
	const fabActions = [
		{
			icon: <Plus className="h-5 w-5" />,
			label: "Novo Produto",
			onClick: () => window.location.href = "/produtos/novo",
			bgColor: "bg-green-500"
		},
		{
			icon: <Search className="h-5 w-5" />,
			label: "Buscar",
			onClick: () => {
				const searchInput = document.querySelector('input[placeholder*="Nome"]') as HTMLInputElement
				searchInput?.focus()
			},
			bgColor: "bg-blue-500"
		},
		{
			icon: <Filter className="h-5 w-5" />,
			label: "Filtros",
			onClick: () => toast.info("Abrindo filtros"),
			bgColor: "bg-purple-500"
		}
	]

	// ProductCard component for reuse
	const ProductCard = ({ product }: { product: any }) => (
		<Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl flex flex-col">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-3 mb-2">
					<div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">
						<Package className="h-5 w-5 text-orange-600" />
					</div>
					<div className="flex-1 min-w-0">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<CardTitle className="text-lg font-semibold text-gray-900 truncate cursor-help">
										{product.name}
									</CardTitle>
								</TooltipTrigger>
								<TooltipContent side="top" className="max-w-xs">
									<p>{product.name}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<div className="flex items-center gap-2 mt-1">
							{product.category && (
								<span className="inline-flex items-center text-xs text-gray-600">
									{product.category.icon} {product.category.name}
								</span>
							)}
						</div>
					</div>
				</div>
				<div className="space-y-1 text-xs text-gray-500">
					{product.brand && (
						<div className="flex items-center gap-1">
							<span className="font-medium">Marca:</span>
							<span>{product.brand.name}</span>
						</div>
					)}
					<div className="flex items-center gap-1">
						<span className="font-medium">Unidade:</span>
						<span>{product.unit}</span>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1" />
			{!mobile.isTouchDevice && (
				<CardFooter className="pt-3 border-t border-gray-100 dark:border-gray-800">
					<div className="flex gap-2 w-full">
						<Link href={`/produtos/${product.id}`} className="flex-1">
							<Button variant="outline" className="w-full justify-center">
								<BarChart3 className="h-4 w-4 mr-2" />
								Ver Produto
							</Button>
						</Link>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<Link href={`/produtos/${product.id}/editar`} className="flex items-center">
										<Edit className="h-4 w-4 mr-2" />
										Editar
									</Link>
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => openDeleteConfirm(product)}
									className="text-red-600 focus:text-red-600"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Excluir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardFooter>
			)}
		</Card>
	)

	// Extract data from React Query
	const products = productsData?.products || []
	const pagination = productsData?.pagination || {
		currentPage: 1,
		totalPages: 1,
		totalCount: 0,
		hasMore: false,
	}
	const loading = productsLoading || categoriesLoading || brandsLoading
	const error = productsError

	// Convert products to ListItems for AnimatedList (now after products is defined)
	const productListItems: ListItem[] = useMemo(() => 
		products.map((product: any) => ({
			id: product.id,
			content: (
				<SwipeableCard
					leftActions={[
						{
							icon: <Heart className="h-5 w-5" />,
							color: "text-red-600",
							background: "bg-red-100",
							action: () => handleProductFavorite(product)
						}
					]}
					rightActions={[
						{
							icon: <Edit className="h-5 w-5" />,
							color: "text-blue-600", 
							background: "bg-blue-100",
							action: () => handleProductEdit(product)
						},
						{
							icon: <Trash2 className="h-5 w-5" />,
							color: "text-red-600",
							background: "bg-red-100", 
							action: () => handleProductDelete(product)
						}
					]}
					onLongPress={() => toast.info(`Produto selecionado: ${product.name}`)}
					className="mb-0"
				>
					<ProductCard product={product} />
				</SwipeableCard>
			)
		})), [products])

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= pagination.totalPages) {
			updateSingleValue("page", page)
		}
	}

	const additionalFilters = (
		<>
			<SelectWithSearch
				label="Categoria"
				options={categoryOptions}
				value={state.category as string}
				onValueChange={(value) => updateSingleValue("category", value)}
				placeholder="Todas as categorias"
				emptyMessage="Nenhuma categoria encontrada."
				searchPlaceholder="Buscar categorias..."
			/>

			<SelectWithSearch
				label="Marca"
				options={brandOptions}
				value={state.brand as string}
				onValueChange={(value) => updateSingleValue("brand", value)}
				placeholder="Todas as marcas"
				emptyMessage="Nenhuma marca encontrada."
				searchPlaceholder="Buscar marcas..."
			/>
		</>
	)

	const renderEmptyState = () => {
		if (pagination.totalCount === 0) {
			return (
				<Card>
					<CardContent className="text-center py-12">
						<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
						<p className="text-gray-600 mb-4">Comece adicionando seu primeiro produto</p>
						<Link href="/produtos/novo">
							<Button>
								<Plus className="mr-2 h-4 w-4" />
								Cadastrar Primeiro Produto
							</Button>
						</Link>
					</CardContent>
				</Card>
			)
		}

		if (products.length === 0 && hasActiveFilters) {
			return (
				<Card>
					<CardContent className="text-center py-12">
						<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
						<h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
						<p className="text-gray-600 mb-4">Tente ajustar os filtros de busca</p>
						<Button
							variant="outline"
							onClick={() => {
								setSearchValue("") // Reset o input local
								clearFilters()
							}}
						>
							<Filter className="h-4 w-4 mr-2" />
							Limpar Filtros
						</Button>
					</CardContent>
				</Card>
			)
		}

		return null
	}

	// Handle error states
	if (error) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<Package className="h-12 w-12 mx-auto text-red-400 mb-4" />
					<h3 className="text-lg font-medium mb-2 text-red-600">Erro ao carregar produtos</h3>
					<p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os dados. Tente recarregar a página.</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<>
			{/* Animated search header */}
			<motion.div 
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center gap-2 mb-6"
			>
				<div className="relative flex-1">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Nome, código ou escaneie..."
						value={searchValue}
						onChange={handleSearchChange}
						className="pl-10"
					/>
				</div>
				<FilterPopover
					sortValue={String(state.sort)}
					onSortChange={(value) => updateSingleValue("sort", value)}
					sortOptions={sortOptions}
					additionalFilters={additionalFilters}
					hasActiveFilters={hasActiveFilters}
					onClearFilters={clearFilters}
				/>
			</motion.div>

			<motion.div 
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.1 }}
				className="space-y-4"
			>
				{loading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 9 }).map((_, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: i * 0.1 }}
							>
								<Card>
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
							</motion.div>
						))}
					</div>
				) : products.length > 0 ? (
					<>
						<motion.div 
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							className="flex justify-between items-center text-sm text-gray-600"
						>
							<span>
								Mostrando {products.length} de {pagination.totalCount} produtos
							</span>
							<span>
								Página {pagination.currentPage} de {pagination.totalPages}
							</span>
						</motion.div>

						{/* Mobile-optimized product list */}
						{mobile.isTouchDevice ? (
							<AnimatedList
								items={productListItems}
								enableSwipeActions={true}
								enableAnimations={true}
								onItemEdit={handleProductEdit}
								onItemDelete={handleProductDelete}
								onItemArchive={handleProductArchive}
								onItemLongPress={(id) => {
									const product = products.find((p: any) => p.id === id)
									if (product) {
										toast.info(`Produto selecionado: ${product.name}`)
									}
								}}
							/>
						) : (
							<motion.div 
								className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.2 }}
							>
								{products.map((product: any, index: number) => (
									<motion.div
										key={product.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.05 }}
									>
										<ProductCard product={product} />
									</motion.div>
								))}
							</motion.div>
						)}

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
									{Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
										.filter(
											(page) =>
												page === 1 || page === pagination.totalPages || Math.abs(page - pagination.currentPage) <= 2,
										)
										.map((page, index, array) => (
											<React.Fragment key={page}>
												{index > 0 && array[index - 1] !== page - 1 && (
													<span className="px-2 py-1 text-gray-400">...</span>
												)}
												<Button
													variant={pagination.currentPage === page ? "default" : "outline"}
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
			</motion.div>

			<Dialog open={deleteState.show} onOpenChange={(open) => !open && closeDeleteConfirm()}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Trash2 className="h-5 w-5 text-red-500" />
							Confirmar Exclusão
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p>
							Tem certeza que deseja excluir o produto <strong>{deleteState.item?.name}</strong>?
						</p>
						<p className="text-sm text-gray-600">
							Esta ação não pode ser desfeita e todas as informações relacionadas ao produto serão perdidas.
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

			{/* FAB for mobile users */}
			{mobile.isTouchDevice && (
				<FloatingActionButton
					actions={fabActions}
					position="bottom-right"
					size="md"
					expandDirection="up"
					showLabels={true}
				/>
			)}
		</>
	)
}