"use client"

import { Combobox } from "@/components/ui/combobox"
import { Brand } from "@/types"
import { toast } from "sonner"

interface BrandSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  onBrandCreated?: (brand: Brand) => void
  brands?: Brand[]
  loading?: boolean
}

export function BrandSelect({
  value,
  onValueChange,
  placeholder = "Selecione uma marca",
  className = "w-full",
  disabled = false,
  onBrandCreated,
  brands = [],
  loading = false
}: BrandSelectProps) {

  const handleCreateBrand = async (name: string) => {
    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })

      if (response.ok) {
        const newBrand = await response.json()
        onValueChange?.(newBrand.id)
        onBrandCreated?.(newBrand)
        toast.success('Marca criada com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar marca')
      }
    } catch (error) {
      console.error('Erro ao criar marca:', error)
      toast.error('Erro ao criar marca')
    }
  }

  if (loading) {
    return (
      <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
    )
  }

  return (
    <Combobox
      options={brands.map(brand => ({
        value: brand.id,
        label: brand.name
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