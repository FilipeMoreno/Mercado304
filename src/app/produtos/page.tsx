import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ProductsClient } from "./products-client"
import API_BASE_URL from "@/lib/api"

interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    brand?: string
    sort?: string
    page?: string
  }
}

async function fetchProductsData(searchParams: any) {
  const params = new URLSearchParams({
    search: searchParams.search || '',
    category: searchParams.category || '',
    brand: searchParams.brand || '',
    sort: searchParams.sort || 'name-asc',
    page: searchParams.page || '1',
    limit: '12'
  })
  
  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    fetch(`${API_BASE_URL}/products?${params.toString()}`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/categories`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/brands`, { cache: 'no-store' })
  ])
  
  const [productsData, categoriesData, brandsData] = await Promise.all([
    productsRes.json(),
    categoriesRes.json(),
    brandsRes.json()
  ])
  
  const categories = categoriesData.categories || [];
  const brands = brandsData.brands || [];
  
  return { productsData, categories, brands };
}

export default async function ProdutosPage({ searchParams }: ProductsPageProps) {
  const { productsData, categories, brands } = await fetchProductsData(searchParams)
  
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
      
      <ProductsClient 
        productsData={productsData}
        categories={categories}
        brands={brands}
        searchParams={searchParams}
      />
    </div>
  )
}