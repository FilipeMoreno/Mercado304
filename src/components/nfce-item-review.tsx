"use client"

import React, { useState, useEffect } from "react"
import { PlusCircle, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ProductSelect } from "@/components/selects/product-select";
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brand, Category, Product } from "@prisma/client"
import { cn } from "@/lib/utils"
import { Dialog } from "@/components/ui/dialog"
import { QuickProductForm } from "@/components/quick-product-form"
import { QuickBrandForm } from "@/components/quick-brand-form"
import { normalizeBarcode } from "@/lib/barcode-utils"

// Interfaces para os dados da nota e itens mapeados
export interface NfceItem {
  name: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number // Adicionei de volta para consistência
  code?: string // Código de barras do produto (opcional)
}

export interface MappedPurchaseItem {
  productId: string
  productName: string
  quantity: number
  price: number
}

interface NfceItemReviewProps {
  items: NfceItem[]
  onConfirm: (mappedItems: MappedPurchaseItem[]) => void
  onCancel: () => void
  isSubmitting: boolean
}

// Tipo correto para o estado interno do componente
type MappedItemState = MappedPurchaseItem & {
  originalName: string
  isAssociated: boolean
}

const NfceItemReview: React.FC<NfceItemReviewProps> = ({ items, onConfirm, onCancel, isSubmitting }) => {
  const [mappedItems, setMappedItems] = useState<MappedItemState[]>(() =>
    items.map((item) => ({
      productId: "",
      productName: "",
      quantity: item.quantity,
      price: item.unitPrice,
      originalName: item.name,
      isAssociated: false,
    })),
  )
  const [isInitialized, setIsInitialized] = useState(false)

  // Estados para controlar os dialogs
  const [isCreateProductDialogOpen, setIsCreateProductDialogOpen] = useState(false)
  const [isCreateBrandDialogOpen, setIsCreateBrandDialogOpen] = useState(false)
  const [currentItemIndexForCreation, setCurrentItemIndexForCreation] = useState<number | null>(null)

  // Função para buscar produto por código de barras
  const fetchProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      // Primeiro tenta com o código original
      let response = await fetch(`/api/products/barcode/${barcode}`)
      
      if (!response.ok && response.status === 404) {
        // Se não encontrou, tenta com o código normalizado
        const normalizedCode = normalizeBarcode(barcode)
        if (normalizedCode !== barcode) {
          response = await fetch(`/api/products/barcode/${normalizedCode}`)
        }
      }

      if (response.ok) {
        return await response.json()
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar produto por código de barras:', error)
      return null
    }
  }

  // Inicialização automática dos produtos baseada nos códigos de barras
  useEffect(() => {
    const initializeProducts = async () => {
      if (isInitialized) return

      const updatedItems = [...mappedItems]
      let hasChanges = false

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.code) {
          const product = await fetchProductByBarcode(item.code)
          if (product) {
            updatedItems[i] = {
              ...updatedItems[i],
              productId: product.id,
              productName: product.name,
              isAssociated: true,
            }
            hasChanges = true
            toast.success(`Produto "${product.name}" associado automaticamente pelo código ${item.code}.`)
          }
        }
      }

      if (hasChanges) {
        setMappedItems(updatedItems)
      }
      setIsInitialized(true)
    }

    initializeProducts()
  }, [items, mappedItems, isInitialized])

  // Função para remover um item da lista
  const handleRemoveItem = (index: number) => {
    const newItems = mappedItems.filter((_, i) => i !== index)
    setMappedItems(newItems)
    toast.success("Item removido da revisão.")
  }

  const handleProductChange = (index: number, product: Product | null) => {
    const newItems = [...mappedItems]
    if (product) {
      newItems[index].productId = product.id
      newItems[index].productName = product.name
      newItems[index].isAssociated = true
      toast.success(`"${newItems[index].originalName}" associado a "${product.name}".`)
    } else {
      newItems[index].productId = ""
      newItems[index].productName = ""
      newItems[index].isAssociated = false
    }
    setMappedItems(newItems)
  }

  const handleFieldChange = (index: number, field: "quantity" | "price", value: string) => {
    const newItems = [...mappedItems]
    const numericValue = parseFloat(value) || 0
    newItems[index][field] = numericValue
    setMappedItems(newItems)
  }

  const openCreateProductDialog = (index: number) => {
    setCurrentItemIndexForCreation(index)
    setIsCreateProductDialogOpen(true)
  }
  
  const openCreateBrandDialog = () => {
    setIsCreateBrandDialogOpen(true)
  }

  // Função chamada quando um novo produto é criado com sucesso pelo dialog
  const handleProductCreated = (newProduct: Product & { brand: Brand | null; category: Category }) => {
    if (currentItemIndexForCreation === null) return

    // Associa automaticamente o item ao produto recém-criado
    handleProductChange(currentItemIndexForCreation, newProduct)
    setIsCreateProductDialogOpen(false)
    setCurrentItemIndexForCreation(null)
  }

  const handleSubmit = () => {
    const confirmedItems = mappedItems
      .filter((item) => item.isAssociated && item.productId && item.productId !== "")
      .map(({ originalName, isAssociated, ...rest }) => rest)

    if (confirmedItems.length === 0) {
      toast.error("Nenhum item foi associado a um produto.", {
        description: "Associe pelo menos um item da nota para poder salvar.",
      })
      return
    }

    onConfirm(confirmedItems)
  }

  const associatedItemsCount = mappedItems.filter((item) => item.isAssociated).length
  const currentItemToCreate =
    currentItemIndexForCreation !== null ? mappedItems[currentItemIndexForCreation] : null

  // Função para lidar com a criação de uma nova marca
  const handleBrandCreated = (newBrand: Brand) => {
    setIsCreateBrandDialogOpen(false)
    toast.success(`Marca ${newBrand.name} criada com sucesso!`)
  }

  return (
    <>
      <Dialog open={isCreateProductDialogOpen} onOpenChange={setIsCreateProductDialogOpen}>
        {isCreateProductDialogOpen && currentItemIndexForCreation !== null && (
          <QuickProductForm
            onClose={() => setIsCreateProductDialogOpen(false)}
            onProductCreated={handleProductCreated}
            onOpenBrandForm={openCreateBrandDialog}
          />
        )}
      </Dialog>

      <Dialog open={isCreateBrandDialogOpen} onOpenChange={setIsCreateBrandDialogOpen}>
        {isCreateBrandDialogOpen && (
          <QuickBrandForm
            onClose={() => setIsCreateBrandDialogOpen(false)}
            onBrandCreated={handleBrandCreated}
          />
        )}
      </Dialog>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Revise e Associe os Itens</CardTitle>
          <CardDescription>
            Associe os itens da nota fiscal aos seus produtos cadastrados.
          </CardDescription>
        </CardHeader>
        <CardContent>

          <div className="space-y-6">
            {mappedItems.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 border rounded-lg space-y-4 transition-all",
                  item.isAssociated ? "border-green-500 bg-green-500/5" : "",
                )}
              >
                <p className="text-sm font-semibold text-muted-foreground">
                  Item da Nota:{" "}
                  <span className="font-bold text-primary">{item.originalName}</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* --- CORREÇÃO DE LAYOUT E LÓGICA AQUI --- */}
                  <div className="flex-grow">
                    <Label>Associar ao Produto</Label>
                    <ProductSelect
                      value={item.productId ? item.productId.toString() : undefined}
                      onValueChange={(value) => {
                        if (value) {
                          // Buscar o produto pelo ID para obter o nome
                          fetch(`/api/products/${value}`)
                            .then(res => res.json())
                            .then(product => {
                              handleProductChange(index, product);
                            })
                            .catch(err => {
                              console.error("Erro ao buscar produto:", err);
                            });
                        } else {
                          handleProductChange(index, null);
                        }
                      }}
                    />
                  </div>
                  <div className="sm:self-end flex gap-2">
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => openCreateProductDialog(index)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Novo
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      title="Remover item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => handleFieldChange(index, "quantity", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`price-${index}`}>Preço Unitário</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => handleFieldChange(index, "price", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {associatedItemsCount} de {mappedItems.length} itens associados.
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || associatedItemsCount === 0}>
              {isSubmitting ? "Salvando..." : `Salvar ${associatedItemsCount} Itens`}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}

export default NfceItemReview