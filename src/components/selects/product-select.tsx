"use client"

import { useCallback, useMemo, useState } from "react"
import { ProductCombobox } from "@/components/ui/product-combobox"
import { useInfiniteProductsQuery } from "@/hooks"
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
}

export function ProductSelect({
	value,
	onValueChange,
	placeholder = "Selecione o produto",
	className = "w-full",
	disabled = false,
	preserveFormData,
	itemIndex,
}: ProductSelectProps) {
	const [search, setSearch] = useState("")
	const debouncedSearch = useDebounce(search, 300)

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isPlaceholderData } =
		useInfiniteProductsQuery({
			search: debouncedSearch,
			enabled: true,
		})

	// Flatten all pages into a single array
	const products = useMemo(() => {
		return data?.pages.flatMap((page) => page.products) || []
	}, [data])

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

	if (isLoading && products.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
	}

	return (
		<ProductCombobox
			products={products}
			value={value}
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
		/>
	)
}
