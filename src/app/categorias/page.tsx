"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Tag, Edit, Trash2, Package, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { CategoriesSkeleton } from "@/components/skeletons/categories-skeleton"


import { toast } from "sonner"

interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  createdAt: string
  updatedAt: string
  _count: {
    products: number
  }
}

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "products" | "date">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12
  const [showForm, setShowForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: "", icon: "", color: "" })
  const [saving, setSaving] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editForm, setEditForm] = useState({ name: "", icon: "", color: "" })
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, category: Category | null }>({ show: false, category: null })
  const [deleting, setDeleting] = useState(false)

  // Filtrar, ordenar e paginar categorias
  const { filteredCategories, paginatedCategories, totalPages } = React.useMemo(() => {
    let filtered = categories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "products":
          return b._count.products - a._count.products
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
    
    // Paginar
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedCategories = filtered.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    
    return { 
      filteredCategories: filtered, 
      paginatedCategories, 
      totalPages 
    }
  }, [categories, searchTerm, sortBy, currentPage])

  const clearFilters = () => {
    setSearchTerm("")
    setSortBy("name")
    setCurrentPage(1)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // Auto refresh when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchCategories()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', { cache: 'no-store' })
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCategory.name.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      })

      if (response.ok) {
        setNewCategory({ name: "", icon: "", color: "" })
        setShowForm(false)
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar categoria')
      }
    } catch (error) {
      toast.error('Erro ao criar categoria')
    } finally {
      setSaving(false)
    }
  }

  const openEditDialog = (category: Category) => {
    setEditingCategory(category)
    setEditForm({ 
      name: category.name, 
      icon: category.icon || "", 
      color: category.color || "" 
    })
  }

  const closeEditDialog = () => {
    setEditingCategory(null)
    setEditForm({ name: "", icon: "", color: "" })
  }

  const updateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    setSaving(true)
    try {
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        closeEditDialog()
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar categoria')
      }
    } catch (error) {
      toast.error('Erro ao atualizar categoria')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (category: Category) => {
    setDeleteConfirm({ show: true, category })
  }

  const deleteCategory = async () => {
    if (!deleteConfirm.category) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/categories/${deleteConfirm.category.id}`, { method: 'DELETE' })
      
      if (response.ok) {
        setDeleteConfirm({ show: false, category: null })
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao excluir categoria')
      }
    } catch (error) {
      toast.error('Erro ao excluir categoria')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <CategoriesSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as categorias dos seus produtos
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
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
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: "name" | "products" | "date") => setSortBy(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="products">N° Produtos</SelectItem>
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

      {/* Informações de Paginação */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Mostrando {paginatedCategories.length} de {filteredCategories.length} categorias
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {category.icon ? (
                  <span className="text-lg">{category.icon}</span>
                ) : (
                  <Tag className="h-5 w-5" />
                )}
                {category.name}
              </CardTitle>
              <CardDescription>
                {category._count.products} {category._count.products === 1 ? 'produto' : 'produtos'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openEditDialog(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => confirmDelete(category)}
                  disabled={category._count.products > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {category._count.products > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Não é possível excluir categoria com produtos
                </p>
              )}
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

      {filteredCategories.length === 0 && categories.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
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

      {categories.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma categoria cadastrada</h3>
            <p className="text-gray-600 mb-4">Crie a primeira categoria para organizar seus produtos</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Nova Categoria */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={createCategory} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                placeholder="Nome da categoria"
                required
              />
            </div>
            <div>
              <Label htmlFor="icon">Ícone (emoji)</Label>
              <Input
                id="icon"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({...newCategory, icon: e.target.value})}
                placeholder="🥕 (opcional)"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="color">Cor (hex)</Label>
              <Input
                id="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({...newCategory, color: e.target.value})}
                placeholder="#ff6b6b (opcional)"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Criar Categoria"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={updateCategory} className="space-y-4">
            <div>
              <Label htmlFor="editName">Nome *</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Nome da categoria"
                required
              />
            </div>
            <div>
              <Label htmlFor="editIcon">Ícone (emoji)</Label>
              <Input
                id="editIcon"
                value={editForm.icon}
                onChange={(e) => setEditForm({...editForm, icon: e.target.value})}
                placeholder="🥕 (opcional)"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="editColor">Cor (hex)</Label>
              <Input
                id="editColor"
                value={editForm.color}
                onChange={(e) => setEditForm({...editForm, color: e.target.value})}
                placeholder="#ff6b6b (opcional)"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, category: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir a categoria <strong>{deleteConfirm.category?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deleteCategory}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm({ show: false, category: null })}
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