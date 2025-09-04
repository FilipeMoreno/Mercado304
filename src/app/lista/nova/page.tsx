"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, List, Save, Plus, Trash2, Camera } from "lucide-react"
import Link from "next/link"
import { Product, Brand } from "@/types"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { NovaListaSkeleton } from "@/components/skeletons/nova-lista-skeleton"
import { ProductSelect } from "@/components/selects/product-select"
import { TempStorage } from "@/lib/temp-storage"
import { RelatedProductsCard } from "@/components/related-products-card"
import { PriceAlert } from "@/components/price-alert"

import { toast } from "sonner"

interface ShoppingListItem {
  productId: string
  quantity: number
  estimatedPrice?: number | string
  priceAlert?: any
}

export default function NovaListaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanningForIndex, setScanningForIndex] = useState<number | null>(null)
  
  // Estados para diálogos de criação rápida
  const [showQuickProduct, setShowQuickProduct] = useState(false)
  const [quickProductForIndex, setQuickProductForIndex] = useState<number | null>(null)
  const [showQuickBrand, setShowQuickBrand] = useState(false)

  const [selectedProductIdForSuggestions, setSelectedProductIdForSuggestions] = useState<string | null>(null)
  const [checkingPrices, setCheckingPrices] = useState<boolean[]>([false])
  
  const [listName, setListName] = useState("")
  
  const [items, setItems] = useState<ShoppingListItem[]>([
    { productId: "", quantity: 1, estimatedPrice: "", priceAlert: null }
  ])

  const [relatedProductsVisibility, setRelatedProductsVisibility] = useState<boolean[]>(new Array(items.length).fill(true))
  const [priceAlertVisibility, setPriceAlertVisibility] = useState<boolean[]>(new Array(items.length).fill(true))


  useEffect(() => {
    const storageKey = searchParams.get('storageKey')
    if (storageKey) {
      const preservedData = TempStorage.get(storageKey)
      if (preservedData) {
        try {
          if (preservedData.listName) {
            setListName(preservedData.listName)
          }
          
          if (preservedData.items) {
            setItems(preservedData.items)
          }
          
          if (preservedData.newProductId && preservedData.targetItemIndex !== undefined) {
            setTimeout(() => {
              updateItem(preservedData.targetItemIndex, "productId", preservedData.newProductId)
            }, 1000)
          }
          
          TempStorage.remove(storageKey)
          window.history.replaceState({}, '', '/lista/nova')
        } catch (error) {
          console.error('Erro ao restaurar dados:', error)
          TempStorage.remove(storageKey)
        }
      }
    }
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [productsRes, brandsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/brands')
      ])
      
      if (productsRes.ok) setProducts(await productsRes.json())
      if (brandsRes.ok) setBrands(await brandsRes.json())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setDataLoading(false)
    }
  }


  const addItem = () => {
    setItems([...items, { productId: "", quantity: 1, estimatedPrice: "", priceAlert: null }])
    setCheckingPrices([...checkingPrices, false])
    setRelatedProductsVisibility([...relatedProductsVisibility, true])
    setPriceAlertVisibility([...priceAlertVisibility, true])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
      setCheckingPrices(checkingPrices.filter((_, i) => i !== index))
      setRelatedProductsVisibility(relatedProductsVisibility.filter((_, i) => i !== index))
      setPriceAlertVisibility(priceAlertVisibility.filter((_, i) => i !== index))
    }
  }

  const checkPrice = async (index: number, productId: string, estimatedPrice: number) => {
    if (!productId || !estimatedPrice) return

    const newCheckingPrices = [...checkingPrices]
    newCheckingPrices[index] = true
    setCheckingPrices(newCheckingPrices)

    try {
      const response = await fetch('/api/price-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          currentPrice: estimatedPrice,
          currentMarketId: "generic"
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

  const updateItem = (index: number, field: keyof ShoppingListItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)

    if (field === "productId") {
      setSelectedProductIdForSuggestions(value as string)
      const item = newItems[index]
      const price = parseFloat(String(item.estimatedPrice)) || 0;
      if (price > 0) {
        checkPrice(index, value as string, price)
      }
    }

    if (field === "estimatedPrice") {
       const item = newItems[index]
       const price = parseFloat(String(value)) || 0;
       if (item.productId && price > 0) {
         setTimeout(() => {
           checkPrice(index, item.productId, price)
         }, 1000)
       }
    }
  }

  const addRelatedItem = (productId: string) => {
    const itemExists = items.some(item => item.productId === productId)
    if (itemExists) {
      toast.info('Este produto já está na lista.')
      return
    }

    setItems([...items, { productId, quantity: 1, estimatedPrice: "", priceAlert: null }])
    toast.success('Produto adicionado à lista!')
  }

  // LÓGICA DO SCANNER
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      const response = await fetch(`/api/products/barcode/${barcode}`)
      if (response.ok) {
        const product = await response.json()
        if (scanningForIndex !== null) {
          updateItem(scanningForIndex, "productId", product.id)
        }
        toast.success(`Produto "${product.name}" adicionado!`);
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
  // FIM DA LÓGICA DO SCANNER

  const handleCloseRelatedProducts = (index: number) => {
    const newVisibility = [...relatedProductsVisibility]
    newVisibility[index] = false
    setRelatedProductsVisibility(newVisibility)
  }
  
  const handleClosePriceAlert = (index: number) => {
    const newVisibility = [...priceAlertVisibility]
    newVisibility[index] = false
    setPriceAlertVisibility(newVisibility)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!listName.trim()) {
      toast.error('O nome da lista é obrigatório')
      return
    }

    const validItems = items.filter(item => 
      item.productId && item.quantity > 0
    ).map(item => ({
      ...item,
      estimatedPrice: parseFloat(String(item.estimatedPrice)) || null
    }))

    if (validItems.length === 0) {
      toast.error('Adicione pelo menos um item válido à lista')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          items: validItems
        })
      })

      if (response.ok) {
        router.push('/lista')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar lista')
      }
    } catch (error) {
      console.error('Erro ao criar lista:', error)
      toast.error('Erro ao criar lista')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickProductCreated = (newProduct: Product) => {
    setProducts(prev => [...prev, newProduct]);
    if (quickProductForIndex !== null) {
      updateItem(quickProductForIndex, "productId", newProduct.id);
    }
    setShowQuickProduct(false);
    setQuickProductForIndex(null);
  }

  const handleQuickBrandCreated = (newBrand: Brand) => {
    setBrands(prev => [...prev, newBrand]);
    toast.success(`Marca "${newBrand.name}" criada com sucesso!`);
    setShowQuickBrand(false);
  }

  const openQuickProduct = (index: number) => {
    setQuickProductForIndex(index)
    setShowQuickProduct(true)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(String(item.estimatedPrice)) || 0
      return sum + (item.quantity * price)
    }, 0)
  }

  if (dataLoading) {
    return <NovaListaSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/lista">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Lista de Compras</h1>
          <p className="text-gray-600 mt-2">
            Crie uma nova lista para organizar suas compras
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5" />
              Informações da Lista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="listName">Nome da Lista *</Label>
              <Input
                id="listName"
                name="listName"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="Ex: Compras da Semana"
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Itens da Lista
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
                <div key={index} className="space-y-4 p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-4">
                    <div className="space-y-2">
                      <Label>Produto *</Label>
                      <ProductSelect
                        value={item.productId}
                        products={products}
                        onValueChange={(value) => updateItem(index, "productId", value)}
                        preserveFormData={{
                          listName,
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
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 1)}
                        placeholder="1.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Preço Estimado</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.estimatedPrice}
                        onChange={(e) => updateItem(index, "estimatedPrice", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Total</Label>
                      <Input
                        value={`R$ ${(item.quantity * (parseFloat(String(item.estimatedPrice)) || 0)).toFixed(2)}`}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </div>
                  
                  {priceAlertVisibility[index] && item.priceAlert && (
                    <div className="pt-2">
                      <PriceAlert 
                        alertData={item.priceAlert} 
                        loading={checkingPrices[index]} 
                        onClose={() => handleClosePriceAlert(index)}
                      />
                    </div>
                  )}

                  {relatedProductsVisibility[index] && item.productId && (
                    <div className="pt-2">
                      <RelatedProductsCard
                        productId={item.productId}
                        onAddProduct={addRelatedItem}
                        onClose={() => handleCloseRelatedProducts(index)}
                      />
                    </div>
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

            <div className="flex justify-between items-center pt-6 border-t mt-6">
              <div className="text-lg font-bold">
                Total Estimado: R$ {calculateTotal().toFixed(2)}
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Lista"}
                </Button>
                <Link href="/lista">
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