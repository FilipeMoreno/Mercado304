"use client"

import { useCallback, useMemo, useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useCreateCategoryMutation, useInfiniteCategoriesQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"

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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isPlaceholderData } =
    useInfiniteCategoriesQuery({
      search: debouncedSearch,
      enabled: true,
    })

  const createCategoryMutation = useCreateCategoryMutation()

  // Flatten all pages into a single array
  const categories = useMemo(() => {
    return data?.pages.flatMap((page) => page.categories) || []
  }, [data])

  // Convert categories to SelectOption format
  const options: SelectOption[] = useMemo(() => {
    return categories.map((category) => ({
      id: category.id,
      label: category.name,
      icon: category.icon,
      sublabel: category.isFood ? "Alimento" : undefined,
    }))
  }, [categories])

  const handleSearchChange = useCallback((searchTerm: string) => {
    setSearch(searchTerm)
  }, [])

  const handleValueChange = useCallback(
    (newValue: string) => {
      console.log("[CategorySelectDialog] Value changed:", newValue)
      onValueChange?.(newValue)
      setSearch("")
    },
    [onValueChange],
  )

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
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onFetchNextPage={fetchNextPage}
      onSearchChange={handleSearchChange}
      onCreateNew={handleCreateCategory}
      createNewText="Criar categoria"
      showCreateNew={true}
    />
  )
}

