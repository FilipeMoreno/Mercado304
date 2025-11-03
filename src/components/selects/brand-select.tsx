"use client"

import { useState } from "react"
import { BrandCombobox } from "@/components/ui/brand-combobox"
import { useAllBrandsQuery, useCreateBrandMutation } from "@/hooks"
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

	// Buscar todas as marcas de uma vez (sem paginação)
	const { data: allBrandsData, isLoading } = useAllBrandsQuery()
	const allBrands = (allBrandsData as Brand[] | undefined) || []

	const createBrandMutation = useCreateBrandMutation()

	// Filtrar brands baseado na busca
	const brands = debouncedSearch
		? allBrands.filter((brand) =>
			brand.name.toLowerCase().includes(debouncedSearch.toLowerCase())
		)
		: allBrands

	const handleSearchChange = (searchTerm: string) => {
		setSearch(searchTerm)
	}

	const handleValueChange = (newValue: string) => {
		onValueChange?.(newValue)
		if (newValue) {
			setSearch("")
		}
	}

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
			hasNextPage={false}
			fetchNextPage={undefined}
			isFetchingNextPage={false}
			isLoading={isLoading}
			onSearchChange={handleSearchChange}
			pendingBrandName={pendingBrandName ?? undefined}
		/>
	)
}
