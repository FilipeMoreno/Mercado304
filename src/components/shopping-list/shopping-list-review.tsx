"use client"

import { AlertCircle, Check, Link as LinkIcon, Package, Plus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ProductSelect } from "@/components/selects/product-select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ShoppingListItem {
  id: string
  productId?: string
  productName: string
  productUnit: string
  quantity: number
  estimatedPrice?: number
  brand?: string
  category?: string
  notes?: string
  isChecked: boolean
}

interface ReviewItem extends ShoppingListItem {
  unitPrice: number
  unitDiscount: number
  linkedProductId?: string
}

interface ShoppingListReviewProps {
  items: ShoppingListItem[]
  onConfirm: (items: ReviewItem[]) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
}

export function ShoppingListReview({ items, onConfirm, onCancel, isSubmitting }: ShoppingListReviewProps) {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>(
    items.map(item => ({
      ...item,
      linkedProductId: item.productId, // Já vinculado ou undefined
      unitPrice: item.estimatedPrice || 0,
      unitDiscount: 0,
    }))
  )

  const unlinkedCount = reviewItems.filter(item => !item.linkedProductId).length
  const linkedCount = reviewItems.filter(item => item.linkedProductId).length

  const handleProductLink = (index: number, productId: string, product: any) => {
    const newItems = [...reviewItems]
    newItems[index].linkedProductId = productId

    // Atualiza dados do produto se selecionado
    if (product) {
      toast.success(`"${newItems[index].productName}" vinculado a "${product.name}"`)
    }

    setReviewItems(newItems)
  }

  const handleUnlink = (index: number) => {
    const newItems = [...reviewItems]
    newItems[index].linkedProductId = undefined
    toast.info(`Item desvinculado, permanecerá como texto livre`)
    setReviewItems(newItems)
  }

  const handlePriceChange = (index: number, field: "unitPrice" | "unitDiscount", value: string) => {
    const newItems = [...reviewItems]
    newItems[index][field] = parseFloat(value) || 0
    setReviewItems(newItems)
  }

  const handleConfirm = async () => {
    // Valida se todos os itens tem preço
    const invalidItems = reviewItems.filter(item => !item.unitPrice || item.unitPrice <= 0)
    if (invalidItems.length > 0) {
      toast.error("Todos os itens precisam ter um preço unitário válido")
      return
    }

    await onConfirm(reviewItems)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Revisar Itens da Lista</h2>
        <p className="text-muted-foreground">
          Vincule os itens a produtos cadastrados e ajuste os preços antes de registrar a compra
        </p>
      </div>

      {/* Resumo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumo da Vinculação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">
                {linkedCount} vinculados
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {unlinkedCount} texto livre
              </Badge>
            </div>
          </div>

          {unlinkedCount > 0 && (
            <Alert className="mt-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {unlinkedCount} {unlinkedCount === 1 ? 'item permanecerá' : 'itens permanecerão'} como texto livre.
                Você pode vinculá-los a produtos cadastrados para melhor controle.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Lista de itens */}
      <div className="space-y-3">
        {reviewItems.map((item, index) => {
          const total = item.quantity * (item.unitPrice - (item.unitDiscount || 0))
          const isLinked = !!item.linkedProductId

          return (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {isLinked ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Package className="h-4 w-4 text-gray-400" />
                      )}
                      {item.productName}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {item.quantity} {item.productUnit}
                      {item.brand && ` • ${item.brand}`}
                      {item.category && ` • ${item.category}`}
                    </CardDescription>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        💬 {item.notes}
                      </p>
                    )}
                  </div>
                  {isLinked ? (
                    <Badge variant="default" className="bg-green-600">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Vinculado
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Texto livre
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vinculação de produto */}
                <div className="space-y-2">
                  <Label>Vincular a Produto (opcional)</Label>
                  <div className="flex gap-2">
                    <ProductSelect
                      value={item.linkedProductId}
                      onValueChange={(productId) => {
                        const product = null // TODO: buscar produto
                        handleProductLink(index, productId, product)
                      }}
                      placeholder="Buscar produto cadastrado..."
                      className="flex-1"
                    />
                    {isLinked && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUnlink(index)}
                        title="Desvincular produto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Preços */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Preço Unitário *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice || ""}
                      onChange={(e) => handlePriceChange(index, "unitPrice", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Desconto Unit. (opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitDiscount || ""}
                      onChange={(e) => handlePriceChange(index, "unitDiscount", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <Input
                      value={`R$ ${total.toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-4 pb-20 md:pb-4">
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 md:flex-initial"
        >
          {isSubmitting ? "Registrando..." : `Registrar Compra (${reviewItems.length} itens)`}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}

