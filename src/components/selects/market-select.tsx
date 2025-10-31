"use client"

import { useState } from "react"
import { Combobox } from "@/components/ui/combobox"
import { useMarketsQuery, useCreateMarketMutation } from "@/hooks"

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
	const { data: marketsData, isLoading } = useMarketsQuery()
	const createMarketMutation = useCreateMarketMutation()

	const markets = marketsData?.markets || []

	const [pendingMarketName, setPendingMarketName] = useState<string | null>(null)

	const handleCreateMarket = async (name: string) => {
		try {
			console.log("[MarketSelect] Creating market:", name)
			const newMarket = await createMarketMutation.mutateAsync({
				name: name.trim(),
			})
			console.log("[MarketSelect] Market created:", newMarket)

			// Define o valor imediatamente após a criação (converter para string)
			console.log("[MarketSelect] Setting value immediately:", newMarket.id)
			onValueChange?.(String(newMarket.id))

			// Define o nome do mercado pendente para exibição
			setPendingMarketName(newMarket.name)

			// Limpa o nome pendente após 3 segundos (quando a lista deve estar atualizada)
			setTimeout(() => {
				setPendingMarketName(null)
			}, 3000)

		} catch (error) {
			console.error("Error creating market:", error)
		}
	}

	if (isLoading && markets.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
	}

	// Função para obter o label do mercado selecionado
	const getSelectedMarketLabel = () => {
		if (!value) return placeholder

		// Garantir comparação consistente convertendo ambos para string
		const selectedMarket = markets.find((m: any) => String(m.id) === String(value))
		if (selectedMarket) {
			return `${selectedMarket.name}${selectedMarket.location ? ` - ${selectedMarket.location}` : ""}`
		}

		// Se não encontrou o mercado na lista, pode ser um mercado recém-criado
		return pendingMarketName || "Mercado selecionado"
	}

	return (
		<Combobox
			options={markets.map((market: any) => ({
				value: String(market.id), // Garantir que o value seja string
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
			selectedLabel={getSelectedMarketLabel()}
		/>
	)
}
