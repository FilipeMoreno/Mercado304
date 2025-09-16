"use client"

import { useCallback, useMemo, useState } from "react"
import { BrandCombobox } from "@/components/ui/brand-combobox"
import { useInfiniteBrandsQuery, useCreateBrandMutation } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Brand } from "@/types"

interface BrandSelectProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	className?: string
	disabled?: boolean
}

export function BrandSelect({
	value,
	onValueChange,
	placeholder = "Selecione uma marca",
	className = "w-full",
	disabled = false,
}: BrandSelectProps) {
	const [search, setSearch] = useState("")
	const debouncedSearch = useDebounce(search, 300)
	
	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		isPlaceholderData,
	} = useInfiniteBrandsQuery({ 
		search: debouncedSearch,
		enabled: true
	})

	const createBrandMutation = useCreateBrandMutation()

	// Flatten all pages into a single array
	const brands = useMemo(() => {
		return data?.pages.flatMap(page => page.brands) || []
	}, [data])

	const handleSearchChange = useCallback((searchTerm: string) => {
		setSearch(searchTerm)
	}, [])

	// Reset search when dropdown is closed
	const handleValueChange = useCallback((newValue: string) => {
		onValueChange?.(newValue)
		if (newValue) {
			setSearch("")
		}
	}, [onValueChange])

	const handleCreateBrand = async (name: string) => {
		try {
			const newBrand = await createBrandMutation.mutateAsync({
				name: name.trim()
			})
			onValueChange?.(newBrand.id)
		} catch (error) {
			console.error("Error creating brand:", error)
		}
	}

	if (isLoading && brands.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
	}

	return (
		<BrandCombobox
			brands={brands}
			value={value}
			onValueChange={handleValueChange}
			placeholder={placeholder}
			searchPlaceholder="Buscar marca..."
			emptyText="Nenhuma marca encontrada."
			onCreateNew={handleCreateBrand}
			createNewText="Criar marca"
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
