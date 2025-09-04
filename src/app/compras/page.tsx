"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, ShoppingCart, Store, Calendar, Edit, Trash2, Eye, Search, Filter, ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react"
import { Purchase } from "@/types"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { PurchasesSkeleton } from "@/components/skeletons/purchases-skeleton"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MarketSelect } from "@/components/selects/market-select"

import { toast } from "sonner"

export default function ComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, purchase: Purchase | null }>({ show: false, purchase: null })
  const [deleting, setDeleting] = useState(false)
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Estados para filtros
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "")
  const [marketFilter, setMarketFilter] = useState(searchParams.get('market') || 'all')
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'date-desc')
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || "")
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || "")
  const [periodFilter, setPeriodFilter] = useState(searchParams.get('period') || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Função para calcular datas baseadas no período selecionado
  const calculatePeriodDates = useCallback(() => {
    const now = new Date()
    let calculatedDateFrom = ""
    let calculatedDateTo = ""

    switch (periodFilter) {
      case 'today':
        calculatedDateFrom = format(now, 'yyyy-MM-dd')
        calculatedDateTo = format(now, 'yyyy-MM-dd')
        break
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        calculatedDateFrom = format(weekAgo, 'yyyy-MM-dd')
        calculatedDateTo = format(now, 'yyyy-MM-dd')
        break
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        calculatedDateFrom = format(monthAgo, 'yyyy-MM-dd')
        calculatedDateTo = format(now, 'yyyy-MM-dd')
        break
      case 'custom':
        calculatedDateFrom = dateFrom
        calculatedDateTo = dateTo
        break
      default:
        return { dateFromParam: '', dateToParam: '' }
    }

    return {
      dateFromParam: calculatedDateFrom ? `dateFrom=${calculatedDateFrom}` : '',
      dateToParam: calculatedDateTo ? `dateTo=${calculatedDateTo}` : ''
    }
  }, [periodFilter, dateFrom, dateTo])

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    const marketParam = marketFilter !== 'all' ? `marketId=${marketFilter}` : ''
    const searchParam = searchTerm ? `search=${searchTerm}` : ''
    const sortParam = `sort=${sortOrder}`
    const { dateFromParam, dateToParam } = calculatePeriodDates()
    
    const params = [marketParam, searchParam, sortParam, dateFromParam, dateToParam].filter(Boolean)
    const url = `/api/purchases?${params.join('&')}`
    
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()
      setPurchases(data)
    } catch (error) {
      console.error('Erro ao buscar compras:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, marketFilter, sortOrder, calculatePeriodDates])

  // Paginar compras
  const { paginatedPurchases, totalPages } = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedPurchases = purchases.slice(startIndex, endIndex)
    const totalPages = Math.ceil(purchases.length / itemsPerPage)
    
    return { paginatedPurchases, totalPages }
  }, [purchases, currentPage])

  // Lógica para atualizar a URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set('search', searchTerm)
    params.set('market', marketFilter)
    params.set('sort', sortOrder)
    params.set('period', periodFilter)
    if (periodFilter === 'custom') {
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
    } else {
      params.delete('dateFrom')
      params.delete('dateTo')
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchTerm, marketFilter, sortOrder, periodFilter, dateFrom, dateTo, router, searchParams])
  
  // Busca inicial dos dados
  useEffect(() => {
    fetchPurchases()
  }, [fetchPurchases])

  // Auto refresh when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchPurchases()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading, fetchPurchases])

  const clearFilters = () => {
    setSearchTerm("")
    setMarketFilter('all')
    setPeriodFilter('all')
    setDateFrom("")
    setDateTo("")
    setCurrentPage(1)
  }

  const confirmDelete = (purchase: Purchase) => {
    setDeleteConfirm({ show: true, purchase })
  }

  const deletePurchase = async () => {
    if (!deleteConfirm.purchase) return
    
    setDeleting(true)
    try {
      await fetch(`/api/purchases/${deleteConfirm.purchase.id}`, { method: 'DELETE' })
      setDeleteConfirm({ show: false, purchase: null })
      fetchPurchases()
      toast.success('Compra excluída com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir compra:', error)
      toast.error('Erro ao excluir compra')
    } finally {
      setDeleting(false)
    }
  }

  const viewPurchaseDetails = async (purchase: Purchase) => {
    setViewingPurchase(purchase)
    setLoadingDetails(true)
    
    try {
      const response = await fetch(`/api/purchases/${purchase.id}`)
      const data = await response.json()
      setPurchaseDetails(data)
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error)
    } finally {
      setLoadingDetails(false)
    }
  }

  if (loading) {
    return <PurchasesSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compras</h1>
          <p className="text-gray-600 mt-2">
            Registre e acompanhe suas compras
          </p>
        </div>
        <Link href="/compras/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Compra
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Primeira linha de filtros */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Buscar Produto</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Nome do produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Filtrar por Mercado</Label>
                <MarketSelect
                  value={marketFilter}
                  onValueChange={setMarketFilter}
                  placeholder="Todos os mercados"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Data (mais recente)</SelectItem>
                    <SelectItem value="date-asc">Data (mais antiga)</SelectItem>
                    <SelectItem value="value-desc">Valor (maior)</SelectItem>
                    <SelectItem value="value-asc">Valor (menor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Segunda linha - Filtros de data */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Período
                  </Label>
                  <Select value={periodFilter} onValueChange={(value) => {
                    setPeriodFilter(value)
                    if (value !== 'custom') {
                      setDateFrom("")
                      setDateTo("")
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as datas</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="custom">Período personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {periodFilter === 'custom' && (
                  <>
                    <div className="space-y-2">
                      <Label>Data inicial</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        placeholder="Data inicial"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data final</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        placeholder="Data final"
                      />
                    </div>
                  </>
                )}

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {paginatedPurchases.length === 0 && purchases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || marketFilter !== 'all' || periodFilter !== 'all' ? "Nenhuma compra encontrada" : "Nenhuma compra registrada"}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || marketFilter !== 'all' || periodFilter !== 'all' ? "Tente ajustar os filtros" : "Comece registrando sua primeira compra"}
              </p>
              {!(searchTerm || marketFilter !== 'all' || periodFilter !== 'all') && (
                <Link href="/compras/nova">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Primeira Compra
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Informações de Paginação */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Mostrando {paginatedPurchases.length} de {purchases.length} compras
              </span>
              <span>
                Página {currentPage} de {totalPages}
              </span>
            </div>

            {paginatedPurchases.map((purchase) => (
            <Card key={purchase.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Compra em {purchase.market?.name}
                    </CardTitle>
                    <CardDescription className="space-y-1 mt-2">
                      <div className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {purchase.market?.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(purchase.purchaseDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-lg font-bold">
                      R$ {' '}
                      {purchase.totalAmount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {purchase.items?.length || 0} itens
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => viewPurchaseDetails(purchase)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/compras/editar/${purchase.id}`, '_blank')}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmDelete(purchase)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 2
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 py-1 text-gray-400">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))
                }
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
          )}
          </>
        )}
      </div>

      {/* Dialog de Detalhes da Compra */}
      <Dialog open={!!viewingPurchase} onOpenChange={(open) => !open && setViewingPurchase(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Compra
            </DialogTitle>
          </DialogHeader>
          {loadingDetails ? (
            <div className="space-y-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : purchaseDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">Mercado</p>
                  <p className="font-medium">{purchaseDetails.market?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Data</p>
                  <p className="font-medium">
                    {format(new Date(purchaseDetails.purchaseDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Itens da Compra</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {purchaseDetails.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">
                          {item.product?.name || item.productName}
                          {!item.product && (
                            <span className="text-red-500 text-xs ml-1">(produto removido)</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.product?.unit || item.productUnit} × R$ {item.unitPrice.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-medium">R$ {item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-lg font-bold">R$ {purchaseDetails.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, purchase: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir esta compra de <strong>{deleteConfirm.purchase?.market?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita e todos os itens da compra serão perdidos.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deletePurchase}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm({ show: false, purchase: null })}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}