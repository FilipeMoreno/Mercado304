"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Edit, Trash2, Package, BarChart3 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface CategoryDetails {
  id: string
  name: string
  icon?: string
  color?: string
  products: {
    id: string
    name: string
    unit: string
    brand?: { name: string }
    _count?: {
      purchaseItems: number
    }
  }[]
  _count: {
    products: number
  }
}

export default function CategoriaDetalhesPage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.id as string

  const [category, setCategory] = useState<CategoryDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (categoryId) {
      fetchCategoryDetails()
    }
  }, [categoryId])

  const fetchCategoryDetails = async () => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`)

      if (!response.ok) {
        toast.error('Categoria não encontrada')
        router.push('/categorias')
        return
      }

      const data = await response.json()
      setCategory(data)
    } catch (error) {
      console.error('Erro ao buscar detalhes da categoria:', error)
      toast.error('Erro ao carregar detalhes da categoria')
      router.push('/categorias')
    } finally {
      setLoading(false)
    }
  }

  const deleteCategory = async () => {
    // Implementar lógica de exclusão (diálogo de confirmação, etc.)
    // Você pode usar o useDataMutation hook para isso
    // Exemplo: await remove(`/api/categories/${categoryId}`)
    toast.error('Exclusão de categorias não implementada neste exemplo.')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div>
                <div className="h-8 w-64 mb-2 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
                      <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="space-y-1 mt-2">
                      <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!category) {
    return null
  }
  
  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="flex items-center gap-4">
        <Link href="/categorias">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{category.icon || '📦'}</div>
            <div>
              <h1 className="text-3xl font-bold">{category.name}</h1>
              <p className="text-gray-600 mt-1">
                {category._count.products} {category._count.products === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/categorias/${categoryId}/editar`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={deleteCategory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Estatísticas da Categoria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{category._count.products}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos da Categoria
          </CardTitle>
          <CardDescription>
            Todos os produtos associados a esta categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {category.products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Nenhum produto nesta categoria</p>
              <p className="text-gray-600">
                Comece adicionando produtos a esta categoria na{" "}
                <Link href="/produtos" className="text-blue-600 hover:underline">
                  página de produtos
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.products.map((product) => (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {product.name}
                    </CardTitle>
                    <CardDescription className="space-y-1">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}