// src/app/produtos/products-client.tsx
"use client"

import * as React from "react"
import { useState, useMemo, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FilterPopover } from "@/components/ui/filter-popover"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Package, Tag, Edit, Trash2, BarChart3, ChevronLeft, ChevronRight, Search, Filter } from "lucide-react"
import { Product } from "@/types"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import { filterProducts } from "@/lib/barcode-utils"
import { Input } from "@/components/ui/input"
import { SelectWithSearch } from "@/components/ui/select-with-search"

interface ProductsClientProps {
  initialProducts: Product[]
  categories: any[]
  brands: any[]
  searchParams: {
    search?: string
    category?: string
    brand?: string
    sort?: string
    page?: string
  }
}

export function ProductsClient({ initialProducts, categories, brands, searchParams }: ProductsClientProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, product: Product | null }>({ show: false, product: null })
  const [deleting, setDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "")
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.category || "")
  const [selectedBrand, setSelectedBrand] = useState<string>(searchParams.brand || "")
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "category" | "date-desc">(searchParams.sort as any || "name-asc")
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.page || "1"))
  const itemsPerPage = 12

  const sortOptions = [
    { value: "name-asc", label: "Nome (A-Z)" },
    { value: "name-desc", label: "Nome (Z-A)" },
    { value: "category", label: "Categoria" },
    { value: "date-desc", label: "Mais recente" }
  ]

  const categoryOptions = useMemo(() => ([
    { value: "all", label: "Todas as categorias", icon: "" },
    ...(categories || []).map(cat => ({ value: cat.id, label: cat.name, icon: cat.icon }))
  ]), [categories])

  const brandOptions = useMemo(() => ([
    { value: "all", label: "Todas as marcas" },
    ...(brands || []).map(brand => ({ value: brand.id, label: brand.name }))
  ]), [brands])


  const { filteredProducts, totalPages, paginatedProducts } = useMemo(() => {
    let filtered = filterProducts(products, searchTerm)
    
    if (selectedCategory && selectedCategory !== "all") {
      filtered = filtered.filter(p => p.categoryId === selectedCategory)
    }
    
    if (selectedBrand && selectedBrand !== "all") {
      filtered = filtered.filter(p => p.brandId === selectedBrand)
    }
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-desc":
          return b.name.localeCompare(a.name)
        case "category":
          return (a.category?.name || "").localeCompare(b.category?.name || "")
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return a.name.localeCompare(b.name)
      }
    })
    
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

  useEffect(() => {
    const params = new URLSearchParams(urlSearchParams)
    if (searchTerm) params.set('search', searchTerm)
    else params.delete('search')
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
    else params.delete('category')
    if (selectedBrand && selectedBrand !== 'all') params.set('brand', selectedBrand)
    else params.delete('brand')
    if (sortBy !== 'name-asc') params.set('sort', sortBy)
    else params.delete('sort')
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/produtos'
    router.push(newUrl, { scroll: false })
  }, [searchTerm, selectedCategory, selectedBrand, sortBy, router, urlSearchParams])

  const confirmDelete = (product: Product) => {
    setDeleteConfirm({ show: true, product })
  }

  const deleteProduct = async () => {
    if (!deleteConfirm.product) return
    
    setDeleting(true)
    try {
      await fetch(`/api/products/${deleteConfirm.product.id}`, { method: 'DELETE' })
      setProducts(products.filter(p => p.id !== deleteConfirm.product!.id))
      setDeleteConfirm({ show: false, product: null })
      toast.success('Produto excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir produto:', error)
      toast.error('Erro ao excluir produto')
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("")
    setSelectedBrand("")
    setSortBy("name-asc")
    setCurrentPage(1)
  }

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "" || selectedBrand !== "" || sortBy !== "name-asc"

  const additionalFilters = (
    <>
      <SelectWithSearch
        label="Categoria"
        options={categoryOptions}
        value={selectedCategory}
        onValueChange={setSelectedCategory}
        placeholder="Todas as categorias"
        emptyMessage="Nenhuma categoria encontrada."
        searchPlaceholder="Buscar categorias..."
      />

      <SelectWithSearch
        label="Marca"
        options={brandOptions}
        value={selectedBrand}
        onValueChange={setSelectedBrand}
        placeholder="Todas as marcas"
        emptyMessage="Nenhuma marca encontrada."
        searchPlaceholder="Buscar marcas..."
      />
    </>
  )

  return (
    <>
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Nome, código ou escaneie..."
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
        {paginatedProducts.length === 0 && products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
              <p className="text-gray-600 mb-4">
                Comece adicionando seu primeiro produto
              </p>
              <Link href="/produtos/novo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Produto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : paginatedProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros de busca
              </p>
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
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
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        {product.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="space-y-1">
                      {product.category && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>{product.category.icon} {product.category.name}</span>
                        </div>
                      )}
                      {product.brand && (
                        <div className="text-sm text-gray-600">
                          Marca: {product.brand.name}
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        Unidade: {product.unit}
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
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
              Esta ação não pode ser desfeita e todas as informações relacionadas ao produto serão perdidas.
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
    </>
  )
}