"use client"

import {
	Filter,
	Package,
	Plus,
	Search,
	Trash2,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { FilterPopover } from "@/components/ui/filter-popover"
import { SelectWithSearch } from "@/components/ui/select-with-search"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { ProductList } from "@/components/products/product-list"
import { ProductStats } from "@/components/products/product-stats"
import { ProductEmptyState } from "@/components/products/product-empty-state"
import { ProductPagination } from "@/components/products/product-pagination"
import { MobileModal } from "@/components/ui/mobile-modal"
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
	const router = useRouter()
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
		router.push(`/produtos/${product.id}/editar`)
	}

	const handleProductDelete = (product: any) => {
		openDeleteConfirm(product)
	}

	const handleProductArchive = (product: any) => {
		toast.info(`${product.name} foi arquivado`)
	}

	// FAB actions for mobile
	const fabActions = [
		{
			icon: <Plus className="h-5 w-5" />,
			label: "Novo Produto",
			onClick: () => router.push("/produtos/novo"),
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
									<CardContent className="p-4">
										<div className="flex items-center gap-2 mb-2">
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
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				) : products.length > 0 ? (
					<>
						<ProductStats
							currentCount={products.length}
							totalCount={pagination.totalCount}
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
						/>

						<ProductList
							products={products}
							onEdit={handleProductEdit}
							onDelete={handleProductDelete}
							onArchive={handleProductArchive}
						/>

						<ProductPagination
							currentPage={pagination.currentPage}
							totalPages={pagination.totalPages}
							onPageChange={handlePageChange}
						/>
					</>
				) : (
					<ProductEmptyState
						totalCount={pagination.totalCount}
						hasActiveFilters={hasActiveFilters}
						onClearFilters={clearFilters}
						onResetSearch={() => setSearchValue("")}
					/>
				)}
			</motion.div>

			{/* Modal de confirmação - alterna entre Dialog (desktop) e MobileModal (mobile) */}
			{mobile.isTouchDevice ? (
				<MobileModal
					isOpen={deleteState.show}
					onClose={closeDeleteConfirm}
					title="Confirmar Exclusão"
					subtitle="Esta ação não pode ser desfeita"
					dragToClose={true}
					swipeToClose={true}
				>
					<div className="space-y-4">
						<div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
							<Trash2 className="h-8 w-8 text-red-500" />
						</div>
						
						<div className="text-center space-y-2">
							<p className="text-lg font-medium">
								Tem certeza que deseja excluir o produto <strong>{deleteState.item?.name}</strong>?
							</p>
							<p className="text-sm text-gray-600">
								Todas as informações relacionadas ao produto serão perdidas permanentemente.
							</p>
						</div>

						<div className="flex flex-col gap-3 pt-4">
							<Button
								variant="destructive"
								onClick={deleteProduct}
								disabled={deleteProductMutation.isPending}
								className="w-full"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								{deleteProductMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
							</Button>
							<Button 
								variant="outline" 
								onClick={closeDeleteConfirm}
								disabled={deleteProductMutation.isPending}
								className="w-full"
							>
								Cancelar
							</Button>
						</div>
					</div>
				</MobileModal>
			) : (
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
			)}

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