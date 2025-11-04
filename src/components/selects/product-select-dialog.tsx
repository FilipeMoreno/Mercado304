"use client"

import { Camera } from "lucide-react"
import { useState, Activity } from "react"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { Button } from "@/components/ui/button"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { useAllProductsQuery } from "@/hooks"
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
  open?: boolean
  onOpenChange?: (open: boolean) => void
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
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ProductSelectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const debouncedSearch = useDebounce(search, 300)

  // Se open e onOpenChange forem fornecidos, usá-los; caso contrário, usar estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  // Buscar todos os produtos de uma vez (sem paginação)
  const { data: allProductsData, isLoading } = useAllProductsQuery()
  const allProducts = allProductsData?.products || []

  // Filtrar produtos baseado na busca
  const products = debouncedSearch
    ? allProducts.filter((product) =>
      product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      product.barcodes?.some((b) => b.barcode.includes(debouncedSearch))
    )
    : allProducts

  // Encontrar o produto selecionado
  const selectedProduct = !value ? null : allProducts.find((p: Product) => p.id === value) || null

  // Convert products to SelectOption format
  const options: SelectOption[] = products.map((product) => {
    // Construir sublabel com marca, pacote, quantidade e código
    const parts = []
    if (product.brand?.name) {
      parts.push(product.brand.name)
    }
    if (product.unit) {
      parts.push(product.unit)
    }
    if (product.packageSize) {
      parts.push(product.packageSize)
    }

    // Usar código de barras primário da nova tabela
    const primaryBarcode = product.barcodes?.find((b: any) => b.isPrimary) || product.barcodes?.[0]
    const barcode = primaryBarcode?.barcode || product.barcode // Fallback para campo antigo
    if (barcode) {
      parts.push(barcode)
    }

    return {
      id: product.id,
      label: product.name,
      sublabel: parts.length > 0 ? parts.join(" • ") : undefined,
    }
  })

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm)
  }

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue)
    setSearch("")
    setOpen(false) // Fechar dialog após selecionar
  }

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
  const _selectedOption = (() => {
    if (!selectedProduct) return undefined

    // Construir sublabel com marca, pacote, quantidade e código
    const parts = []
    if (selectedProduct.brand?.name) {
      parts.push(selectedProduct.brand.name)
    }
    if (selectedProduct.unit) {
      parts.push(selectedProduct.unit)
    }
    if (selectedProduct.packageSize) {
      parts.push(selectedProduct.packageSize)
    }
    if (selectedProduct.barcode) {
      parts.push(`${selectedProduct.barcode}`)
    }

    return {
      id: selectedProduct.id,
      label: selectedProduct.name,
      sublabel: parts.length > 0 ? parts.join(" • ") : undefined,
    }
  })()

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
            hasNextPage={false}
            isFetchingNextPage={false}
            onFetchNextPage={undefined}
            onSearchChange={handleSearchChange}
            onCreateNew={handleCreateProduct}
            createNewText="Criar produto"
            showCreateNew={true}
          />
        </div>
        <Activity mode={showScanButton ? 'visible' : 'hidden'}>
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
        </Activity>
      </div>

      <Activity mode={showScanButton ? 'visible' : 'hidden'}>
        <BarcodeScanner isOpen={isScannerOpen} onScan={handleBarcodeScanned} onClose={() => setIsScannerOpen(false)} />
      </Activity>
    </>
  )
}

