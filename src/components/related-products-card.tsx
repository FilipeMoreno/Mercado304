"use client"

import { ListPlus, Loader2, Tag, X } from "lucide-react"
import { useRelatedProductsQuery } from "@/hooks/use-react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

interface RelatedProduct {
	id: string
	name: string
	brandName: string
	count: number
}

interface RelatedProductsCardProps {
	productId: string
	onAddProduct: (productId: string) => void
	onClose?: () => void
}

export function RelatedProductsCard({ productId, onAddProduct, onClose }: RelatedProductsCardProps) {
	// Fetch related products using React Query
	const { data: suggestions, isLoading: loading } = useRelatedProductsQuery(productId)

	if (loading) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="flex items-center gap-2 text-sm">
						<Loader2 className="h-4 w-4 animate-spin" />
						Buscando sugestões...
					</CardTitle>
					{onClose && (
						<Button variant="ghost" size="icon" className="h-auto w-auto" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					)}
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						<Skeleton className="h-6 w-24" />
						<Skeleton className="h-6 w-28" />
						<Skeleton className="h-6 w-20" />
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!suggestions || suggestions.length === 0) {
		return null
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<div>
					<CardTitle className="flex items-center gap-2 text-sm">
						<Tag className="h-4 w-4" />
						Comprados Juntos
					</CardTitle>
					<CardDescription>Clientes que compraram este item também compraram:</CardDescription>
				</div>
				{onClose && (
					<Button variant="ghost" size="icon" className="h-auto w-auto" onClick={onClose}>
						<X className="h-4 w-4" />
					</Button>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{suggestions.map((product) => (
						<TooltipProvider key={product.id}>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="outline" className="flex-shrink-0" onClick={() => onAddProduct(product.id)}>
										<ListPlus className="h-3 w-3 mr-1" />
										{product.name}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>
										{product.name} ({product.brandName})
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
