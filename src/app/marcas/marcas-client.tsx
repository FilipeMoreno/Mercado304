// src/app/marcas/marcas-client.tsx
"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Tag, Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight, Factory } from "lucide-react"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Brand } from "@/types"
import { useDataMutation, useUrlState, useDeleteConfirmation, usePagination } from "@/hooks"
import { toast } from "sonner"
import Link from "next/link"

interface MarcasClientProps {
  initialBrands: Brand[]
  initialTotalCount: number
  searchParams: {
    search?: string
    sort?: string
    page?: string
  }
}

export function MarcasClient({ initialBrands, initialTotalCount, searchParams }: MarcasClientProps) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [showForm, setShowForm] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editName, setEditName] = useState("")
  const itemsPerPage = 12

  // Hooks customizados
  const { create, update, remove, loading } = useDataMutation()
  const { deleteState, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirmation<Brand>()
  
  const { state, updateSingleValue, clearFilters, hasActiveFilters } = useUrlState({
    basePath: '/marcas',
    initialValues: {
      search: searchParams.search || "",
      sort: searchParams.sort || "name",
      page: parseInt(searchParams.page || "1")
    }
  })

  // Usando os dados iniciais do servidor como fonte para o hook de paginação
  const { paginatedData: paginatedBrands, totalPages, filteredData } = usePagination({
    data: brands,
    itemsPerPage,
    currentPage: state.page,
    searchTerm: state.search,
    sortBy: state.sort
  })

  // Sincronizar o estado interno com os dados iniciais do servidor
  React.useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);


  const sortOptions = [
    { value: "name", label: "Nome" },
    { value: "date", label: "Data" }
  ]

  const createBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBrandName.trim()) {
      toast.error('Nome da marca é obrigatório')
      return
    }
    
    await create('/api/brands', 
      { name: newBrandName.trim() }, 
      { 
        successMessage: 'Marca criada com sucesso!',
        onSuccess: () => {
          setNewBrandName("")
          setShowForm(false)
          // Forçar um refresh para buscar os novos dados
          window.location.reload(); 
        }
      }
    )
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
    
    await update(`/api/brands/${editingBrand.id}`, 
      { name: editName.trim() }, 
      { 
        successMessage: 'Marca atualizada com sucesso!',
        onSuccess: closeEditDialog 
      }
    )
  }

  const deleteBrand = async () => {
    if (!deleteState.item) return
    
    await remove(`/api/brands/${deleteState.item.id}`, {
      successMessage: 'Marca excluída com sucesso!',
      onSuccess: closeDeleteConfirm
    })
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      updateSingleValue('page', page)
    }
  }

  return (
    <>
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
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar marcas..."
            value={state.search}
            onChange={(e) => updateSingleValue('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterPopover
          sortValue={state.sort}
          onSortChange={(value) => updateSingleValue('sort', value)}
          sortOptions={sortOptions}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            clearFilters()
            updateSingleValue('page', 1)
          }}
        />
      </div>

      {/* Informações de Paginação */}
      <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
        <span>
          Mostrando {paginatedBrands.length} de {filteredData.length} marcas
        </span>
        <span>
          Página {state.page} de {totalPages}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedBrands.map((brand) => (
          <Card key={brand.id} className="hover:shadow-md transition-shadow">
            <Link href={`/marcas/${brand.id}`} className="block">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  {brand.name}
                </CardTitle>
                <CardDescription>
                  {brand._count?.products || 0} {brand._count?.products === 1 ? 'produto' : 'produtos'}
                </CardDescription>
              </CardHeader>
            </Link>
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
                  onClick={() => openDeleteConfirm(brand)}
                  disabled={(brand._count?.products || 0) > 0}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {(brand._count?.products || 0) > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Não é possível excluir marca com produtos
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
            onClick={() => handlePageChange(state.page - 1)}
            disabled={state.page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => 
                page === 1 || 
                page === totalPages || 
                Math.abs(page - state.page) <= 2
              )
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

      {filteredData.length === 0 && brands.length > 0 && (
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

      {brands.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Tag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma marca cadastrada</h3>
            <p className="text-gray-600 mb-4">Crie a primeira marca para seus produtos</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Marca
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Nova Marca */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Marca</DialogTitle>
          </DialogHeader>
          <form onSubmit={createBrand} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da Marca *</Label>
              <Input
                id="name"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Nome da marca"
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Criando..." : "Criar Marca"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={!!editingBrand} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Marca</DialogTitle>
          </DialogHeader>
          <form onSubmit={updateBrand} className="space-y-4">
            <div>
              <Label htmlFor="editName">Nome da Marca *</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nome da marca"
                required
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
              <Button type="button" variant="outline" onClick={closeEditDialog}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
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
              Tem certeza que deseja excluir a marca <strong>{deleteState.item?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deleteBrand}
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