"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ShoppingCart, Save, Plus, Trash2, Package, Edit } from "lucide-react"
import { MarketSelect } from "@/components/selects/market-select"
import { ProductSelect } from "@/components/selects/product-select"
import { TempStorage } from "@/lib/temp-storage"
import Link from "next/link"
import { Market } from "@/types"
import { NovaCompraSkeleton } from "@/components/skeletons/nova-compra-skeleton"
import { BestPriceAlert } from "@/components/best-price-alert"
import { toast } from "sonner"

interface PurchaseItem {
  productId: string
  quantity: number
  unitPrice: number
  bestPriceAlert?: any
}

export default function EditarCompraPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [markets, setMarkets] = useState<Market[]>([])
  const [loadingData, setLoadingData] = useState(true)
  
  const [formData, setFormData] = useState({
    marketId: "",
    purchaseDate: ""
  })
  
  const [items, setItems] = useState<PurchaseItem[]>([])

  useEffect(() => {
    if (params.id) {
      fetchData()
    }
  }, [params.id])

  useEffect(() => {
    // Restaurar dados preservados após criação de produto
    const storageKey = searchParams.get('storageKey')
    if (storageKey) {
      const preservedData = TempStorage.get(storageKey)
      if (preservedData) {
        try {
          // Restaurar dados do formulário
          if (preservedData.formData) {
            setFormData(preservedData.formData)
          }
          
          // Restaurar itens
          if (preservedData.items) {
            setItems(preservedData.items)
          }
          
          // Se um novo produto foi criado, selecionar no item correto
          if (preservedData.newProductId && preservedData.targetItemIndex !== undefined) {
            setTimeout(() => {
              updateItem(preservedData.targetItemIndex, "productId", preservedData.newProductId)
            }, 1000) // Aguardar produtos carregarem
          }
          
          // Limpar localStorage e URL
          TempStorage.remove(storageKey)
          window.history.replaceState({}, '', `/compras/editar/${params.id}`)
        } catch (error) {
          console.error('Erro ao restaurar dados:', error)
          TempStorage.remove(storageKey)
        }
      }
    }
  }, [searchParams])

  const fetchData = async () => {
    try {
      const [marketsRes, purchaseRes, productsRes] = await Promise.all([
        fetch('/api/markets'),
        fetch(`/api/purchases/${params.id}`),
        fetch('/api/products')
      ])
      
      const [marketsData, purchaseData, productsData] = await Promise.all([
        marketsRes.json(),
        purchaseRes.json(),
        productsRes.json()
      ])
      
      if (!purchaseRes.ok) {
        toast.error('Compra não encontrada')
        router.push('/compras')
        return
      }
      
      setMarkets(marketsData)
      setProducts(productsData)
      
      // Preencher dados da compra
      setFormData({
        marketId: purchaseData.marketId,
        purchaseDate: purchaseData.purchaseDate.split('T')[0]
      })
      
      setItems(purchaseData.items.map((item: any) => ({
        productId: item.productId || "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        bestPriceAlert: null
      })))
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
      router.push('/compras')
    } finally {
      setLoadingData(false)
    }
  }

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)

    // Verificar melhor preço quando produto e preço são definidos
    if (field === 'unitPrice' || field === 'productId') {
      const item = newItems[index]
      if (item.productId && item.unitPrice > 0) {
        setTimeout(() => {
          checkBestPrice(index, item.productId, item.unitPrice)
        }, 1000)
      }
    }
  }

  const checkBestPrice = async (index: number, productId: string, unitPrice: number) => {
    if (!productId || !unitPrice) return

    try {
      const response = await fetch('/api/best-price-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          currentPrice: unitPrice
        })
      })

      const bestPriceData = await response.json()
      
      const newItems = [...items]
      newItems[index] = { ...newItems[index], bestPriceAlert: bestPriceData }
      setItems(newItems)
    } catch (error) {
      console.error('Erro ao verificar melhor preço:', error)
    }
  }

  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, unitPrice: 0, bestPriceAlert: null }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      return sum + (item.quantity * item.unitPrice)
    }, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.marketId) {
      toast.error('Selecione um mercado')
      return
    }

    const validItems = items.filter(item => 
      item.productId && item.quantity > 0 && item.unitPrice > 0
    )

    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item válido')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/purchases/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: formData.marketId,
          items: validItems,
          purchaseDate: formData.purchaseDate
        })
      })

      if (response.ok) {
        toast.error('Compra atualizada com sucesso!')
        router.push('/compras')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar compra')
      }
    } catch (error) {
      console.error('Erro ao atualizar compra:', error)
      toast.error('Erro ao atualizar compra')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return <NovaCompraSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/compras">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Edit className="h-8 w-8" />
            Editar Compra
          </h1>
          <p className="text-gray-600 mt-2">
            Modifique os dados da compra
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="market">Mercado *</Label>
                <MarketSelect
                  value={formData.marketId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, marketId: value }))}
                  markets={markets}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data da Compra</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Itens da Compra</CardTitle>
            <Button type="button" onClick={addItem} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Item
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => {
              const selectedProduct = products.find(p => p.id === item.productId)
              
              return (
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Produto *</Label>
                      <ProductSelect
                        value={item.productId}
                        onValueChange={(value) => updateItem(index, "productId", value)}
                        products={products}
                        preserveFormData={{
                          formData,
                          items,
                          targetItemIndex: index
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Preço Unitário (R$) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input
                        value={`R$ ${(item.quantity * item.unitPrice).toFixed(2)}`}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  {/* Alert de Menor Preço */}
                  {item.bestPriceAlert && item.bestPriceAlert.isBestPrice && !item.bestPriceAlert.isFirstRecord && (
                    <BestPriceAlert
                      productName={products.find(p => p.id === item.productId)?.name || 'Produto'}
                      currentPrice={item.unitPrice}
                      previousBestPrice={item.bestPriceAlert.previousBestPrice}
                      totalRecords={item.bestPriceAlert.totalRecords}
                      onClose={() => {
                        const newItems = [...items]
                        newItems[index] = { ...newItems[index], bestPriceAlert: null }
                        setItems(newItems)
                      }}
                    />
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {selectedProduct && (
                        <span>
                          Unidade: {selectedProduct.unit}
                          {selectedProduct.category && ` • Categoria: ${selectedProduct.category.name}`}
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total da Compra:</span>
              <span>R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex gap-4 mt-6">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Link href="/compras">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}