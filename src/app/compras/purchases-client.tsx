// src/app/compras/purchases-client.tsx
"use client"

import * as React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterPopover } from "@/components/ui/filter-popover"
import { ShoppingCart, Store, Calendar, Edit, Trash2, Eye, Search, CalendarDays, X, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Purchase } from "@/types"
import { format, subDays, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"

interface PurchasesClientProps {
  initialPurchases: Purchase[]
  initialMarkets: any[]
  initialTotalCount: number
  searchParams: {
    search?: string
    market?: string
    sort?: string
    period?: string
    dateFrom?: string
    dateTo?: string
    page?: string
  }
}

export function PurchasesClient({ initialPurchases, initialMarkets, initialTotalCount, searchParams }: PurchasesClientProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [purchases, setPurchases] = useState(initialPurchases)
  const [markets, setMarkets] = useState(initialMarkets)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, purchase: Purchase | null }>({ show: false, purchase: null })
  const [deleting, setDeleting] = useState(false)
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Estados de filtro e paginação sincronizados com a URL
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "")
  const [selectedMarket, setSelectedMarket] = useState(searchParams.market || "all")
  const [sortBy, setSortBy] = useState(searchParams.sort || "date-desc")
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.page || "1"))
  const [period, setPeriod] = useState(searchParams.period || "all")
  const [dateFrom, setDateFrom] = useState(searchParams.dateFrom || "")
  const [dateTo, setDateTo] = useState(searchParams.dateTo || "")
  const itemsPerPage = 12

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const sortOptions = [
    { value: "date-desc", label: "Mais recente" },
    { value: "date-asc", label: "Mais antigo" },
    { value: "value-desc", label: "Valor (maior)" },
    { value: "value-asc", label: "Valor (menor)" }
  ]
  
  const marketOptions = useMemo(() => ([
    { value: "all", label: "Todos os mercados" },
    ...(markets || []).map((market: any) => ({ value: market.id, label: market.name }))
  ]), [markets])

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    if (value === "all") {
      setDateFrom("")
      setDateTo("")
    } else if (value === "last7") {
      setDateFrom(format(subDays(new Date(), 7), "yyyy-MM-dd"))
      setDateTo(format(new Date(), "yyyy-MM-dd"))
    } else if (value === "last30") {
      setDateFrom(format(subDays(new Date(), 30), "yyyy-MM-dd"))
      setDateTo(format(new Date(), "yyyy-MM-dd"))
    } else if (value === "currentMonth") {
      setDateFrom(format(startOfMonth(new Date()), "yyyy-MM-dd"))
      setDateTo(format(new Date(), "yyyy-MM-dd"))
    } else {
      // Período customizado, deixa os campos de data abertos
      setDateFrom("")
      setDateTo("")
    }
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
      router.refresh()
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
  
  // Sincronizar estado interno com dados iniciais do servidor
  useEffect(() => {
    setPurchases(initialPurchases)
    setTotalCount(initialTotalCount)
    setMarkets(initialMarkets)
  }, [initialPurchases, initialMarkets, initialTotalCount])

  // Lógica para atualizar a URL com base nos filtros e paginação
  useEffect(() => {
    const params = new URLSearchParams(urlSearchParams)
    if (searchTerm) params.set('search', searchTerm)
    else params.delete('search')
    if (selectedMarket && selectedMarket !== 'all') params.set('market', selectedMarket)
    else params.delete('market')
    if (sortBy !== 'date-desc') params.set('sort', sortBy)
    else params.delete('sort')
    if (period && period !== 'all') params.set('period', period)
    else params.delete('period')
    if (dateFrom) params.set('dateFrom', dateFrom)
    else params.delete('dateFrom')
    if (dateTo) params.set('dateTo', dateTo)
    else params.delete('dateTo')
    if (currentPage > 1) params.set('page', currentPage.toString())
    else params.delete('page')

    const newUrl = params.toString() ? `?${params.toString()}` : '/compras'
    router.push(newUrl, { scroll: false })
  }, [searchTerm, selectedMarket, sortBy, period, dateFrom, dateTo, currentPage, router, urlSearchParams])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedMarket("all")
    setSortBy("date-desc")
    setPeriod("all")
    setDateFrom("")
    setDateTo("")
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  
  const hasActiveFilters = searchTerm !== "" || selectedMarket !== "all" || sortBy !== "date-desc" || period !== "all" || dateFrom !== "" || dateTo !== ""

  const additionalFilters = (
    <>
      <div className="space-y-2">
        <Label>Mercado</Label>
        <Select value={selectedMarket} onValueChange={setSelectedMarket}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os mercados" />
          </SelectTrigger>
          <SelectContent>
            {marketOptions.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Período</Label>
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo o histórico</SelectItem>
            <SelectItem value="last7">Últimos 7 dias</SelectItem>
            <SelectItem value="last30">Últimos 30 dias</SelectItem>
            <SelectItem value="currentMonth">Mês atual</SelectItem>
            <SelectItem value="custom">Intervalo personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {(period === "custom" || (dateFrom && dateTo)) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">De</Label>
            <Input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Até</Label>
            <Input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      )}
    </>
  )

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterPopover
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortOptions={sortOptions}
          additionalFilters={additionalFilters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </div>

      <div className="space-y-4">
        {purchases.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? 'Nenhuma compra encontrada' : 'Nenhuma compra cadastrada'}
              </h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters ? 'Tente ajustar os filtros de busca' : 'Comece adicionando sua primeira compra'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Mostrando {purchases.length} de {totalCount} compras
              </span>
              <span>
                Página {currentPage} de {totalPages}
              </span>
            </div>
            
            {purchases.map((purchase) => (
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
                        R$ {purchase.totalAmount.toFixed(2)}
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 py-1 text-gray-400">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
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
                  onClick={() => handlePageChange(currentPage + 1)}
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
    </>
  )
}