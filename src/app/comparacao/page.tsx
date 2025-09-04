"use client"

import { useState, useEffect } from "react"
import { useSearchParams as useNextSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, TrendingDown, TrendingUp, Target, ShoppingCart, MapPin } from "lucide-react"
import { ProductSelect, ShoppingListSelect } from "@/components/selects"
import { TempStorage } from "@/lib/temp-storage"
import { useAppData } from "@/contexts/app-data-context"
import { ShoppingList } from "@/types"
import { toast } from "sonner"

interface PriceComparison {
  productId: string
  productName: string
  brandName?: string
  unit: string
  markets: {
    marketId: string
    marketName: string
    location?: string
    currentPrice: number
    lastPurchase: string
    priceTrend: 'up' | 'down' | 'stable'
    priceChange: number
  }[]
}

interface ListComparison {
  listId: string
  listName: string
  markets: {
    marketId: string
    marketName: string
    location?: string
    totalPrice: number
    availableItems: number
    missingItems: number
    savings: number
  }[]
}

export default function ComparacaoPage() {
  const searchParams = useNextSearchParams()
  const { products } = useAppData()
  const listaParam = searchParams.get('lista')
  const [activeTab, setActiveTab] = useState(listaParam ? "lista" : "produto")
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [markets, setMarkets] = useState<any[]>([])
  
  // Estados para comparação de produto
  const [selectedProductId, setSelectedProductId] = useState("")
  const [productComparison, setProductComparison] = useState<PriceComparison | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  
  // Estados para comparação de lista
  const [selectedListId, setSelectedListId] = useState("")
  const [listComparison, setListComparison] = useState<ListComparison | null>(null)
  const [loadingList, setLoadingList] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    // Restaurar dados preservados após criação de produto
    const storageKey = searchParams.get('storageKey')
    if (storageKey) {
      const preservedData = TempStorage.get(storageKey)
      if (preservedData) {
        try {
          // Restaurar seleções
          if (preservedData.selectedProductId) {
            setSelectedProductId(preservedData.selectedProductId)
          }
          if (preservedData.selectedListId) {
            setSelectedListId(preservedData.selectedListId)
          }
          if (preservedData.activeTab) {
            setActiveTab(preservedData.activeTab)
          }
          
          // Se um novo produto foi criado, selecionar
          if (preservedData.newProductId) {
            setTimeout(() => {
              setSelectedProductId(preservedData.newProductId)
            }, 1000) // Aguardar produtos carregarem
          }
          
          // Limpar localStorage e URL
          TempStorage.remove(storageKey)
          window.history.replaceState({}, '', '/comparacao')
        } catch (error) {
          console.error('Erro ao restaurar dados:', error)
          TempStorage.remove(storageKey)
        }
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (listaParam && lists.length > 0) {
      setSelectedListId(listaParam)
      // Auto-comparar se a lista existir
      const listExists = lists.find(list => list.id === listaParam)
      if (listExists) {
        compareList()
      }
    }
  }, [listaParam, lists])

  const fetchInitialData = async () => {
    try {
      const [listsRes, marketsRes] = await Promise.all([
        fetch('/api/shopping-lists'),
        fetch('/api/markets')
      ])

      if (listsRes.ok) setLists(await listsRes.json())
      if (marketsRes.ok) setMarkets(await marketsRes.json())
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }

  const compareProduct = async () => {
    if (!selectedProductId) {
      toast.error('Selecione um produto para comparar')
      return
    }

    setLoadingProduct(true)
    try {
      const response = await fetch('/api/price-comparison/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: selectedProductId })
      })

      if (response.ok) {
        const data = await response.json()
        setProductComparison(data)
      } else {
        toast.error('Erro ao buscar comparação de preços')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao comparar preços')
    } finally {
      setLoadingProduct(false)
    }
  }

  const compareList = async () => {
    if (!selectedListId) {
      toast.error('Selecione uma lista para comparar')
      return
    }

    setLoadingList(true)
    try {
      const response = await fetch('/api/price-comparison/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: selectedListId })
      })

      if (response.ok) {
        const data = await response.json()
        setListComparison(data)
      } else {
        toast.error('Erro ao buscar comparação de lista')
      }
    } catch (error) {
      console.error('Erro:', error)
      toast.error('Erro ao comparar lista')
    } finally {
      setLoadingList(false)
    }
  }

  const getBestPrice = (markets: any[]) => {
    if (markets.length === 0) return null
    return markets.reduce((best, current) => 
      current.currentPrice < best.currentPrice ? current : best
    )
  }

  const getWorstPrice = (markets: any[]) => {
    if (markets.length === 0) return null
    return markets.reduce((worst, current) => 
      current.currentPrice > worst.currentPrice ? current : worst
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Comparação de Preços</h1>
        <p className="text-gray-600 mt-2">
          Compare preços entre mercados para economizar nas suas compras
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="produto">Por Produto</TabsTrigger>
          <TabsTrigger value="lista">Por Lista</TabsTrigger>
        </TabsList>

        <TabsContent value="produto" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Comparar Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Selecione um Produto</Label>
                  <ProductSelect
                    value={selectedProductId}
                    onValueChange={setSelectedProductId}
                    placeholder="Buscar produto..."
                    preserveFormData={{
                      selectedProductId,
                      selectedListId,
                      activeTab,
                      returnContext: 'comparacao'
                    }}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={compareProduct} disabled={loadingProduct}>
                    {loadingProduct ? "Comparando..." : "Comparar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {productComparison && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {productComparison.productName}
                  {productComparison.brandName && (
                    <Badge variant="secondary">{productComparison.brandName}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {productComparison.markets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhum preço encontrado para este produto</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productComparison.markets
                      .sort((a, b) => a.currentPrice - b.currentPrice)
                      .map((market, index) => {
                        const best = getBestPrice(productComparison.markets)
                        const worst = getWorstPrice(productComparison.markets)
                        const isBest = market.marketId === best?.marketId
                        const isWorst = market.marketId === worst?.marketId
                        
                        return (
                          <div 
                            key={market.marketId}
                            className={`flex items-center justify-between p-4 rounded-lg border ${
                              isBest ? 'bg-green-50 border-green-200' : 
                              isWorst ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{market.marketName}</h4>
                                {isBest && <Badge className="bg-green-500">Melhor Preço</Badge>}
                                {isWorst && <Badge variant="destructive">Mais Caro</Badge>}
                              </div>
                              <div className="text-sm text-gray-600 flex items-center gap-2">
                                {market.location && (
                                  <>
                                    <MapPin className="h-3 w-3" />
                                    {market.location}
                                  </>
                                )}
                                <span>Última compra: {new Date(market.lastPurchase).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-xl font-bold">
                                R$ {market.currentPrice.toFixed(2)}
                                <span className="text-sm font-normal text-gray-500">
                                  /{productComparison.unit}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm">
                                {market.priceTrend === 'up' && (
                                  <>
                                    <TrendingUp className="h-3 w-3 text-red-500" />
                                    <span className="text-red-500">+{market.priceChange.toFixed(1)}%</span>
                                  </>
                                )}
                                {market.priceTrend === 'down' && (
                                  <>
                                    <TrendingDown className="h-3 w-3 text-green-500" />
                                    <span className="text-green-500">-{market.priceChange.toFixed(1)}%</span>
                                  </>
                                )}
                                {market.priceTrend === 'stable' && (
                                  <span className="text-gray-500">Estável</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                    {productComparison.markets.length > 1 && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">💰 Economia Potencial</h4>
                        <p className="text-blue-600 text-sm">
                          Comprando no {getBestPrice(productComparison.markets)?.marketName}, você economiza 
                          <strong> R$ {(getWorstPrice(productComparison.markets)!.currentPrice - getBestPrice(productComparison.markets)!.currentPrice).toFixed(2)}</strong> por {productComparison.unit}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="lista" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Comparar Lista de Compras
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Selecione uma Lista</Label>
                  <ShoppingListSelect
                    value={selectedListId}
                    onValueChange={setSelectedListId}
                    placeholder="Selecionar lista..."
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={compareList} disabled={loadingList}>
                    {loadingList ? "Comparando..." : "Comparar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {listComparison && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {listComparison.listName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {listComparison.markets
                      .sort((a, b) => a.totalPrice - b.totalPrice)
                      .map((market, index) => {
                        const cheapest = listComparison.markets.reduce((min, curr) => 
                          curr.totalPrice < min.totalPrice ? curr : min
                        )
                        const isCheapest = market.marketId === cheapest.marketId
                        
                        return (
                          <div 
                            key={market.marketId}
                            className={`p-4 rounded-lg border ${
                              isCheapest ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{market.marketName}</h4>
                                  {isCheapest && <Badge className="bg-green-500">Mais Barato</Badge>}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {market.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {market.location}
                                    </div>
                                  )}
                                  <div className="mt-1">
                                    {market.availableItems} itens disponíveis • {market.missingItems} não encontrados
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-xl font-bold">
                                  R$ {market.totalPrice.toFixed(2)}
                                </div>
                                {market.savings > 0 && (
                                  <div className="text-sm text-green-600">
                                    Economiza R$ {market.savings.toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      
                    {listComparison.markets.length > 1 && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">💡 Recomendação</h4>
                        <p className="text-blue-600 text-sm">
                          Comprando no <strong>{listComparison.markets.sort((a, b) => a.totalPrice - b.totalPrice)[0].marketName}</strong>, 
                          você economiza <strong>R$ {(
                            Math.max(...listComparison.markets.map(m => m.totalPrice)) - 
                            Math.min(...listComparison.markets.map(m => m.totalPrice))
                          ).toFixed(2)}</strong> comparado ao mercado mais caro.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}