"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, List, Check, X, Package, Edit, Trash2, Save, Eye, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react"
import { ShoppingList, ShoppingListItem } from "@/types"
import { ShoppingListSkeleton } from "@/components/skeletons/shopping-list-skeleton"
import { AiShoppingList } from "@/components/ai-shopping-list"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"


import { toast } from "sonner"

export default function ListaPage() {
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "items" | "date">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8
  const [editingList, setEditingList] = useState<ShoppingList | null>(null)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, list: ShoppingList | null }>({ show: false, list: null })
  const [deleting, setDeleting] = useState(false)

  // Filtrar, ordenar e paginar listas
  const { filteredLists, paginatedLists, totalPages } = React.useMemo(() => {
    let filtered = lists.filter(list => 
      list.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "items":
          return (b.items?.length || 0) - (a.items?.length || 0)
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
    
    // Paginar
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedLists = filtered.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    
    return { 
      filteredLists: filtered, 
      paginatedLists, 
      totalPages 
    }
  }, [lists, searchTerm, sortBy, currentPage])

  const clearFilters = () => {
    setSearchTerm("")
    setSortBy("name")
    setCurrentPage(1)
  }

  useEffect(() => {
    fetchLists()
  }, [])

  // Auto refresh when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!loading) {
        fetchLists()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [loading])

  const fetchLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists', { cache: 'no-store' })
      
      if (!response.ok) {
        throw new Error('Erro ao buscar listas')
      }

      const data = await response.json()
      setLists(data)
    } catch (error) {
      console.error('Erro ao buscar listas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (listId: string, itemId: string, isChecked: boolean) => {
    // 1. Otimista: Atualizar o estado local imediatamente
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === listId
          ? {
              ...list,
              items: list.items?.map(item =>
                item.id === itemId ? { ...item, isChecked: !isChecked } : item
              )
            }
          : list
      )
    )

    try {
      // 2. Chamar a API para persistir a mudança no banco de dados
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isChecked: !isChecked })
      })

      // 3. Se houver erro, reverter a mudança na interface
      if (!response.ok) {
        const error = await response.json()
        console.error('Erro ao atualizar item:', error.error)
        // Reverte o estado local em caso de falha da API
        setLists(prevLists =>
          prevLists.map(list =>
            list.id === listId
              ? {
                  ...list,
                  items: list.items?.map(item =>
                    item.id === itemId ? { ...item, isChecked: isChecked } : item
                  )
                }
              : list
          )
        )
        toast.error('Erro ao salvar a alteração. Tente novamente.')
      }
      
    } catch (error) {
      console.error('Erro ao atualizar item:', error)
      // Em caso de erro de rede, reverter a mudança na interface
      setLists(prevLists =>
        prevLists.map(list =>
          list.id === listId
            ? {
                ...list,
                items: list.items?.map(item =>
                  item.id === itemId ? { ...item, isChecked: isChecked } : item
                )
              }
            : list
        )
      )
      toast.error('Erro de conexão. Tente novamente.')
    }
  }

  const openEditDialog = (list: ShoppingList) => {
    setEditingList(list)
    setEditName(list.name)
  }

  const closeEditDialog = () => {
    setEditingList(null)
    setEditName("")
  }

  const updateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingList || !editName.trim()) return

    setSaving(true)
    try {
      const response = await fetch(`/api/shopping-lists/${editingList.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() })
      })

      if (response.ok) {
        closeEditDialog()
        fetchLists()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao atualizar lista')
      }
    } catch (error) {
      console.error('Erro ao atualizar lista:', error)
      toast.error('Erro ao atualizar lista')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = (list: ShoppingList) => {
    setDeleteConfirm({ show: true, list })
  }

  const deleteList = async () => {
    if (!deleteConfirm.list) return
    
    setDeleting(true)
    try {
      await fetch(`/api/shopping-lists/${deleteConfirm.list.id}`, { method: 'DELETE' })
      setDeleteConfirm({ show: false, list: null })
      fetchLists()
    } catch (error) {
      console.error('Erro ao excluir lista:', error)
      toast.error('Erro ao excluir lista')
    } finally {
      setDeleting(false)
    }
  }


  const handleGenerateAutoList = async (type: 'weekly' | 'monthly') => {
    try {
      const response = await fetch('/api/predictions/auto-shopping-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      return await response.json()
    } catch (error) {
      console.error('Erro ao gerar lista:', error)
      throw error
    }
  }

  const handleCreateAutoList = async (items: any[]) => {
    try {
      // Criar nova lista
      const listResponse = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Lista IA - ${new Date().toLocaleDateString('pt-BR')}`,
          description: 'Gerada automaticamente pela IA'
        })
      })
      
      const newList = await listResponse.json()
      
      // Adicionar itens à lista
      await Promise.all(
        items.map(item =>
          fetch(`/api/shopping-lists/${newList.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          })
        )
      )
      
      // Recarregar listas
      fetchLists()
      toast.success(`Lista criada com ${items.length} itens!`)
    } catch (error) {
      console.error('Erro ao criar lista:', error)
      throw error
    }
  }

  if (loading) {
    return <ShoppingListSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lista de Compras</h1>
          <p className="text-gray-600 mt-2">
            Organize suas próximas compras
          </p>
        </div>
        <Link href="/lista/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Lista
          </Button>
        </Link>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            {/* Barra de Pesquisa */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar listas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: "name" | "items" | "date") => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="items">Nº Itens</SelectItem>
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

      {/* IA Shopping List Generator */}
      <AiShoppingList 
        onGenerateList={handleGenerateAutoList}
        onCreateShoppingList={handleCreateAutoList}
      />

      {/* Informações de Paginação */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Mostrando {paginatedLists.length} de {filteredLists.length} listas
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedLists.map((list) => (
          <Card key={list.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    {list.name}
                  </CardTitle>
                  <CardDescription>
                    {list.items?.length || 0} itens • {
                      list.items?.filter(item => item.isChecked).length || 0
                    } concluídos
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Link href={`/lista/${list.id}`}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditDialog(list)}
                    title="Editar lista"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => confirmDelete(list)}
                    title="Excluir lista"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {(!list.items || list.items.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-8 w-8 mx-auto mb-2" />
                  <p>Lista vazia</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Link href={`/lista/${list.id}`}>
                    <Button variant="outline">
                      Ver Lista Completa
                    </Button>
                  </Link>
                </div>
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

      {filteredLists.length === 0 && lists.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <List className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma lista encontrada</h3>
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

      {lists.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <List className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma lista criada</h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira lista de compras para se organizar melhor
            </p>
            <Link href="/lista/nova">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Lista
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}


      {/* Dialog de Edição */}
      <Dialog open={!!editingList} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Editar Lista
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={updateList} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editListName">Nome da Lista *</Label>
              <Input
                id="editListName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ex: Compras da Semana"
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
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, list: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir a lista <strong>{deleteConfirm.list?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita e todos os itens da lista serão perdidos.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deleteList}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm({ show: false, list: null })}
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