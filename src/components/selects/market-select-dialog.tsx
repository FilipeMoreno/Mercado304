"use client"

import { useCallback, useMemo, useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useAllMarketsQuery, useCreateMarketMutation } from "@/hooks"

interface MarketSelectDialogProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	disabled?: boolean
}

export function MarketSelectDialog({
	value,
	onValueChange,
	placeholder = "Selecione o mercado",
	disabled = false,
}: MarketSelectDialogProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState("")
	const { data: marketsData, isLoading } = useAllMarketsQuery()
	const createMarketMutation = useCreateMarketMutation()

	const markets = marketsData?.markets || []

	// Filter markets based on search (local filtering)
	const filteredMarkets = useMemo(() => {
		if (!search) return markets
		const searchLower = search.toLowerCase()
		return markets.filter(
			(market: any) =>
				market.name.toLowerCase().includes(searchLower) || market.location?.toLowerCase().includes(searchLower),
		)
	}, [markets, search])

	// Convert markets to SelectOption format
	const options: SelectOption[] = useMemo(() => {
		return filteredMarkets.map((market: any) => ({
			id: String(market.id), // Garantir que o id seja string
			label: market.name,
			sublabel: market.location || undefined,
			icon: "🏪",
		}))
	}, [filteredMarkets])

	const handleSearchChange = useCallback((searchTerm: string) => {
		setSearch(searchTerm)
	}, [])

	const handleValueChange = useCallback(
		(newValue: string) => {
			onValueChange?.(newValue)
			setSearch("")
			setOpen(false) // Fechar dialog após selecionar
		},
		[onValueChange],
	)

	const handleCreateMarket = async (name: string) => {
		try {
			console.log("[MarketSelectDialog] Creating market:", name)
			const newMarket = await createMarketMutation.mutateAsync({
				name: name.trim(),
			})
			console.log("[MarketSelectDialog] Market created:", newMarket)

			// Define o valor imediatamente após a criação (converter para string)
			onValueChange?.(String(newMarket.id))
			setSearch("")
			setOpen(false) // Fechar dialog após criar
		} catch (error) {
			console.error("Error creating market:", error)
		}
	}

	return (
		<ResponsiveSelectDialog
			open={open}
			onOpenChange={setOpen}
			{...(value ? { value } : {})}
			onValueChange={handleValueChange}
			options={options}
			title="Selecionar Mercado"
			placeholder={placeholder}
			searchPlaceholder="Buscar mercado..."
			emptyText="Nenhum mercado encontrado."
			isLoading={isLoading && markets.length === 0}
			onSearchChange={handleSearchChange}
			onCreateNew={handleCreateMarket}
			createNewText="Criar mercado"
			showCreateNew={true}
		/>
	)
}
