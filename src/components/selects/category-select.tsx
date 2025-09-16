"use client"

import { useCallback, useMemo, useState } from "react"
import { CategoryCombobox } from "@/components/ui/category-combobox"
import { useCreateCategoryMutation, useInfiniteCategoriesQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Category } from "@/types"

interface CategorySelectProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	className?: string
	disabled?: boolean
}

export function CategorySelect({
	value,
	onValueChange,
	placeholder = "Selecione uma categoria",
	className = "w-full",
	disabled = false,
}: CategorySelectProps) {
	const [search, setSearch] = useState("")
	const debouncedSearch = useDebounce(search, 300)

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isPlaceholderData } =
		useInfiniteCategoriesQuery({
			search: debouncedSearch,
			enabled: true,
		})

	const createCategoryMutation = useCreateCategoryMutation()

	// Flatten all pages into a single array
	const categories = useMemo(() => {
		return data?.pages.flatMap((page) => page.categories) || []
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

	const handleCreateCategory = async (name: string) => {
		try {
			const newCategory = await createCategoryMutation.mutateAsync({
				name: name.trim(),
				icon: "📦", // Ícone padrão
				isFood: false, // Padrão para não-alimento
			})
			onValueChange?.(newCategory.id)
		} catch (error) {
			console.error("Error creating category:", error)
		}
	}

	if (isLoading && categories.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
	}

	return (
		<CategoryCombobox
			categories={categories}
			value={value}
			onValueChange={handleValueChange}
			placeholder={placeholder}
			searchPlaceholder="Buscar categoria..."
			emptyText="Nenhuma categoria encontrada."
			onCreateNew={handleCreateCategory}
			createNewText="Criar categoria"
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
