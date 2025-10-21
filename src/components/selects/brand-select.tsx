"use client"

import { useCallback, useMemo, useState } from "react"
import { BrandCombobox } from "@/components/ui/brand-combobox"
import { useCreateBrandMutation, useInfiniteBrandsQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"

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

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isPlaceholderData } = useInfiniteBrandsQuery(
		{
			search: debouncedSearch,
			enabled: true,
		},
	)

	const createBrandMutation = useCreateBrandMutation()

	// Flatten all pages into a single array
	const brands = useMemo(() => {
		return data?.pages.flatMap((page) => page.brands) || []
	}, [data])

	const handleSearchChange = useCallback((searchTerm: string) => {
		setSearch(searchTerm)
	}, [])

	// Reset search when dropdown is closed
	const handleValueChange = useCallback(
		(newValue: string) => {
			console.log("[BrandSelect] Value changed:", newValue)
			console.log(
				"[BrandSelect] Brands available:",
				brands.map((b) => ({ id: b.id, name: b.name })),
			)
			onValueChange?.(newValue)
			if (newValue) {
				setSearch("")
			}
		},
		[onValueChange, brands],
	)

	const [pendingBrandName, setPendingBrandName] = useState<string | null>(null)

	const handleCreateBrand = async (name: string) => {
		try {
			console.log("[BrandSelect] Creating brand:", name)
			const newBrand = await createBrandMutation.mutateAsync({
				name: name.trim(),
			})
			console.log("[BrandSelect] Brand created:", newBrand)

			// Define o valor imediatamente após a criação
			console.log("[BrandSelect] Setting value immediately:", newBrand.id)
			onValueChange?.(newBrand.id)

			// Define o nome da marca pendente para exibição
			setPendingBrandName(newBrand.name)

			// Limpa o nome pendente após 3 segundos (quando a lista deve estar atualizada)
			setTimeout(() => {
				setPendingBrandName(null)
			}, 3000)
		} catch (error) {
			console.error("Error creating brand:", error)
		}
	}

	if (isLoading && brands.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse ${className}`} />
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
			pendingBrandName={pendingBrandName ?? undefined}
		/>
	)
}
