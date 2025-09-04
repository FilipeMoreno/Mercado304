// src/app/produtos/page.tsx

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Product } from "@/types"
import Link from "next/link"
import { ProductsClient } from "./products-client"

interface ProductsPageProps {
  searchParams: {
    search?: string
    category?: string
    brand?: string
    sort?: string
    page?: string
  }
}

async function fetchProductsData() {
  const [productsRes, categoriesRes, brandsRes] = await Promise.all([
    fetch('http://localhost:3000/api/products', { cache: 'no-store' }),
    fetch('http://localhost:3000/api/categories', { cache: 'no-store' }),
    fetch('http://localhost:3000/api/brands', { cache: 'no-store' })
  ])
  
  const [products, categories, brandsData] = await Promise.all([
    productsRes.json(),
    categoriesRes.json(),
    brandsRes.json()
  ])
  
  // A API de marcas agora retorna um objeto com a propriedade 'brands'.
  const brands = brandsData.brands || [];
  
  return { products, categories, brands };
}

export default async function ProdutosPage({ searchParams }: ProductsPageProps) {
  const { products, categories, brands } = await fetchProductsData()
  
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
        initialProducts={products}
        categories={categories}
        brands={brands}
        searchParams={searchParams}
      />
    </div>
  )
}