"use client"

import { useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useCreateCategoryMutation, useAllCategoriesQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Category } from "@/types"

interface CategorySelectDialogProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CategorySelectDialog({
  value,
  onValueChange,
  placeholder = "Selecione uma categoria",
  disabled = false,
}: CategorySelectDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  // Buscar todas as categorias de uma vez (sem paginação)
  const { data: allCategoriesData, isLoading } = useAllCategoriesQuery()
  const allCategories = (allCategoriesData as Category[] | undefined) || []

  const createCategoryMutation = useCreateCategoryMutation()

  // Filtrar categories baseado na busca
  const categories = debouncedSearch
    ? allCategories.filter((category) =>
      category.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    : allCategories

  // Convert categories to SelectOption format
  const options: SelectOption[] = categories.map((category) => ({
    id: category.id,
    label: category.name,
    icon: category.icon,
    sublabel: category.isFood ? "Alimento" : undefined,
  }))

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm)
  }

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue)
    setSearch("")
    setOpen(false)
  }

  const handleCreateCategory = async (name: string) => {
    try {
      console.log("[CategorySelectDialog] Creating category:", name)
      const newCategory = await createCategoryMutation.mutateAsync({
        name: name.trim(),
        icon: "📦", // Ícone padrão
        isFood: false, // Padrão para não-alimento
      })
      console.log("[CategorySelectDialog] Category created:", newCategory)

      // Define o valor imediatamente após a criação
      onValueChange?.(newCategory.id)
      setSearch("")
      setOpen(false) // Fechar dialog após criar
    } catch (error) {
      console.error("Error creating category:", error)
    }
  }

  return (
    <ResponsiveSelectDialog
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={handleValueChange}
      options={options}
      title="Selecionar Categoria"
      placeholder={placeholder}
      searchPlaceholder="Buscar categoria..."
      emptyText="Nenhuma categoria encontrada."
      isLoading={isLoading && categories.length === 0}
      hasNextPage={false}
      isFetchingNextPage={false}
      onFetchNextPage={undefined}
      onSearchChange={handleSearchChange}
      onCreateNew={handleCreateCategory}
      createNewText="Criar categoria"
      showCreateNew={true}
    />
  )
}

