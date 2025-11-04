"use client"

import { useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useCreateBrandMutation, useAllBrandsQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import type { Brand } from "@/types"

interface BrandSelectDialogProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function BrandSelectDialog({
  value,
  onValueChange,
  placeholder = "Selecione uma marca",
  disabled = false,
}: BrandSelectDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)

  // Buscar todas as marcas de uma vez (sem paginação)
  const { data: allBrandsData, isLoading } = useAllBrandsQuery()
  const allBrands = (allBrandsData as Brand[] | undefined) || []

  const createBrandMutation = useCreateBrandMutation()

  // Filtrar brands baseado na busca
  const brands = debouncedSearch
    ? allBrands.filter((brand) =>
      brand.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
    : allBrands

  // Convert brands to SelectOption format
  const options: SelectOption[] = brands.map((brand) => ({ id: brand.id, label: brand.name }))

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm)
  }

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue)
    setSearch("")
    setOpen(false)
  }

  const handleCreateBrand = async (name: string) => {
    try {
      console.log("[BrandSelectDialog] Creating brand:", name)
      const newBrand = await createBrandMutation.mutateAsync({
        name: name.trim(),
      })
      console.log("[BrandSelectDialog] Brand created:", newBrand)

      // Define o valor imediatamente após a criação
      onValueChange?.(newBrand.id)
      setSearch("")
      setOpen(false) // Fechar dialog após criar
    } catch (error) {
      console.error("Error creating brand:", error)
    }
  }

  return (
    <ResponsiveSelectDialog
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={handleValueChange}
      options={options}
      title="Selecionar Marca"
      placeholder={placeholder}
      searchPlaceholder="Buscar marca..."
      emptyText="Nenhuma marca encontrada."
      isLoading={isLoading && brands.length === 0}
      hasNextPage={false}
      isFetchingNextPage={false}
      onFetchNextPage={undefined}
      onSearchChange={handleSearchChange}
      onCreateNew={handleCreateBrand}
      createNewText="Criar marca"
      showCreateNew={true}
    />
  )
}

