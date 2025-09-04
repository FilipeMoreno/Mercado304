"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Package, Tag, Edit, Trash2, Save, BarChart3, Search, Filter, Barcode, ChevronLeft, ChevronRight } from "lucide-react"
import { Product } from "@/types"
import { ProductsSkeleton } from "@/components/skeletons/products-skeleton"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { BrandSelect, CategorySelect } from "@/components/selects"
import { toast } from "sonner"
import { useAppData } from "@/contexts/app-data-context"
import { filterProducts, isBarcode } from "@/lib/barcode-utils"

export default function ProdutosPage() {
  const { products, productsLoading, categories, brands } = useAppData()
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, product: Product | null }>({ show: false, product: null })
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [sortBy, setSortBy] = useState<"name" | "category" | "date">("name")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Filtrar, ordenar e paginar produtos
  const { filteredProducts, totalPages, paginatedProducts } = React.useMemo(() => {
    let filtered = filterProducts(products, searchTerm)
    
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(p => p.categoryId === selectedCategory)
    }
    
    if (selectedBrand && selectedBrand !== "all") {
      filtered = filtered.filter(p => p.brandId === selectedBrand)
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "category":
          return (a.category?.name || "").localeCompare(b.category?.name || "")
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })
    
    // Paginar
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedProducts = filtered.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    
    return { 
      filteredProducts: filtered, 
      totalPages, 
      paginatedProducts 
    }
  }, [products, searchTerm, selectedCategory, selectedBrand, sortBy, currentPage])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedBrand("all")
    setSortBy("name")
    setCurrentPage(1)
  }

  const confirmDelete = (product: Product) => {
    setDeleteConfirm({ show: true, product })
  }

  const deleteProduct = async () => {
    if (!deleteConfirm.product) return
    
    setDeleting(true)
    try {
      await fetch(`/api/products/${deleteConfirm.product.id}`, { method: 'DELETE' })
      setDeleteConfirm({ show: false, product: null })
      window.location.reload()
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto')
    } finally {
      setDeleting(false)
    }
  }


  if (productsLoading) {
    return <ProductsSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie o catálogo de produtos
          </p>
        </div>
        <Link href="/produtos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
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
                placeholder="Buscar por nome ou código de barras..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {isBarcode(searchTerm) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <span className="flex text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                    <Barcode className="h-4 w-4 mr-1"/> Código
                  </span>
                </div>
              )}
            </div>
            
            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={(value: "name" | "category" | "date") => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="category">Categoria</SelectItem>
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
          Mostrando {paginatedProducts.length} de {filteredProducts.length} produtos
        </span>
        <span>
          Página {currentPage} de {totalPages}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedProducts.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {product.name}
              </CardTitle>
              <CardDescription className="space-y-1">
                {product.category && (
                  <div className="flex items-center gap-1">
                    {product.category.icon ? (
                      <span className="text-sm">{product.category.icon}</span>
                    ) : (
                      <Tag className="h-3 w-3" />
                    )}
                    {product.category.name}
                  </div>
                )}
                <div className="text-sm">
                  Unidade: {product.unit}
                </div>
                {product.brand && (
                  <div className="text-xs text-gray-500">
                    Marca: {product.brand.name}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Link href={`/produtos/${product.id}`}>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Detalhes
                  </Button>
                </Link>
                <Link href={`/produtos/${product.id}/editar`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => confirmDelete(product)}
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
          </Button>
        </div>
      )}

      {paginatedProducts.length === 0 && filteredProducts.length === 0 && products.length > 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
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

      {products.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
            <p className="text-gray-600 mb-4">
              Comece cadastrando seus produtos favoritos
            </p>
            <Link href="/produtos/novo">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Cadastrar Primeiro Produto
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}


      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={deleteConfirm.show} onOpenChange={(open) => !open && setDeleteConfirm({ show: false, product: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Tem certeza que deseja excluir o produto <strong>{deleteConfirm.product?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Esta ação não pode ser desfeita e o produto será removido de todas as compras e listas.
            </p>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="destructive" 
                onClick={deleteProduct}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeleteConfirm({ show: false, product: null })}
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