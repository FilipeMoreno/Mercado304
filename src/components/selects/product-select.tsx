"use client"

import { Camera } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import { ProductCombobox } from "@/components/ui/product-combobox"
import { useAllProductsQuery, useInfiniteProductsQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { TempStorage } from "@/lib/temp-storage"
import type { Product } from "@/types"

interface ProductSelectProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	className?: string
	disabled?: boolean
	preserveFormData?: any
	itemIndex?: number
	products?: Product[]
	loading?: boolean
	showScanButton?: boolean
}

export function ProductSelect({
	value,
	onValueChange,
	placeholder = "Selecione o produto",
	className = "w-full",
	disabled = false,
	preserveFormData,
	itemIndex,
	showScanButton = true,
}: ProductSelectProps) {
	const [search, setSearch] = useState("")
	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const debouncedSearch = useDebounce(search, 300)

	// Query para todos os produtos (para encontrar o produto selecionado)
	const { data: allProductsData } = useAllProductsQuery()
	const allProducts = allProductsData?.products || []

	// Query infinita para o dropdown (com busca)
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isPlaceholderData } =
		useInfiniteProductsQuery({
			search: debouncedSearch,
			enabled: true,
		})

	// Flatten all pages into a single array
	const products = useMemo(() => {
		return data?.pages.flatMap((page) => page.products) || []
	}, [data])

	// Encontrar o produto selecionado na lista completa
	const selectedProduct = useMemo(() => {
		if (!value) return null
		return allProducts.find((p: Product) => p.id === value) || null
	}, [value, allProducts])

	const handleSearchChange = useCallback((searchTerm: string) => {
		setSearch(searchTerm)
	}, [])

	// Reset search when dropdown is closed
	const handleValueChange = useCallback(
		(newValue: string) => {
			onValueChange?.(newValue)
			if (newValue) {
				setSearch("")
			}
		},
		[onValueChange],
	)

	const [pendingProductName, _setPendingProductName] = useState<string | null>(null)

	const handleCreateProduct = (name: string) => {
		if (preserveFormData) {
			// Usar targetItemIndex de preserveFormData se existir, senão usar itemIndex prop
			const targetIndex = preserveFormData.targetItemIndex !== undefined ? preserveFormData.targetItemIndex : itemIndex

			// Salvar dados no localStorage temporário incluindo o índice do item
			const dataToSave = {
				...preserveFormData,
				targetItemIndex: targetIndex,
			}
			const storageKey = TempStorage.save(dataToSave)

			// Navegar com key e nome
			const params = new URLSearchParams()
			params.set("name", name)
			params.set("returnTo", window.location.pathname)
			params.set("storageKey", storageKey)

			window.location.href = `/produtos/novo?${params.toString()}`
		} else {
			window.location.href = `/produtos/novo?name=${encodeURIComponent(name)}`
		}
	}

	const handleBarcodeScanned = async (barcode: string) => {
		try {
			// Buscar produto pelo código de barras
			const response = await fetch(`/api/products/barcode/${barcode}`)
			if (response.ok) {
				const product = await response.json()
				onValueChange?.(product.id)
				setSearch(product.name) // Mostrar o nome do produto encontrado
			} else {
				// Produto não encontrado, buscar no search para ver se encontra produtos similares
				setSearch(barcode)
			}
		} catch (error) {
			console.error("Erro ao buscar produto por código de barras:", error)
			// Em caso de erro, usar o código como busca
			setSearch(barcode)
		}
		setIsScannerOpen(false)
	}

	if (isLoading && products.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse ${className}`} />
	}

	return (
		<>
			<div className="flex gap-2">
				<ProductCombobox
					products={products}
					{...(value ? { value } : {})}
					onValueChange={handleValueChange}
					placeholder={placeholder}
					searchPlaceholder="Buscar produto ou código de barras..."
					emptyText="Nenhum produto encontrado."
					onCreateNew={handleCreateProduct}
					createNewText="Criar produto"
					className={className}
					disabled={disabled}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					isFetchingNextPage={isFetchingNextPage}
					isLoading={isLoading || isPlaceholderData}
					onSearchChange={handleSearchChange}
					selectedProduct={selectedProduct}
					{...(pendingProductName ? { pendingProductName } : {})}
				/>
				{showScanButton && (
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => setIsScannerOpen(true)}
						disabled={disabled}
						className="shrink-0"
						title="Escanear código de barras"
					>
						<Camera className="size-4" />
					</Button>
				)}
			</div>

			{showScanButton && (
				<BarcodeScanner isOpen={isScannerOpen} onScan={handleBarcodeScanned} onClose={() => setIsScannerOpen(false)} />
			)}
		</>
	)
}
