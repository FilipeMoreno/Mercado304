"use client"

import { Combobox } from "@/components/ui/combobox"
import { Category } from "@/types"
import { toast } from "sonner"

interface CategorySelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  onCategoryCreated?: (category: Category) => void
  categories?: Category[]
  loading?: boolean
}

export function CategorySelect({
  value,
  onValueChange,
  placeholder = "Selecione uma categoria",
  className = "w-full",
  disabled = false,
  onCategoryCreated,
  categories = [],
  loading = false
}: CategorySelectProps) {

  const handleCreateCategory = async (name: string) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          icon: '📦'
        })
      })

      if (response.ok) {
        const newCategory = await response.json()
        onValueChange?.(newCategory.id)
        onCategoryCreated?.(newCategory)
        toast.success('Categoria criada com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar categoria')
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      toast.error('Erro ao criar categoria')
    }
  }

  if (loading) {
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