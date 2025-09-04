// src/app/lista/page.tsx

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ListaClient } from "./lista-client"

interface ListaPageProps {
  searchParams: {
    search?: string
    sort?: string
    page?: string
    status?: string
  }
}

async function fetchShoppingLists(searchParams: ListaPageProps['searchParams']) {
  const params = new URLSearchParams()
  if (searchParams.search) params.set('search', searchParams.search)
  if (searchParams.sort) params.set('sort', searchParams.sort)
  if (searchParams.page) params.set('page', searchParams.page)
  if (searchParams.status) params.set('status', searchParams.status)
  params.set('itemsPerPage', '12')
  
  const response = await fetch(`http://localhost:3000/api/shopping-lists?${params.toString()}`, { cache: 'no-store' })
  const data = await response.json()
  return { lists: data.lists, totalCount: data.totalCount }
}

export default async function ListaPage({ searchParams }: ListaPageProps) {
  const { lists, totalCount } = await fetchShoppingLists(searchParams)
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Listas de Compras</h1>
          <p className="text-gray-600 mt-2">
            Organize suas listas de compras
          </p>
        </div>
        <Link href="/lista/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Lista
          </Button>
        </Link>
      </div>
      
      <ListaClient 
        initialShoppingLists={lists}
        initialTotalCount={totalCount}
        searchParams={searchParams}
      />
    </div>
  )
}