"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Tag, Edit, Trash2, Save, X, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { Brand } from "@/types"
import { BrandsSkeleton } from "@/components/skeletons/brands-skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"


import { toast } from "sonner"

export default function MarcasPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "date">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [showForm, setShowForm] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editName, setEditName] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, brand: Brand | null }>({ show: false, brand: null })
  const [deleting, setDeleting] = useState(false)

  // Filtrar, ordenar e paginar marcas
  const { filteredBrands, paginatedBrands, totalPages } = React.useMemo(() => {
    let filtered = brands.filter(brand => 
      brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
    
    // Paginar
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedBrands = filtered.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    
    return { 
      filteredBrands: filtered, 
      paginatedBrands, 
      totalPages 
    }
  }, [brands, searchTerm, sortBy, currentPage])

  const clearFilters = () => {
    setSearchTerm("")
    setSortBy("name")
    setCurrentPage(1)
  }

  useEffect(() => {
    fetchBrands()
  }, [])

  // Auto refresh when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchBrands()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands', { cache: 'no-store' })
      const data = await response.json()
      setBrands(data)
    } catch (error) {
      console.error('Erro ao buscar marcas:', error)
    } finally {
      setLoading(false)
    }
  }

  const createBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newBrandName.trim()) {
      toast.error('Nome da marca é obrigatório')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newBrandName.trim() })
      })

      if (response.ok) {
        setNewBrandName("")
        setShowForm(false)
        fetchBrands()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar marca')
      }
    } catch (error) {
      console.error('Erro ao criar marca:', error)
      toast.error('Erro ao criar marca')
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (brand: Brand) => {
    setEditingBrand(brand)
    setEditName(brand.name)
  }

  const closeEditDialog = () => {
    setEditingBrand(null)
    setEditName("")
  }

  const updateBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBrand || !editName.trim()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })

      if (response.ok) {
        closeEditDialog()
        fetchBrands()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar marca')
      }
    } catch (error) {
      console.error('Erro ao atualizar marca:', error)
      toast.error('Erro ao atualizar marca')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (brand: Brand) => {
    setDeleteConfirm({ show: true, brand })
  }

  const deleteBrand = async () => {
    if (!deleteConfirm.brand) return
    
    setDeleting(true)
    try {
      await fetch(`/api/brands/${deleteConfirm.brand.id}`, { method: 'DELETE' })
      setDeleteConfirm({ show: false, brand: null })
      fetchBrands()
    } catch (error) {
      console.error('Erro ao excluir marca:', error)
      toast.error('Erro ao excluir marca')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <BrandsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marcas</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as marcas dos produtos
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Marca
        </Button>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Barra de Pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar marcas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: "name" | "date") => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon" onClick={clearFilters}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Nova Marca
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createBrand} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Nome da Marca *</Label>
                <Input
                  id="brandName"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Ex: Nestlé"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Informações de Paginação */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Mostrando {paginatedBrands.length} de {filteredBrands.length} marcas
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedBrands.map((brand) => (
          <Card key={brand.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                {brand.name}
              </CardTitle>
              <CardDescription>
                Criada em {new Date(brand.createdAt).toLocaleDateString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(brand)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => confirmDelete(brand)}
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

      {paginatedBrands.length === 0 && filteredBrands.length === 0 && brands.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma marca encontrada</h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou termo de busca
            </p>
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {brands.length === 0 && !showForm && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-gray-600 mb-4">
              Comece cadastrando as marcas dos seus produtos
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Cadastrar Primeira Marca
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Edição */}
      <Dialog open={!!editingBrand} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Marca
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={updateBrand} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editBrandName">Nome da Marca *</Label>
              <Input
                id="editBrandName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Nestlé"
                required
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
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, brand: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir a marca <strong>{deleteConfirm.brand?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita e a marca será removida de todos os produtos.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deleteBrand}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm({ show: false, brand: null })}
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