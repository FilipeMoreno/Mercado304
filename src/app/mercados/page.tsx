// src/app/mercados/page.tsx

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Store, MapPin, Edit, Trash2, Save, X, BarChart3, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Market } from "@/types"
import { MarketsSkeleton } from "@/components/skeletons/markets-skeleton"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSearchParams, useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast } from "sonner"
import React from "react"

export default function MercadosPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMarket, setEditingMarket] = useState<Market | null>(null)
  const [editForm, setEditForm] = useState({ name: "", location: "" })
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, market: Market | null }>({ show: false, market: null })
  const [deleting, setDeleting] = useState(false)
  
  // Estados para filtros
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "")
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'name-asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 9

  const fetchMarkets = useCallback(async () => {
    setLoading(true)
    const url = `/api/markets?search=${searchTerm}&sort=${sortOrder}`
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()
      setMarkets(data)
    } catch (error) {
      console.error('Erro ao buscar mercados:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, sortOrder])

  // Paginar mercados
  const { paginatedMarkets, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedMarkets = markets.slice(startIndex, endIndex)
    const totalPages = Math.ceil(markets.length / itemsPerPage)
    
    return { paginatedMarkets, totalPages }
  }, [markets, currentPage])

  // Lógica para atualizar a URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set('search', searchTerm)
    params.set('sort', sortOrder)
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchTerm, sortOrder, router, searchParams])
  
  // Busca inicial dos dados
  useEffect(() => {
    fetchMarkets()
  }, [fetchMarkets])

  // Auto refresh when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchMarkets()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading, fetchMarkets])

  const openEditDialog = (market: Market) => {
    setEditingMarket(market)
    setEditForm({ name: market.name, location: market.location || "" })
  }

  const closeEditDialog = () => {
    setEditingMarket(null)
    setEditForm({ name: "", location: "" })
  }

  const updateMarket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMarket || !editForm.name.trim()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/markets/${editingMarket.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          location: editForm.location.trim() || null
        })
      })

      if (response.ok) {
        closeEditDialog()
        fetchMarkets()
        toast.success('Mercado atualizado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar mercado')
      }
    } catch (error) {
      console.error('Erro ao atualizar mercado:', error)
      toast.error('Erro ao atualizar mercado')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (market: Market) => {
    setDeleteConfirm({ show: true, market })
  }

  const deleteMarket = async () => {
    if (!deleteConfirm.market) return
    
    setDeleting(true)
    try {
      await fetch(`/api/markets/${deleteConfirm.market.id}`, { method: 'DELETE' })
      setDeleteConfirm({ show: false, market: null })
      fetchMarkets()
      toast.success('Mercado excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir mercado:', error)
      toast.error('Erro ao excluir mercado')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <MarketsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mercados</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os mercados onde você faz compras
          </p>
        </div>
        <Link href="/mercados/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Mercado
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buscar Mercado</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome do mercado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="date-asc">Data (mais antiga)</SelectItem>
                  <SelectItem value="date-desc">Data (mais recente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações de Paginação */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Mostrando {paginatedMarkets.length} de {markets.length} mercados
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedMarkets.map((market) => (
          <Card key={market.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {market.name}
              </CardTitle>
              {market.location && (
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {market.location}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Link href={`/mercados/${market.id}`}>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(market)}
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

      {/* Controles de Paginação */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
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

      {markets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum mercado cadastrado</h3>
            <p className="text-gray-600 mb-4">
              Comece cadastrando o primeiro mercado onde você faz compras
            </p>
            <Link href="/mercados/novo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Mercado
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingMarket} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Mercado
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={updateMarket} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Nome do Mercado *</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Supermercado ABC"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editLocation">Localização</Label>
              <Input
                id="editLocation"
                value={editForm.location}
                onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
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
              Esta ação não pode ser desfeita e todas as compras relacionadas também serão excluídas.
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
    </div>
  )
}