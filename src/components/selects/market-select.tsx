"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Combobox } from "@/components/ui/combobox"
import { useDataStore } from "@/store/useDataStore" // Importar o store
import type { Market } from "@/types"

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
	// Obter dados e actions do store
	const { markets, loading, fetchMarkets, addMarket } = useDataStore()

	useEffect(() => {
		fetchMarkets() // Busca os mercados quando o componente é montado (se já não estiverem no cache)
	}, [fetchMarkets])

	const handleCreateMarket = async (name: string) => {
		try {
			const response = await fetch("/api/markets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim() }),
			})

			if (response.ok) {
				const newMarket: Market = await response.json()
				addMarket(newMarket) // Adiciona o novo mercado ao store
				onValueChange?.(newMarket.id)
				toast.success("Mercado criado com sucesso!")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao criar mercado")
			}
		} catch (error) {
			toast.error("Erro ao criar mercado")
		}
	}

	if (loading.markets && markets.length === 0) {
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
