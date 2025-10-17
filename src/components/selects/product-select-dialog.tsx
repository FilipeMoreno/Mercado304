"use client"

import { Camera } from "lucide-react"
import { useCallback, useMemo, useState } from "react"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useAllProductsQuery, useInfiniteProductsQuery } from "@/hooks"
import { useDebounce } from "@/hooks/use-debounce"
import { TempStorage } from "@/lib/temp-storage"
import type { Product } from "@/types"

interface ProductSelectDialogProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  preserveFormData?: any
  itemIndex?: number
  showScanButton?: boolean
}

export function ProductSelectDialog({
  value,
  onValueChange,
  placeholder = "Selecione o produto",
  className = "w-full",
  disabled = false,
  preserveFormData,
  itemIndex,
  showScanButton = true,
}: ProductSelectDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  // Query para todos os produtos (para encontrar o produto selecionado)
  const { data: allProductsData } = useAllProductsQuery()
  const allProducts = allProductsData?.products || []

  // Query infinita para o dropdown (com busca)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isPlaceholderData } =
    useInfiniteProductsQuery({
      search: debouncedSearch,
      enabled: true,
    })

  // Flatten all pages into a single array
  const products = useMemo(() => {
    return data?.pages.flatMap((page) => page.products) || []
  }, [data])

  // Encontrar o produto selecionado na lista completa
  const selectedProduct = useMemo(() => {
    if (!value) return null
    return allProducts.find((p: Product) => p.id === value) || null
  }, [value, allProducts])

  // Convert products to SelectOption format
  const options: SelectOption[] = useMemo(() => {
    return products.map((product) => {
      // Construir sublabel com marca, unidade e código
      const parts = []
      if (product.brand?.name) {
        parts.push(product.brand.name)
      }
      if (product.unit) {
        parts.push(product.unit)
      }
      if (product.barcode) {
        parts.push(product.barcode)
      }

      return {
        id: product.id,
        label: product.name,
        sublabel: parts.length > 0 ? parts.join(" • ") : undefined,
      }
    })
  }, [products])

  const handleSearchChange = useCallback((searchTerm: string) => {
    setSearch(searchTerm)
  }, [])

  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue)
      setSearch("")
      setOpen(false) // Fechar dialog após selecionar
    },
    [onValueChange],
  )

  const handleCreateProduct = (name: string) => {
    if (preserveFormData) {
      // Usar targetItemIndex de preserveFormData se existir, senão usar itemIndex prop
      const targetIndex = preserveFormData.targetItemIndex !== undefined ? preserveFormData.targetItemIndex : itemIndex

      // Salvar dados no localStorage temporário incluindo o índice do item
      const dataToSave = {
        ...preserveFormData,
        targetItemIndex: targetIndex,
      }
      const storageKey = TempStorage.save(dataToSave)

      // Navegar com key e nome
      const params = new URLSearchParams()
      params.set("name", name)
      params.set("returnTo", window.location.pathname)
      params.set("storageKey", storageKey)

      window.location.href = `/produtos/novo?${params.toString()}`
    } else {
      window.location.href = `/produtos/novo?name=${encodeURIComponent(name)}`
    }
  }

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      // Buscar produto pelo código de barras
      const response = await fetch(`/api/products/barcode/${barcode}`)
      if (response.ok) {
        const product = await response.json()
        onValueChange?.(product.id)
        setSearch("") // Limpar busca
        setOpen(false) // Fechar dialog
      } else {
        // Produto não encontrado, buscar no search para ver se encontra produtos similares
        setSearch(barcode)
      }
    } catch (error) {
      console.error("Erro ao buscar produto por código de barras:", error)
      // Em caso de erro, usar o código como busca
      setSearch(barcode)
    }
    setIsScannerOpen(false)
  }

  // Encontrar a opção selecionada atual
  const _selectedOption = useMemo(() => {
    if (!selectedProduct) return undefined

    // Construir sublabel com marca, unidade e código
    const parts = []
    if (selectedProduct.brand?.name) {
      parts.push(selectedProduct.brand.name)
    }
    if (selectedProduct.unit) {
      parts.push(selectedProduct.unit)
    }
    if (selectedProduct.barcode) {
      parts.push(`${selectedProduct.barcode}`)
    }

    return {
      id: selectedProduct.id,
      label: selectedProduct.name,
      sublabel: parts.length > 0 ? parts.join(" • ") : undefined,
    }
  }, [selectedProduct])

  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1">
          <ResponsiveSelectDialog
            open={open}
            onOpenChange={setOpen}
            value={value}
            onValueChange={handleValueChange}
            options={options}
            title="Selecionar Produto"
            placeholder={placeholder}
            searchPlaceholder="Buscar produto ou código de barras..."
            emptyText="Nenhum produto encontrado."
            isLoading={isLoading && products.length === 0}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            onSearchChange={handleSearchChange}
            onCreateNew={handleCreateProduct}
            createNewText="Criar produto"
            showCreateNew={true}
          />
        </div>
        {showScanButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsScannerOpen(true)}
            disabled={disabled}
            className="shrink-0"
            title="Escanear código de barras"
          >
            <Camera className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showScanButton && (
        <BarcodeScanner isOpen={isScannerOpen} onScan={handleBarcodeScanned} onClose={() => setIsScannerOpen(false)} />
      )}
    </>
  )
}

