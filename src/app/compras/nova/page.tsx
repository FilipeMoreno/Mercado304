"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ShoppingCart, Save, Plus, Trash2, Package, Camera } from "lucide-react"
import { MarketSelect } from "@/components/selects/market-select"
import { ProductSelect } from "@/components/selects/product-select"
import { TempStorage } from "@/lib/temp-storage"
import Link from "next/link"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { NovaCompraSkeleton } from "@/components/skeletons/nova-compra-skeleton"
import { PriceAlert } from "@/components/price-alert"
import { BestPriceAlert } from "@/components/best-price-alert"
import { toast } from "sonner"

interface PurchaseItem {
  id?: string
  productId: string
  quantity: number
  unitPrice: number
  priceAlert?: any
  bestPriceAlert?: any
}

interface QuickProduct {
  name: string
  categoryId: string
  unit: string
  brandId?: string
}

export default function NovaCompraPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [markets, setMarkets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [isRestoring, setIsRestoring] = useState(false)
  const restoredRef = React.useRef(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanningForIndex, setScanningForIndex] = useState<number | null>(null)
  const [showQuickProduct, setShowQuickProduct] = useState(false)
  const [quickProductForIndex, setQuickProductForIndex] = useState<number | null>(null)
  const [quickProduct, setQuickProduct] = useState<QuickProduct>({
    name: "",
    categoryId: "",
    unit: "unidade",
    brandId: ""
  })
  const [savingQuickProduct, setSavingQuickProduct] = useState(false)
  
  const [formData, setFormData] = useState({
    marketId: "",
    purchaseDate: new Date().toISOString().split('T')[0]
  })
  
  const [items, setItems] = useState<PurchaseItem[]>([
    { id: Math.random().toString(), productId: "", quantity: 1, unitPrice: 0, priceAlert: null, bestPriceAlert: null }
  ])
  const [checkingPrices, setCheckingPrices] = useState<boolean[]>([false])

  useEffect(() => {
    // Restaurar dados preservados após criação de produto
    const storageKey = searchParams.get('storageKey')
    if (storageKey && !restoredRef.current && !dataLoading) {
      restoredRef.current = true
      setIsRestoring(true)
      console.log('🔄 Restaurando dados com key:', storageKey)
      const preservedData = TempStorage.get(storageKey)
      console.log('📦 Dados preservados:', preservedData)
      
      if (preservedData) {
        try {
          // Restaurar dados do formulário
          if (preservedData.formData) {
            console.log('📝 Restaurando formData:', preservedData.formData)
            setFormData(preservedData.formData)
          }
          
          // Restaurar itens
          if (preservedData.items) {
            console.log('📋 Restaurando items:', preservedData.items)
            // Garantir que quantity e unitPrice sejam números e adicionar ID se não existir
            const normalizedItems = preservedData.items.map((item: any, idx: number) => ({
              ...item,
              id: item.id || `restored-${idx}-${Math.random().toString()}`,
              quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) || 1 : item.quantity,
              unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) || 0 : item.unitPrice
            }))
            setItems(normalizedItems)
            setCheckingPrices(new Array(normalizedItems.length).fill(false))
          }
          
          // Se um novo produto foi criado, selecionar no item correto
          if (preservedData.newProductId && preservedData.targetItemIndex !== undefined) {
            console.log('🆕 Selecionando novo produto:', preservedData.newProductId, 'no item:', preservedData.targetItemIndex)
            setTimeout(() => {
              updateItem(preservedData.targetItemIndex, "productId", preservedData.newProductId)
            }, 500) // Aguardar produtos carregarem
          }
          
          // Limpar localStorage e URL 
          TempStorage.remove(storageKey)
          window.history.replaceState({}, '', '/compras/nova')
          setIsRestoring(false)
        } catch (error) {
          console.error('Erro ao restaurar dados:', error)
          TempStorage.remove(storageKey)
        }
      } else {
        console.log('❌ Nenhum dado encontrado para key:', storageKey)
        setIsRestoring(false)
      }
    }
  }, [searchParams, dataLoading])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [marketsRes, productsRes] = await Promise.all([
        fetch('/api/markets'),
        fetch('/api/products')
      ])
      
      if (marketsRes.ok) setMarkets(await marketsRes.json())
      if (productsRes.ok) setProducts(await productsRes.json())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setDataLoading(false)
    }
  }

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), productId: "", quantity: 1, unitPrice: 0, priceAlert: null, bestPriceAlert: null }])
    setCheckingPrices([...checkingPrices, false])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
      setCheckingPrices(checkingPrices.filter((_, i) => i !== index))
    }
  }

  const checkPrice = async (index: number, productId: string, unitPrice: number) => {
    if (!productId || !unitPrice || !formData.marketId) return

    const newCheckingPrices = [...checkingPrices]
    newCheckingPrices[index] = true
    setCheckingPrices(newCheckingPrices)

    try {
      const response = await fetch('/api/price-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          currentPrice: unitPrice,
          currentMarketId: formData.marketId
        })
      })

      const alertData = await response.json()
      
      const newItems = [...items]
      newItems[index] = { ...newItems[index], priceAlert: alertData }
      setItems(newItems)
    } catch (error) {
      console.error('Erro ao verificar preço:', error)
    } finally {
      const newCheckingPrices = [...checkingPrices]
      newCheckingPrices[index] = false
      setCheckingPrices(newCheckingPrices)
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

  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)

    // Verificar preço automaticamente quando produto e preço são definidos
    if (field === 'unitPrice' || field === 'productId') {
      const item = newItems[index]
      if (item.productId && item.unitPrice > 0 && formData.marketId) {
        // Debounce para evitar muitas chamadas
        setTimeout(() => {
          checkPrice(index, item.productId, item.unitPrice)
          checkBestPrice(index, item.productId, item.unitPrice)
        }, 1000)
      }
    }
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  }

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`)
      if (response.ok) {
        const product = await response.json()
        if (scanningForIndex !== null) {
          updateItem(scanningForIndex, "productId", product.id)
        }
      } else {
        toast.error('Produto não encontrado para este código de barras')
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error)
      toast.error('Erro ao buscar produto')
    } finally {
      setShowScanner(false)
      setScanningForIndex(null)
    }
  }

  const openScanner = (index: number) => {
    setScanningForIndex(index)
    setShowScanner(true)
  }

  const openQuickProduct = (index: number) => {
    setQuickProductForIndex(index)
    setShowQuickProduct(true)
    setQuickProduct({ name: "", categoryId: "", unit: "unidade", brandId: "" })
  }


  const createQuickProduct = async () => {
    if (!quickProduct.name.trim()) {
      toast.error('Nome do produto é obrigatório')
      return
    }

    setSavingQuickProduct(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickProduct.name,
          categoryId: quickProduct.categoryId || null,
          unit: quickProduct.unit,
          brandId: quickProduct.brandId || null
        })
      })

      if (response.ok) {
        const newProduct = await response.json()
        setProducts(prev => [...prev, newProduct])
        
        if (quickProductForIndex !== null) {
          updateItem(quickProductForIndex, "productId", newProduct.id)
        }
        
        setShowQuickProduct(false)
        setQuickProductForIndex(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar produto')
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast.error('Erro ao criar produto')
    } finally {
      setSavingQuickProduct(false)
    }
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
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: formData.marketId,
          purchaseDate: formData.purchaseDate,
          items: validItems
        })
      })

      if (response.ok) {
        router.push('/compras')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar compra')
      }
    } catch (error) {
      console.error('Erro ao criar compra:', error)
      toast.error('Erro ao criar compra')
    } finally {
      setLoading(false)
    }
  }

  if (dataLoading || isRestoring) {
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
          <h1 className="text-3xl font-bold">Nova Compra</h1>
          <p className="text-gray-600 mt-2">
            Registre uma nova compra
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Informações da Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marketId">Mercado *</Label>
                <MarketSelect
                  value={formData.marketId}
                  markets={markets}
                  onValueChange={(value) => {
                    setFormData(prev => ({ ...prev, marketId: value }))
                    // Verificar preços novamente quando mercado muda
                    items.forEach((item, index) => {
                      if (item.productId && item.unitPrice > 0) {
                        setTimeout(() => checkPrice(index, item.productId, item.unitPrice), 500)
                      }
                    })
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Data da Compra</Label>
                <Input
                  id="purchaseDate"
                  name="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchaseDate: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-4xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens da Compra
              </CardTitle>
              <Button type="button" onClick={addItem} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={item.id || index} className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-4">
                    <div className="space-y-2">
                      <Label>Produto *</Label>
                      <ProductSelect
                        value={item.productId || ""}
                        products={products}
                        onValueChange={(value) => updateItem(index, "productId", value)}
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
                        min="0.01"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                        placeholder="1.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preço Unitário *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.unitPrice || ""}
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
                  
                  {/* Alert de Preço */}
                  {item.priceAlert && (
                    <PriceAlert 
                      alertData={item.priceAlert} 
                      loading={checkingPrices[index]} 
                    />
                  )}
                  
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
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openScanner(index)}
                        title="Escanear código de barras"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        Scanner
                      </Button>
                    </div>
                    
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-lg font-bold">
                Total da Compra: R$ {calculateTotal().toFixed(2)}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Compra"}
                </Button>
                <Link href="/compras">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      <BarcodeScanner 
        isOpen={showScanner}
        onScan={handleBarcodeScanned}
        onClose={() => {
          setShowScanner(false)
          setScanningForIndex(null)
        }}
      />
    </div>
  )
}