"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Store, Package, ShoppingCart, RefreshCw, DollarSign, TrendingUp } from "lucide-react"
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton"
import { PullToRefresh } from "@/components/pull-to-refresh"
import { SavingsCard } from "@/components/savings-card"
import { TemporalComparisonCard } from "@/components/temporal-comparison-card"
import { ReplenishmentAlerts } from "@/components/replenishment-alerts"
import { ExpirationAlerts } from "@/components/expiration-alerts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface DashboardStats {
  totalPurchases: number
  totalSpent: number
  totalProducts: number
  totalMarkets: number
  recentPurchases: any[]
  topProducts: any[]
  marketComparison: any[]
  monthlyComparison: {
    currentMonth: {
      totalSpent: number
      totalPurchases: number
      averagePerPurchase: number
    }
    lastMonth: {
      totalSpent: number
      totalPurchases: number
      averagePerPurchase: number
    }
    spentChange: number
    purchasesChange: number
  }
  categoryStats: {
    categoryId: string
    categoryName: string
    icon?: string
    color?: string
    totalSpent: number
    totalPurchases: number
    totalQuantity: number
    averagePrice: number
  }[]
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [savingsData, setSavingsData] = useState<any>(null)
  const [temporalData, setTemporalData] = useState<any>(null)
  const [consumptionData, setConsumptionData] = useState<any>(null)
  const [expirationData, setExpirationData] = useState<any>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        cache: 'no-store' // Force fresh data
      })
      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const [savingsResponse, temporalResponse, consumptionResponse, expirationResponse] = await Promise.all([
        fetch('/api/savings', { cache: 'no-store' }),
        fetch('/api/temporal-comparison', { cache: 'no-store' }),
        fetch('/api/predictions/consumption-patterns', { cache: 'no-store' }),
        fetch('/api/stock/expiration-alerts', { cache: 'no-store' })
      ])
      
      const [savings, temporal, consumption, expiration] = await Promise.all([
        savingsResponse.json(),
        temporalResponse.json(),
        consumptionResponse.json(),
        expirationResponse.json()
      ])
      
      setSavingsData(savings)
      setTemporalData(temporal)
      setConsumptionData(consumption)
      setExpirationData(expiration)
    } catch (error) {
      console.error('Erro ao buscar análises:', error)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    setAnalyticsLoading(true)
    await Promise.all([fetchStats(), fetchAnalytics()])
  }

  const handleAddToShoppingList = async (productId: string, quantity: number) => {
    try {
      // Buscar ou criar lista de compras padrão
      let shoppingList = await fetch('/api/shopping-lists?default=true').then(r => r.json())
      
      if (!shoppingList || shoppingList.length === 0) {
        // Criar lista padrão se não existir
        const createResponse = await fetch('/api/shopping-lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Lista Inteligente',
            description: 'Gerada automaticamente pela IA'
          })
        })
        shoppingList = await createResponse.json()
      } else {
        shoppingList = shoppingList[0]
      }

      // Adicionar item à lista
      await fetch(`/api/shopping-lists/${shoppingList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          quantity,
          notes: 'Adicionado pela IA'
        })
      })

      toast.success('Item adicionado à lista de compras!')
    } catch (error) {
      console.error('Erro ao adicionar à lista:', error)
      toast.error('Erro ao adicionar item à lista')
    }
  }

  // Auto refresh when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchStats()
        fetchAnalytics()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchStats, fetchAnalytics, loading])

  // Initial load
  useEffect(() => {
    fetchStats()
    fetchAnalytics()
  }, [fetchStats, fetchAnalytics])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!stats) {
    return <div>Erro ao carregar dashboard</div>
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Bem-vindo ao Mercado304</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Sistema completo de gerenciamento de compras de mercado
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Última atualização: {format(lastUpdated, "HH:mm:ss", { locale: ptBR })}
            </p>
          )}
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total de Compras</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">R$ {(stats.totalSpent || 0).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Produtos Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Mercados Cadastrados</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats.totalMarkets}</div>
          </CardContent>
        </Card>
      </div>

      {/* IA Alerts */}
      {consumptionData && consumptionData.replenishmentAlerts && consumptionData.replenishmentAlerts.length > 0 && (
        <ReplenishmentAlerts 
          data={consumptionData} 
          loading={analyticsLoading}
          onAddToShoppingList={handleAddToShoppingList}
        />
      )}

      {/* Expiration Alerts */}
      {expirationData && expirationData.stats && (expirationData.stats.expired > 0 || expirationData.stats.expiringToday > 0 || expirationData.stats.expiringSoon > 0 || expirationData.stats.lowStock > 0) && (
        <ExpirationAlerts 
          data={expirationData} 
          loading={analyticsLoading}
          onRefresh={fetchAnalytics}
        />
      )}

      {/* Comparação Mensal */}
      {stats.monthlyComparison && (stats.monthlyComparison.currentMonth.totalPurchases > 0 || stats.monthlyComparison.lastMonth.totalPurchases > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparação Mensal
            </CardTitle>
            <CardDescription>
              Comparação entre este mês e o anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  R$ {stats.monthlyComparison.currentMonth.totalSpent.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Este Mês</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.monthlyComparison.currentMonth.totalPurchases} compras
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  R$ {stats.monthlyComparison.lastMonth.totalSpent.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Mês Passado</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.monthlyComparison.lastMonth.totalPurchases} compras
                </div>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className={`text-2xl font-bold ${
                  stats.monthlyComparison.spentChange > 0 ? 'text-red-600' : 
                  stats.monthlyComparison.spentChange < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {stats.monthlyComparison.spentChange > 0 ? '+' : ''}
                  {stats.monthlyComparison.spentChange.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {stats.monthlyComparison.spentChange > 0 ? 'Aumento' : 
                   stats.monthlyComparison.spentChange < 0 ? 'Economia' : 'Estável'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  vs. mês anterior
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SavingsCard savingsData={savingsData} loading={analyticsLoading} />
        <TemporalComparisonCard temporalData={temporalData} loading={analyticsLoading} />
      </div>

      {/* Estatísticas por Categoria */}
      {stats.categoryStats && stats.categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gastos por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição de gastos por categoria de produtos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.categoryStats.slice(0, 8).map((category, index) => {
                const percentage = stats.totalSpent > 0 ? (category.totalSpent / stats.totalSpent) * 100 : 0
                return (
                  <div key={category.categoryId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{category.categoryName}</div>
                        <div className="text-sm text-gray-500">
                          {category.totalQuantity.toFixed(1)} itens • {category.totalPurchases} compras
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {category.totalSpent.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seções de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Comprados</CardTitle>
            <CardDescription>Top 5 produtos mais frequentes</CardDescription>
          </CardHeader>
          <CardContent>
            {(stats.topProducts || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhuma compra registrada ainda</p>
                <p className="text-sm mt-2">
                  <Link href="/compras/nova" className="text-blue-600 hover:text-blue-800">
                    Registre sua primeira compra
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(stats.topProducts || []).slice(0, 5).map((product: any, index: number) => (
                  <div key={product.productId || index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{product.productName}</div>
                        <div className="text-sm text-gray-500">
                          {product.totalQuantity?.toFixed(1) || 0} {product.unit || 'unidades'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {(product.averagePrice || 0).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{product.totalPurchases || 0} compras</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparação de Mercados</CardTitle>
            <CardDescription>Média de preços por mercado</CardDescription>
          </CardHeader>
          <CardContent>
            {(stats.marketComparison || []).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Store className="h-12 w-12 mx-auto mb-4" />
                <p>Nenhuma compra registrada ainda</p>
                <p className="text-sm mt-2">
                  <Link href="/mercados/novo" className="text-blue-600 hover:text-blue-800">
                    Cadastre seu primeiro mercado
                  </Link>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(stats.marketComparison || []).map((market: any, index: number) => {
                  const cheapest = stats.marketComparison?.length > 1 ? 
                    stats.marketComparison.reduce((min, curr) => 
                      curr.averagePrice < min.averagePrice ? curr : min
                    ) : null
                  const isCheapest = cheapest && market.marketId === cheapest.marketId
                  
                  return (
                    <div key={market.marketId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full text-xs flex items-center justify-center ${
                          isCheapest ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {market.marketName}
                            {isCheapest && (
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                Mais Barato
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {market.totalPurchases} compras
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">R$ {(market.averagePrice || 0).toFixed(2)}</div>
                        <div className="text-sm text-gray-500">média por compra</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compras Recentes</CardTitle>
          <CardDescription>Últimas 5 compras realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {(stats.recentPurchases || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
              <p>Nenhuma compra registrada ainda</p>
              <p className="text-sm mt-2">
                <Link href="/compras/nova" className="text-blue-600 hover:text-blue-800">
                  Registre sua primeira compra
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(stats.recentPurchases || []).slice(0, 5).map((purchase: any) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">{purchase.market?.name || 'Mercado não identificado'}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(purchase.purchaseDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">R$ {(purchase.totalAmount || 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {purchase.items?.length || 0} {purchase.items?.length === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                </div>
              ))}
              
              {(stats.recentPurchases || []).length > 5 && (
                <div className="text-center pt-3 border-t">
                  <Link href="/compras" className="text-sm text-blue-600 hover:text-blue-800">
                    Ver todas as compras ({stats.totalPurchases})
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PullToRefresh>
  )
}