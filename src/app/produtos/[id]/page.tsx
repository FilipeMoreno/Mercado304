"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Package, Edit, Trash2, TrendingUp, TrendingDown, ShoppingCart, DollarSign, Calendar, BarChart3, AlertTriangle, CheckCircle, Store, Minus, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import { toast } from "sonner"
import { Product } from "@/types"
import { BestDayToBuyCard } from "@/components/best-day-to-buy-card"
import { ProductDetailsSkeleton } from "@/components/skeletons/product-details-skeleton"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default function ProdutoDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [priceHistory, setPriceHistory] = useState<any[]>([])
  const [marketComparison, setMarketComparison] = useState<any[]>([])
  const [recentPurchases, setRecentPurchases] = useState<any[]>([])
  const [stockAlerts, setStockAlerts] = useState<any>(null)
  const [purchasesPage, setPurchasesPage] = useState(1)
  const purchasesPerPage = 5

  useEffect(() => {
    if (productId) {
      fetchProductDetails()
    }
  }, [productId])

  const fetchProductDetails = async () => {
    try {
      const [productResponse, statsResponse] = await Promise.all([
        fetch(`/api/products/${productId}`),
        fetch(`/api/products/${productId}/stats`)
      ])

      if (!productResponse.ok) {
        toast.error('Produto não encontrado')
        router.push('/produtos')
        return
      }

      const productData = await productResponse.json()
      setProduct(productData)

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
        setPriceHistory(statsData.priceHistory || [])
        setMarketComparison(statsData.marketComparison || [])
        setRecentPurchases(statsData.recentPurchases || [])
        setStockAlerts(statsData.stockAlerts)
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do produto:', error)
      toast.error('Erro ao carregar detalhes do produto')
      router.push('/produtos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <ProductDetailsSkeleton />
  }

  if (!product) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/produtos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {product.brand && (
                  <Badge variant="secondary">{product.brand.name}</Badge>
                )}
                {product.category && (
                  <Badge variant="outline">
                    {product.category.icon} {product.category.name}
                  </Badge>
                )}
                <Badge variant="outline">{product.unit}</Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/produtos/${productId}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas Rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPurchases || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Compras Realizadas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">R$ {(stats.averagePrice || 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Preço Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {stats.lastPurchaseDate ? format(new Date(stats.lastPurchaseDate), 'dd/MM', { locale: ptBR }) : '-'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Última Compra</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  {stats.priceChange > 0 ? (
                    <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : stats.priceChange < 0 ? (
                    <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    stats.priceChange > 0 ? 'text-red-600 dark:text-red-400' :
                    stats.priceChange < 0 ? 'text-green-600 dark:text-green-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {stats.priceChange > 0 ? '+' : ''}{(stats.priceChange || 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Variação de Preço</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de Estoque */}
      {stockAlerts && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Status do Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  stockAlerts.status === 'low' ? 'bg-red-100 dark:bg-red-900' :
                  stockAlerts.status === 'ok' ? 'bg-green-100 dark:bg-green-900' :
                  'bg-gray-100 dark:bg-gray-900'
                }`}>
                  {stockAlerts.status === 'low' ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold">{stockAlerts.currentStock || 0}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Estoque Atual</p>
                </div>
              </div>
              
              {product.minStock && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{product.minStock}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mínimo</p>
                  </div>
                </div>
              )}

              {product.maxStock && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{product.maxStock}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Máximo</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Evolução de Preços */}
      {priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução de Preços por Mercado
            </CardTitle>
            <CardDescription>Histórico de preços nos últimos 3 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                  labelFormatter={(label) => `Semana: ${label}`}
                />
                <Legend />
                {Object.keys(priceHistory[0] || {}).filter(key => key !== 'week').map((marketName, index) => (
                  <Line 
                    key={marketName}
                    type="monotone" 
                    dataKey={marketName} 
                    stroke={`hsl(${index * 137.5 % 360}, 70%, 50%)`}
                    strokeWidth={2}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Código de Barras</p>
                <p className="text-lg font-mono">{product.barcode || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unidade</p>
                <p className="text-lg">{product.unit}</p>
              </div>
            </div>

            {product.hasStock && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Controle de Estoque</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estoque Mínimo</p>
                    <p className="font-medium">{product.minStock || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estoque Máximo</p>
                    <p className="font-medium">{product.maxStock || '-'}</p>
                  </div>
                </div>
              </div>
            )}

            {product.hasExpiration && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Controle de Validade</h4>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Prazo padrão</p>
                  <p className="font-medium">{product.defaultShelfLifeDays || '-'} dias</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Análise do melhor dia */}
        <BestDayToBuyCard productId={productId} />
      </div>

      {/* Comparação entre Mercados */}
      {marketComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Comparação entre Mercados
            </CardTitle>
            <CardDescription>Preços médios nos diferentes mercados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marketComparison.map((market: any, index: number) => {
                const isCheapest = index === 0 // Assumindo que vem ordenado
                return (
                  <div key={market.marketId} className={`p-4 rounded-lg border ${
                    isCheapest ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' : 
                    'border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{market.marketName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{market.purchaseCount} compras</p>
                      </div>
                      {isCheapest && (
                        <Badge className="bg-green-500">Melhor Preço</Badge>
                      )}
                    </div>
                    <p className="text-xl font-bold mt-2">R$ {market.averagePrice.toFixed(2)}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compras Recentes */}
      {recentPurchases.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Compras Recentes
                </CardTitle>
                <CardDescription>Histórico das últimas compras deste produto</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {((purchasesPage - 1) * purchasesPerPage) + 1}-{Math.min(purchasesPage * purchasesPerPage, recentPurchases.length)} de {recentPurchases.length}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPurchasesPage(p => Math.max(1, p - 1))}
                    disabled={purchasesPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPurchasesPage(p => p + 1)}
                    disabled={purchasesPage * purchasesPerPage >= recentPurchases.length}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPurchases
                .slice((purchasesPage - 1) * purchasesPerPage, purchasesPage * purchasesPerPage)
                .map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Store className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{purchase.market?.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: ptBR })} • 
                        {purchase.quantity} {product.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">R$ {purchase.unitPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">por {product.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}