// src/app/compras/purchases-client.tsx
"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { useDataMutation, useUrlState, useDeleteConfirmation } from "@/hooks"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FilterPopover } from "@/components/ui/filter-popover"
import { ShoppingCart, Store, Calendar, Edit, Trash2, Eye, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Purchase } from "@/types"
import { format, subDays, startOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatLocalDate } from "@/lib/date-utils"
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
  const [purchases, setPurchases] = useState(initialPurchases)
  const [markets, setMarkets] = useState(initialMarkets)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null)
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const itemsPerPage = 12

  // Hooks customizados
  const { remove, loading } = useDataMutation()
  const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Purchase>()
  
  const { state, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
    basePath: '/compras',
    initialValues: {
      search: searchParams.search || "",
      market: searchParams.market || "all",
      sort: searchParams.sort || "date-desc",
      period: searchParams.period || "all",
      dateFrom: searchParams.dateFrom || "",
      dateTo: searchParams.dateTo || "",
      page: parseInt(searchParams.page || "1")
    }
  })

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
    updateSingleValue('period', value)
    if (value === "all") {
      updateSingleValue('dateFrom', "")
      updateSingleValue('dateTo', "")
    } else if (value === "last7") {
      updateSingleValue('dateFrom', format(subDays(new Date(), 7), "yyyy-MM-dd"))
      updateSingleValue('dateTo', format(new Date(), "yyyy-MM-dd"))
    } else if (value === "last30") {
      updateSingleValue('dateFrom', format(subDays(new Date(), 30), "yyyy-MM-dd"))
      updateSingleValue('dateTo', format(new Date(), "yyyy-MM-dd"))
    } else if (value === "currentMonth") {
      updateSingleValue('dateFrom', format(startOfMonth(new Date()), "yyyy-MM-dd"))
      updateSingleValue('dateTo', format(new Date(), "yyyy-MM-dd"))
    } else {
      updateSingleValue('dateFrom', "")
      updateSingleValue('dateTo', "")
    }
  }

  const deletePurchase = async () => {
    if (!deleteState.item) return
    
    await remove(`/api/purchases/${deleteState.item.id}`, {
      successMessage: 'Compra excluída com sucesso!',
      onSuccess: closeDeleteConfirm
    })
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
  React.useEffect(() => {
    setPurchases(initialPurchases)
    setTotalCount(initialTotalCount)
    setMarkets(initialMarkets)
  }, [initialPurchases, initialMarkets, initialTotalCount])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateSingleValue('page', page)
    }
  }

  const additionalFilters = (
    <>
      <div className="space-y-2">
        <Label>Mercado</Label>
        <Select value={state.market} onValueChange={(value) => updateSingleValue('market', value)}>
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
        <Select value={state.period} onValueChange={handlePeriodChange}>
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
      {(state.period === "custom" || (state.dateFrom && state.dateTo)) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">De</Label>
            <Input
              type="date"
              id="dateFrom"
              value={state.dateFrom}
              onChange={(e) => updateSingleValue('dateFrom', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Até</Label>
            <Input
              type="date"
              id="dateTo"
              value={state.dateTo}
              onChange={(e) => updateSingleValue('dateTo', e.target.value)}
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
            value={state.search}
            onChange={(e) => updateSingleValue('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterPopover
          sortValue={state.sort}
          onSortChange={(value) => updateSingleValue('sort', value)}
          sortOptions={sortOptions}
          additionalFilters={additionalFilters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            clearFilters()
            updateSingleValue('page', 1)
          }}
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
                <Button variant="outline" onClick={() => {
                  clearFilters()
                  updateSingleValue('page', 1)
                }}>
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
                Página {state.page} de {totalPages}
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
                          {formatLocalDate(purchase.purchaseDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
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
                      onClick={() => openDeleteConfirm(purchase)}
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
                  onClick={() => handlePageChange(state.page - 1)}
                  disabled={state.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => page === 1 || page === totalPages || Math.abs(page - state.page) <= 2)
                    .map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-2 py-1 text-gray-400">...</span>
                        )}
                        <Button
                          variant={state.page === page ? "default" : "outline"}
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
                  onClick={() => handlePageChange(state.page + 1)}
                  disabled={state.page === totalPages}
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
                    {formatLocalDate(purchaseDetails.purchaseDate, "dd/MM/yyyy", { locale: ptBR })}
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

      <Dialog open={deleteState.show} onOpenChange={(open) => !open && closeDeleteConfirm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir esta compra de <strong>{deleteState.item?.market?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita e todos os itens da compra serão perdidos.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deletePurchase}
                disabled={loading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {loading ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button 
                variant="outline" 
                onClick={closeDeleteConfirm}
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