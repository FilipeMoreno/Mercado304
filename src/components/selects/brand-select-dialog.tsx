"use client"

import { useCallback, useMemo, useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useCreateBrandMutation, useInfiniteBrandsQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"

interface BrandSelectDialogProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	disabled?: boolean
}

export function BrandSelectDialog({
	value,
	onValueChange,
	placeholder = "Selecione uma marca",
	disabled = false,
}: BrandSelectDialogProps) {
	const [open, setOpen] = useState(false)
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

	// Convert brands to SelectOption format
	const options: SelectOption[] = useMemo(() => {
		return brands.map((brand) => ({
			id: brand.id,
			label: brand.name,
		}))
	}, [brands])

	const handleSearchChange = useCallback((searchTerm: string) => {
		setSearch(searchTerm)
	}, [])

	const handleValueChange = useCallback(
		(newValue: string) => {
			console.log("[BrandSelectDialog] Value changed:", newValue)
			onValueChange?.(newValue)
			setSearch("")
			setOpen(false) // Fechar dialog após selecionar
		},
		[onValueChange],
	)

	const handleCreateBrand = async (name: string) => {
		try {
			console.log("[BrandSelectDialog] Creating brand:", name)
			const newBrand = await createBrandMutation.mutateAsync({
				name: name.trim(),
			})
			console.log("[BrandSelectDialog] Brand created:", newBrand)

			// Define o valor imediatamente após a criação
			onValueChange?.(newBrand.id)
			setSearch("")
			setOpen(false) // Fechar dialog após criar
		} catch (error) {
			console.error("Error creating brand:", error)
		}
	}

	return (
		<ResponsiveSelectDialog
			open={open}
			onOpenChange={setOpen}
			value={value}
			onValueChange={handleValueChange}
			options={options}
			title="Selecionar Marca"
			placeholder={placeholder}
			searchPlaceholder="Buscar marca..."
			emptyText="Nenhuma marca encontrada."
			isLoading={isLoading && brands.length === 0}
			hasNextPage={hasNextPage}
			isFetchingNextPage={isFetchingNextPage}
			onFetchNextPage={fetchNextPage}
			onSearchChange={handleSearchChange}
			onCreateNew={handleCreateBrand}
			createNewText="Criar marca"
			showCreateNew={true}
		/>
	)
}
