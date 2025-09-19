"use client"

import { Filter, Package, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface ProductEmptyStateProps {
	totalCount: number
	hasActiveFilters: boolean
	onClearFilters: () => void
	onResetSearch: () => void
}

export function ProductEmptyState({
	totalCount,
	hasActiveFilters,
	onClearFilters,
	onResetSearch
}: ProductEmptyStateProps) {
	if (totalCount === 0) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
					<h3 className="text-lg font-medium mb-2">Nenhum produto cadastrado</h3>
					<p className="text-gray-600 mb-4">Comece adicionando seu primeiro produto</p>
					<Link href="/produtos/novo">
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Cadastrar Primeiro Produto
						</Button>
					</Link>
				</CardContent>
			</Card>
		)
	}

	if (hasActiveFilters) {
		return (
			<Card>
				<CardContent className="text-center py-12">
					<Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
					<h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
					<p className="text-gray-600 mb-4">Tente ajustar os filtros de busca</p>
					<Button
						variant="outline"
						onClick={() => {
							onResetSearch()
							onClearFilters()
						}}
					>
						<Filter className="h-4 w-4 mr-2" />
						Limpar Filtros
					</Button>
				</CardContent>
			</Card>
		)
	}

	return null
}