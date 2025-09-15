"use client"

import { Combobox } from "@/components/ui/combobox"
import { useAllCategoriesQuery, useCreateCategoryMutation } from "@/hooks"
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
	// Usar React Query para buscar categorias
	const { data: categories = [], isLoading } = useAllCategoriesQuery()
	const createCategoryMutation = useCreateCategoryMutation()

	const handleCreateCategory = async (name: string) => {
		try {
			const newCategory = await createCategoryMutation.mutateAsync({
				name: name.trim(),
				icon: "📦", // Ícone padrão
				isFood: false, // Padrão para não-alimento
			})
			onValueChange?.(newCategory.id)
		} catch (error) {
			console.error("Erro ao criar categoria:", error)
		}
	}

	if (isLoading && categories.length === 0) {
		return <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
	}

	return (
		<Combobox
			options={categories.map((category: Category) => ({
				value: category.id,
				label: `${category.icon || "📦"} ${category.name}`,
			}))}
			value={value}
			onValueChange={onValueChange}
			placeholder={placeholder}
			searchPlaceholder="Buscar categoria..."
			emptyText="Nenhuma categoria encontrada."
			onCreateNew={handleCreateCategory}
			createNewText="Criar categoria"
			className={className}
			disabled={disabled}
		/>
	)
}
