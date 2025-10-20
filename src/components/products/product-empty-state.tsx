"use client"

import { Filter, Package, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

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
	onResetSearch,
}: ProductEmptyStateProps) {
	if (totalCount === 0) {
		return (
			<Empty className="border border-dashed py-12">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Package className="size-6" />
					</EmptyMedia>
					<EmptyTitle>Nenhum produto cadastrado</EmptyTitle>
					<EmptyDescription>Comece adicionando seu primeiro produto</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Link href="/produtos/novo">
						<Button>
							<Plus className="mr-2 size-4" />
							Cadastrar Primeiro Produto
						</Button>
					</Link>
				</EmptyContent>
			</Empty>
		)
	}

	if (hasActiveFilters) {
		return (
			<Empty className="border border-dashed py-12">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Package className="size-6" />
					</EmptyMedia>
					<EmptyTitle>Nenhum produto encontrado</EmptyTitle>
					<EmptyDescription>Tente ajustar os filtros de busca</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Button
						variant="outline"
						onClick={() => {
							onResetSearch()
							onClearFilters()
						}}
					>
						<Filter className="size-4 mr-2" />
						Limpar Filtros
					</Button>
				</EmptyContent>
			</Empty>
		)
	}

	return null
}
