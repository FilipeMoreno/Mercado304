"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { AppToasts } from "@/lib/toasts"
import { createShoppingList } from "@/services/shoppingListService"
import { useDataStore } from "@/store/useDataStore"

interface ShoppingListSelectDialogProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function ShoppingListSelectDialog({
  value,
  onValueChange,
  placeholder = "Selecione uma lista",
  disabled = false,
}: ShoppingListSelectDialogProps) {
  const [open, setOpen] = useState(false)
  const { shoppingLists, loading, fetchShoppingLists } = useDataStore()
  const hasFetched = useRef(false)

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true
      fetchShoppingLists()
    }
  }, [fetchShoppingLists])

  // Convert shopping lists to SelectOption format
  const options: SelectOption[] = useMemo(() => {
    return shoppingLists.map((list) => ({
      id: list.id,
      label: list.name,
      sublabel: `${list.items?.length || 0} itens`,
      icon: "📝",
    }))
  }, [shoppingLists])

  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue)
      setOpen(false) // Fechar dialog após selecionar
    },
    [onValueChange],
  )

  const handleCreateList = async (name: string) => {
    try {
      const newList = await createShoppingList({
        name: name.trim(),
        isActive: true,
      })
      fetchShoppingLists(true) // Força a atualização da lista
      onValueChange?.(newList.id)
      AppToasts.created("Lista")
      setOpen(false) // Fechar dialog após criar
    } catch (error) {
      AppToasts.error(error, "Erro ao criar lista")
    }
  }

  if (loading.shoppingLists && shoppingLists.length === 0) {
    return <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse w-full" />
  }

  return (
    <ResponsiveSelectDialog
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={handleValueChange}
      options={options}
      title="Selecionar Lista de Compras"
      placeholder={placeholder}
      searchPlaceholder="Buscar lista..."
      emptyText="Nenhuma lista encontrada."
      isLoading={loading.shoppingLists && shoppingLists.length === 0}
      onCreateNew={handleCreateList}
      createNewText="Criar lista"
      showCreateNew={true}
    />
  )
}

