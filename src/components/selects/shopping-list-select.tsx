// src/components/selects/shopping-list-select.tsx
"use client"

import { useState, useEffect } from "react"
import { Combobox } from "@/components/ui/combobox"
import { ShoppingList } from "@/types"
import { toast } from "sonner"

interface ShoppingListSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function ShoppingListSelect({
  value,
  onValueChange,
  placeholder = "Selecione uma lista",
  className = "w-full",
  disabled = false
}: ShoppingListSelectProps) {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists')
      if (response.ok) {
        const data = await response.json()
        setLists(data.lists)
      } else {
        setLists([])
      }
    } catch (error) {
      console.error('Erro ao buscar listas:', error)
      setLists([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateList = async (name: string) => {
    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name.trim(),
          isActive: true
        })
      })

      if (response.ok) {
        const newList = await response.json()
        setLists(prev => [...prev, newList])
        onValueChange?.(newList.id)
        toast.success('Lista criada com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar lista')
      }
    } catch (error) {
      console.error('Erro ao criar lista:', error)
      toast.error('Erro ao criar lista')
    }
  }

  if (loading) {
    return (
      <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
    )
  }

  return (
    <Combobox
      options={lists.map(list => ({
        value: list.id,
        label: `${list.name} (${list.items?.length || 0} itens)`
      }))}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar lista..."
      emptyText="Nenhuma lista encontrada."
      onCreateNew={handleCreateList}
      createNewText="Criar lista"
      className={className}
      disabled={disabled}
    />
  )
}