"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Store, MapPin, Edit, Trash2, BarChart3, Plus, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Market } from "@/types"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"

interface MercadosClientProps {
  initialMarkets: Market[]
  initialTotalCount: number
  searchParams: {
    search?: string
    sort?: string
    page?: string
  }
}

export function MercadosClient({ initialMarkets, initialTotalCount, searchParams }: MercadosClientProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [markets, setMarkets] = useState<Market[]>(initialMarkets)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, market: Market | null }>({ show: false, market: null })
  const [deleting, setDeleting] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "")
  const [sortBy, setSortBy] = useState(searchParams.sort || "name-asc")
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.page || "1"))
  const itemsPerPage = 12

  const sortOptions = [
    { value: "name-asc", label: "Nome (A-Z)" },
    { value: "name-desc", label: "Nome (Z-A)" },
    { value: "location-asc", label: "Localização (A-Z)" },
    { value: "date-desc", label: "Mais recente" },
    { value: "date-asc", label: "Mais antigo" }
  ]
  
  const totalPages = Math.ceil(totalCount / itemsPerPage)

  const confirmDelete = (market: Market) => {
    setDeleteConfirm({ show: true, market })
  }

  const deleteMarket = async () => {
    if (!deleteConfirm.market) return
    
    setDeleting(true)
    try {
      await fetch(`/api/markets/${deleteConfirm.market.id}`, { method: 'DELETE' })
      setDeleteConfirm({ show: false, market: null })
      router.refresh()
      toast.success('Mercado excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir mercado:', error)
      toast.error('Erro ao excluir mercado')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    setMarkets(initialMarkets)
    setTotalCount(initialTotalCount)
  }, [initialMarkets, initialTotalCount])

  useEffect(() => {
    const params = new URLSearchParams(urlSearchParams)
    if (searchTerm) params.set('search', searchTerm)
    else params.delete('search')
    if (sortBy !== 'name-asc') params.set('sort', sortBy)
    else params.delete('sort')
    if (currentPage > 1) params.set('page', currentPage.toString())
    else params.delete('page')
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/mercados'
    router.push(newUrl, { scroll: false })
  }, [searchTerm, sortBy, currentPage, router, urlSearchParams])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const hasActiveFilters = searchTerm !== "" || sortBy !== "name-asc"

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar mercados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterPopover
          sortValue={sortBy}
          onSortChange={setSortBy}
          sortOptions={sortOptions}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            setSearchTerm("")
            setSortBy("name-asc")
          }}
        />
      </div>
      
      <div className="space-y-4">
        {markets.length === 0 ? (
          searchTerm || sortBy !== "name-asc" ? (
            <Card>
              <CardContent className="text-center py-12">
                <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum mercado encontrado</h3>
                <p className="text-gray-600 mb-4">
                  Nenhum mercado corresponde aos filtros aplicados
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm("")
                    setSortBy("name-asc")
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum mercado cadastrado</h3>
              <p className="text-gray-600 mb-4">
                Comece adicionando seu primeiro mercado
              </p>
              <Link href="/mercados/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Mercado
                </Button>
              </Link>
            </CardContent>
          </Card>
          )
        ) : (
          <>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Mostrando {markets.length} de {totalCount} mercados
              </span>
              <span>
                Página {currentPage} de {totalPages}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {markets.map((market) => (
                <Card key={market.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Store className="h-5 w-5" />
                          {market.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-2">
                          <MapPin className="h-3 w-3" />
                          {market.location}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Link href={`/mercados/${market.id}`}>
                        <Button variant="outline" size="sm">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Análises
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/mercados/${market.id}/editar`, '_blank')}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => confirmDelete(market)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
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

      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, market: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir o mercado <strong>{deleteConfirm.market?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita e todas as compras relacionadas a este mercado serão afetadas.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deleteMarket}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm({ show: false, market: null })}
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