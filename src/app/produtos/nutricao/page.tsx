"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { MissingNutritionalInfo } from "@/components/products/missing-nutritional-info"
import { Product } from "@/types"

async function fetchAllProducts(): Promise<Product[]> {
	// Primeiro, buscar apenas para saber o total
	const firstResponse = await fetch("/api/products?include=category,brand,nutritionalInfo&limit=1&page=1")
	if (!firstResponse.ok) {
		throw new Error("Erro ao carregar produtos")
	}

	const firstData = await firstResponse.json()
	const totalCount = firstData.pagination?.totalCount || 0

	// Se não há produtos, retornar array vazio
	if (totalCount === 0) return []

	// Buscar todos os produtos de uma vez com limite alto
	const response = await fetch(`/api/products?include=category,brand,nutritionalInfo&limit=${Math.min(totalCount, 1000)}`)
	if (!response.ok) {
		throw new Error("Erro ao carregar produtos")
	}

	const data = await response.json()
	return data.products || []
}

export default function NutritionalInfoPage() {
	const [refreshKey, setRefreshKey] = useState(0)

	const { data: products = [], isLoading, error, refetch } = useQuery<Product[]>({
		queryKey: ["products", "nutritional-info", refreshKey],
		queryFn: fetchAllProducts,
	})

	const handleNutritionalInfoAdded = (productId: string) => {
		// Forçar refresh dos dados
		setRefreshKey(prev => prev + 1)
	}

	if (error) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center py-12">
					<p className="text-red-600">Erro ao carregar produtos</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8">
			<MissingNutritionalInfo
				products={products}
				onNutritionalInfoAdded={handleNutritionalInfoAdded}
				isLoading={isLoading}
			/>
		</div>
	)
}
