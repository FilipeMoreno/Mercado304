"use client"

import { Combobox } from "@/components/ui/combobox"
import { useAllMarketsQuery, useCreateMarketMutation } from "@/hooks"

interface MarketSelectProps {
	value?: string
	onValueChange?: (value: string) => void
	placeholder?: string
	className?: string
	disabled?: boolean
}

export function MarketSelect({
	value,
	onValueChange,
	placeholder = "Selecione o mercado",
	className = "w-full",
	disabled = false,
}: MarketSelectProps) {
	const { data: marketsData, isLoading } = useAllMarketsQuery()
	const createMarketMutation = useCreateMarketMutation()

	const markets = marketsData?.markets || []

	const handleCreateMarket = async (name: string) => {
		try {
			const newMarket = await createMarketMutation.mutateAsync({
				name: name.trim(),
			})
			onValueChange?.(newMarket.id)
		} catch (error) {
			console.error("Error creating market:", error)
		}
	}

	if (isLoading && markets.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
	}

	return (
		<Combobox
			options={markets.map((market) => ({
				value: market.id,
				label: `${market.name}${market.location ? ` - ${market.location}` : ""}`,
			}))}
			value={value}
			onValueChange={onValueChange}
			placeholder={placeholder}
			searchPlaceholder="Buscar mercado..."
			emptyText="Nenhum mercado encontrado."
			onCreateNew={handleCreateMarket}
			createNewText="Criar mercado"
			className={className}
			disabled={disabled}
		/>
	)
}
