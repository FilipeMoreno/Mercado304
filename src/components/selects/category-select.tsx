"use client"

import { useEffect } from "react"
import { Combobox } from "@/components/ui/combobox"
import { Category } from "@/types"
import { toast } from "sonner"
import { useDataStore } from "@/store/useDataStore"
import { AppToasts } from "@/lib/toasts"

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
  // Obter dados e actions do store
  const { categories, loading, fetchCategories, addCategory } = useDataStore()

  useEffect(() => {
    fetchCategories() // Busca os dados se não estiverem em cache
  }, [fetchCategories])

  const handleCreateCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          icon: '📦' // Ícone padrão
        })
      })

      if (response.ok) {
        const newCategory: Category = await response.json()
        addCategory(newCategory) // Adiciona a nova categoria ao store
        onValueChange?.(newCategory.id)
        AppToasts.created("Categoria")
      } else {
        const error = await response.json()
        AppToasts.error(error, "Erro ao criar categoria")
      }
    } catch (error) {
      AppToasts.error(error, "Erro ao criar categoria")
    }
  }

  if (loading.categories && categories.length === 0) {
    return (
      <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
    )
  }

  return (
    <Combobox
      options={categories.map(category => ({
        value: category.id,
        label: `${category.icon || '📦'} ${category.name}`
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