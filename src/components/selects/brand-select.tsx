"use client"

import { useEffect } from "react"
import { toast } from "sonner"
import { Combobox } from "@/components/ui/combobox"
import { AppToasts } from "@/lib/toasts"
import { useDataStore } from "@/store/useDataStore"
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
	// Obter dados e actions do store
	const { brands, loading, fetchBrands, addBrand } = useDataStore()

	useEffect(() => {
		fetchBrands() // Busca os dados se não estiverem em cache
	}, [fetchBrands])

	const handleCreateBrand = async (name: string) => {
		try {
			const response = await fetch("/api/brands", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim() }),
			})

			if (response.ok) {
				const newBrand: Brand = await response.json()
				addBrand(newBrand) // Adiciona a nova marca ao store
				onValueChange?.(newBrand.id)
				AppToasts.created("Marca")
			} else {
				const error = await response.json()
				AppToasts.error(error, "Erro ao criar marca")
			}
		} catch (error) {
			AppToasts.error(error, "Erro ao criar marca")
		}
	}

	if (loading.brands && brands.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
	}

	return (
		<Combobox
			options={brands.map((brand) => ({
				value: brand.id,
				label: brand.name,
			}))}
			value={value}
			onValueChange={onValueChange}
			placeholder={placeholder}
			searchPlaceholder="Buscar marca..."
			emptyText="Nenhuma marca encontrada."
			onCreateNew={handleCreateBrand}
			createNewText="Criar marca"
			className={className}
			disabled={disabled}
		/>
	)
}
