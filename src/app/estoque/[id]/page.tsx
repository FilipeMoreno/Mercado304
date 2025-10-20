import { notFound } from "next/navigation"
import API_BASE_URL from "@/lib/api"
import { EditStockClient } from "./edit-stock-client"

interface EditStockPageProps {
	params: Promise<{ id: string }>
}

async function fetchStockItem(id: string) {
	const response = await fetch(`${API_BASE_URL}/stock/${id}`, {
		cache: "no-store",
	})
	if (!response.ok) {
		return null
	}
	return response.json()
}

async function fetchProducts() {
	const response = await fetch(`${API_BASE_URL}/products`, {
		cache: "no-store",
	})
	const products = await response.json()
	return products
}

export default async function EditStockPage(props: EditStockPageProps) {
    const params = await props.params;
    const [stockItem, products] = await Promise.all([fetchStockItem(params.id), fetchProducts()])

    if (!stockItem) {
		notFound()
	}

    return <EditStockClient stockItem={stockItem} products={products || []} />
}
