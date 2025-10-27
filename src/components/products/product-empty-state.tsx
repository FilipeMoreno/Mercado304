"use client"

import { Filter, Package, Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { isBarcode } from "@/lib/barcode-utils"

interface ProductEmptyStateProps {
	totalCount: number
	hasActiveFilters: boolean
	onClearFilters: () => void
	onResetSearch: () => void
	searchValue?: string
}

export function ProductEmptyState({
	totalCount,
	hasActiveFilters,
	onClearFilters,
	onResetSearch,
	searchValue = "",
}: ProductEmptyStateProps) {
	// Construir URL de cadastro com auto-preenchimento
	const getCreateUrl = () => {
		if (!searchValue) return "/produtos/novo"

		// Se for código de barras, passar como barcode
		if (isBarcode(searchValue)) {
			return `/produtos/novo?barcode=${encodeURIComponent(searchValue)}`
		}

		// Se for texto, passar como name
		return `/produtos/novo?name=${encodeURIComponent(searchValue)}`
	}

	const getButtonText = () => {
		if (!searchValue) return "Cadastrar Primeiro Produto"

		if (isBarcode(searchValue)) {
			return `Cadastrar Produto com Código ${searchValue}`
		}

		return `Cadastrar Produto "${searchValue}"`
	}

	if (totalCount === 0) {
		return (
			<Empty className="border border-dashed py-12">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Package className="h-6 w-6" />
					</EmptyMedia>
					<EmptyTitle>Nenhum produto cadastrado</EmptyTitle>
					<EmptyDescription>Comece adicionando seu primeiro produto</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<Link href={getCreateUrl()}>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							{getButtonText()}
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
						<Package className="h-6 w-6" />
					</EmptyMedia>
					<EmptyTitle>Nenhum produto encontrado</EmptyTitle>
					<EmptyDescription>Tente ajustar os filtros de busca</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<div className="flex flex-col sm:flex-row gap-2">
						{searchValue && (
							<Link href={getCreateUrl()}>
								<Button>
									<Plus className="mr-2 h-4 w-4" />
									{getButtonText()}
								</Button>
							</Link>
						)}
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
					</div>
				</EmptyContent>
			</Empty>
		)
	}

	return null
}
