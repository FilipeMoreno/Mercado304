"use client"

import { motion } from "framer-motion"
import { Package, Plus, QrCode, Search, Trash2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { ProductEmptyState } from "@/components/products/product-empty-state"
import { ProductList } from "@/components/products/product-list"
import { ProductPagination } from "@/components/products/product-pagination"
import { ProductStats } from "@/components/products/product-stats"
import { ProductsListSkeleton } from "@/components/skeletons/products-list-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FilterPopover } from "@/components/ui/filter-popover"
import { FloatingActionButton, type FABAction } from "@/components/ui/floating-action-button"
import { Input } from "@/components/ui/input"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
import { SelectWithSearch } from "@/components/ui/select-with-search"
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

export function ProductsClient() {
	const router = useRouter()
    const searchParams = useSearchParams()
	const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Product>()
    const [searchValue, setSearchValue] = useState(searchParams.get("search") || "")
	const debouncedSearch = useDebounce(searchValue, 500)
	const [showScanner, setShowScanner] = useState(false)

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

	// Mudanças no campo de busca
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value)
	}

	// Handlers para o scanner
	const handleScanResult = (barcode: string) => {
		setSearchValue(barcode)
		setShowScanner(false)
		toast.success(`Código escaneado: ${barcode}`)
	}

	const handleOpenScanner = () => {
		setShowScanner(true)
	}

	const handleCloseScanner = () => {
		setShowScanner(false)
	}

	// Build URLSearchParams para a query
	const params = new URLSearchParams({
		search: String(state.search),
		category: String(state.category),
		brand: String(state.brand),
		sort: String(state.sort),
		page: String(state.page),
		limit: "12",
	})

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

	const categoryOptions = [
		{ value: "all", label: "Todas as categorias", icon: "" },
		...(categories || []).map((cat: any) => ({ value: cat.id, label: cat.name, icon: cat.icon })),
	]

	const brandOptions = [
		{ value: "all", label: "Todas as marcas" },
		...(brands || []).map((brand: any) => ({ value: brand.id, label: brand.name })),
	]

	const deleteProduct = async () => {
		if (!deleteState.item) return

		try {
			await deleteProductMutation.mutateAsync(deleteState.item.id)
			closeDeleteConfirm()
		} catch (error) {
			console.error("Error deleting product:", error)
		}
	}

	// Action handlers
	const handleProductDelete = (product: any) => {
		openDeleteConfirm(product)
	}

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
			{/* Fixed header for mobile */}
			<div className="sticky top-0 z-10 bg-white dark:bg-gray-900 dark:border-gray-800 pb-4 mb-6">
				<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Nome, código ou escaneie..."
							value={searchValue}
							onChange={handleSearchChange}
							className="pl-10 pr-12"
						/>
						<Button
							variant="ghost"
							size="sm"
							onClick={handleOpenScanner}
							className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
							title="Escanear código de barras"
						>
							<QrCode className="h-4 w-4 text-gray-500" />
						</Button>
					</div>
					<div className="flex items-center gap-2">
						<FilterPopover
							sortValue={String(state.sort)}
							onSortChange={(value) => updateSingleValue("sort", value)}
							sortOptions={sortOptions}
							additionalFilters={additionalFilters}
							hasActiveFilters={hasActiveFilters}
							onClearFilters={clearFilters}
						/>
						<Button
							onClick={() => router.push("/produtos/novo")}
							className="bg-green-600 hover:bg-green-700 text-white"
						>
							<Plus className="h-4 w-4 mr-2" />
							<span className="hidden sm:inline">Novo Produto</span>
							<span className="sm:hidden">Novo</span>
						</Button>
					</div>
				</motion.div>
			</div>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="space-y-4">
				{loading ? (
					<ProductsListSkeleton />
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
							onDelete={handleProductDelete}
							onEdit={(product) => router.push(`/produtos/${product.id}/editar`)}
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
						searchValue={searchValue}
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

			{/* Scanner de código de barras */}
			<BarcodeScanner isOpen={showScanner} onScan={handleScanResult} onClose={handleCloseScanner} />

			{/* Floating Action Button */}
			<FloatingActionButton
				actions={[
					{
						icon: Plus,
						label: "Novo Produto",
						onClick: () => router.push("/produtos/novo"),
					},
					{
						icon: QrCode,
						label: "Escanear Código",
						onClick: () => setShowScanner(true),
					},
				]}
			/>
		</>
	)
}
