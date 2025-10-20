"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
			console.log("[CategorySelect] Value changed:", newValue)
			console.log("[CategorySelect] Categories available:", categories.map(c => ({ id: c.id, name: c.name })))
			onValueChange?.(newValue)
			if (newValue) {
				setSearch("")
			}
		},
		[onValueChange, categories],
	)

	const [pendingCategoryName, setPendingCategoryName] = useState<string | null>(null)

	const handleCreateCategory = async (name: string) => {
		try {
			console.log("[CategorySelect] Creating category:", name)
			const newCategory = await createCategoryMutation.mutateAsync({
				name: name.trim(),
				icon: "📦", // Ícone padrão
				isFood: false, // Padrão para não-alimento
			})
			console.log("[CategorySelect] Category created:", newCategory)

			// Define o valor imediatamente após a criação
			console.log("[CategorySelect] Setting value immediately:", newCategory.id)
			onValueChange?.(newCategory.id)

			// Define o nome da categoria pendente para exibição
			setPendingCategoryName(newCategory.name)

			// Limpa o nome pendente após 3 segundos (quando a lista deve estar atualizada)
			setTimeout(() => {
				setPendingCategoryName(null)
			}, 3000)

		} catch (error) {
			console.error("Error creating category:", error)
		}
	}

	if (isLoading && categories.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse ${className}`} />
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
			pendingCategoryName={pendingCategoryName ?? undefined}
		/>
	)
}
