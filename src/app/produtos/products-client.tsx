"use client"

import { motion } from "framer-motion"
import { Filter, Package, Plus, Search, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"
import { ProductEmptyState } from "@/components/products/product-empty-state"
import { ProductList } from "@/components/products/product-list"
import { ProductPagination } from "@/components/products/product-pagination"
import { ProductStats } from "@/components/products/product-stats"
import { Card, CardContent } from "@/components/ui/card"
import { FilterPopover } from "@/components/ui/filter-popover"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { SelectWithSearch } from "@/components/ui/select-with-search"
import { Skeleton } from "@/components/ui/skeleton"
import {
	useAllBrandsQuery,
	useAllCategoriesQuery,
	useDeleteConfirmation,
	useDeleteProductMutation,
	useProductsQuery,
	useUrlState,
} from "@/hooks"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/hooks/use-react-query"
import { useDebounce } from "@/hooks/use-debounce"
import { useMobile } from "@/hooks/use-mobile"
import type { Product } from "@/types"
import { Input } from "@/components/ui/input"

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
	const queryClient = useQueryClient()
	const { data: productsData, error: productsError } = useProductsQuery(params, { suspense: true })
	const { data: categories = [] } = useAllCategoriesQuery({ suspense: true })
	const { data: brands = [] } = useAllBrandsQuery({ suspense: true })
	const deleteProductMutation = useDeleteProductMutation()

	// Prefetch próxima página para melhor UX
	React.useEffect(() => {
		if (productsData?.pagination?.hasMore && state.page) {
			const nextPageParams = new URLSearchParams(params)
			nextPageParams.set("page", String(Number(state.page) + 1))
			
			queryClient.prefetchQuery({
				queryKey: queryKeys.products(nextPageParams),
				queryFn: () => fetch(`/api/products?${nextPageParams.toString()}`).then(r => r.json()),
				staleTime: 2 * 60 * 1000, // 2 minutos
			})
		}
	}, [productsData?.pagination?.hasMore, state.page, params, queryClient])

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
			bgColor: "bg-green-500",
		},
		{
			icon: <Search className="h-5 w-5" />,
			label: "Buscar",
			onClick: () => {
				const searchInput = document.querySelector('input[placeholder*="Nome"]') as HTMLInputElement
				searchInput?.focus()
			},
			bgColor: "bg-blue-500",
		},
		{
			icon: <Filter className="h-5 w-5" />,
			label: "Filtros",
			onClick: () => toast.info("Abrindo filtros"),
			bgColor: "bg-purple-500",
		},
	]

	// Extract data from React Query
	const products = productsData?.products || []
	const pagination = productsData?.pagination || {
		currentPage: 1,
		totalPages: 1,
		totalCount: 0,
		hasMore: false,
	}
	const error = productsError

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= pagination.totalPages) {
			updateSingleValue("page", page)
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			})
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

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
				{products.length > 0 ? (
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

			{/* Modal de confirmação responsivo */}
			<ResponsiveConfirmDialog
				open={deleteState.show}
				onOpenChange={(open) => !open && closeDeleteConfirm()}
				title="Confirmar Exclusão"
				description="Esta ação não pode ser desfeita"
				onConfirm={deleteProduct}
				onCancel={closeDeleteConfirm}
				confirmText={deleteProductMutation.isPending ? "Excluindo..." : "Sim, Excluir"}
				cancelText="Cancelar"
				confirmVariant="destructive"
				isLoading={deleteProductMutation.isPending}
				icon={<Trash2 className="h-8 w-8 text-red-500" />}
			>
				<p className="text-lg font-medium">
					Tem certeza que deseja excluir o produto <strong>{deleteState.item?.name}</strong>?
				</p>
				<p className="text-sm text-gray-600 mt-2">
					Todas as informações relacionadas ao produto serão perdidas permanentemente.
				</p>
			</ResponsiveConfirmDialog>

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
