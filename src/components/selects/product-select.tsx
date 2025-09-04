"use client"

import { ProductCombobox } from "@/components/ui/product-combobox"
import { TempStorage } from "@/lib/temp-storage"
import { useDataStore } from "@/store/useDataStore"
import { Product } from "@/types"
import { useEffect } from "react"

interface ProductSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  preserveFormData?: any
  itemIndex?: number
  products?: Product[]
  loading?: boolean
}

export function ProductSelect({
  value,
  onValueChange,
  placeholder = "Selecione o produto",
  className = "w-full",
  disabled = false,
  preserveFormData,
  itemIndex,
}: ProductSelectProps) {

  const { products, loading, fetchProducts } = useDataStore()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleCreateProduct = (name: string) => {
    if (preserveFormData) {
      // Usar targetItemIndex de preserveFormData se existir, senão usar itemIndex prop
      const targetIndex = preserveFormData.targetItemIndex !== undefined 
        ? preserveFormData.targetItemIndex 
        : itemIndex
      
      // Salvar dados no localStorage temporário incluindo o índice do item
      const dataToSave = {
        ...preserveFormData,
        targetItemIndex: targetIndex
      }
      const storageKey = TempStorage.save(dataToSave)
      
      // Navegar com key e nome
      const params = new URLSearchParams()
      params.set('name', name)
      params.set('returnTo', window.location.pathname)
      params.set('storageKey', storageKey)
      
      window.location.href = `/produtos/novo?${params.toString()}`
    } else {
      window.location.href = `/produtos/novo?name=${encodeURIComponent(name)}`
    }
  }

  if (loading.products && products.length === 0) {
    return (
      <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
    )
  }

  return (
    <ProductCombobox
      products={products}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar produto ou código de barras..."
      emptyText="Nenhum produto encontrado."
      onCreateNew={handleCreateProduct}
      createNewText="Criar produto"
      className={className}
      disabled={disabled}
    />
  )
}