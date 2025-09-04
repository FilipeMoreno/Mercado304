import { notFound } from 'next/navigation'
import { EditStockClient } from './edit-stock-client'

interface EditStockPageProps {
  params: { id: string }
}

async function fetchStockItem(id: string) {
  const response = await fetch(`http://localhost:3000/api/stock/${id}`, { cache: 'no-store' })
  if (!response.ok) {
    return null
  }
  return response.json()
}

async function fetchProducts() {
  const response = await fetch('http://localhost:3000/api/products', { cache: 'no-store' })
  const products = await response.json()
  return products
}

export default async function EditStockPage({ params }: EditStockPageProps) {
  const [stockItem, products] = await Promise.all([
    fetchStockItem(params.id),
    fetchProducts()
  ])

  if (!stockItem) {
    notFound()
  }

  return (
    <EditStockClient
      stockItem={stockItem}
      products={products || []}
    />
  )
}