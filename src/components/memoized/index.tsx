"use client"

import { BarChart3, Edit, MoreHorizontal, Trash2 } from "lucide-react"
import { memo, useCallback, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ProductCard memoizado
interface ProductCardMemoProps {
	product: any
	onDelete: (product: any) => void
	onEdit?: (product: any) => void
}

export const ProductCardMemo = memo<ProductCardMemoProps>(
	({ product, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(product)
		}, [product, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(product)
		}, [product, onEdit])

		const productDisplayName = useMemo(() => {
			return product.name || "Produto sem nome"
		}, [product.name])

		const productUnit = useMemo(() => {
			return product.unit || "un"
		}, [product.unit])

		const brandName = useMemo(() => {
			return product.brand?.name || null
		}, [product.brand?.name])

		return (
			<TooltipProvider>
				<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
					<CardContent className="flex-1 flex flex-col p-4">
						<div className="flex-1">
							<div className="flex items-start justify-between mb-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<h3 className="font-medium text-sm line-clamp-2 flex-1 mr-2">{productDisplayName}</h3>
									</TooltipTrigger>
									<TooltipContent>
										<p>{productDisplayName}</p>
									</TooltipContent>
								</Tooltip>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={handleEdit}>
											<Edit className="h-4 w-4 mr-2" />
											Editar
										</DropdownMenuItem>
										<DropdownMenuItem onClick={handleDelete} className="text-red-600">
											<Trash2 className="h-4 w-4 mr-2" />
											Excluir
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>

							{brandName && (
								<div className="mb-2">
									<p className="text-xs text-gray-600">{brandName}</p>
									<Badge variant="secondary" className="text-xs">
										{productUnit}
									</Badge>
								</div>
							)}

							{!brandName && (
								<div className="mb-2">
									<Badge variant="secondary" className="text-xs">
										{productUnit}
									</Badge>
								</div>
							)}
						</div>

						<div className="mt-auto">
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={() => (window.location.href = `/produtos/${product.id}`)}
							>
								<BarChart3 className="h-4 w-4 mr-2" />
								Ver Detalhes
							</Button>
						</div>
					</CardContent>
				</Card>
			</TooltipProvider>
		)
	},
	(prevProps, nextProps) => {
		// Comparação customizada para otimizar re-renders
		return (
			prevProps.product.id === nextProps.product.id &&
			prevProps.product.name === nextProps.product.name &&
			prevProps.product.brand?.name === nextProps.product.brand?.name &&
			prevProps.product.unit === nextProps.product.unit &&
			prevProps.product.updatedAt === nextProps.product.updatedAt
		)
	},
)

ProductCardMemo.displayName = "ProductCardMemo"

// MarketCard memoizado
interface MarketCardMemoProps {
	market: any
	onDelete: (market: any) => void
	onEdit?: (market: any) => void
}

export const MarketCardMemo = memo<MarketCardMemoProps>(
	({ market, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(market)
		}, [market, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(market)
		}, [market, onEdit])

		const marketName = useMemo(() => {
			return market.name || "Mercado sem nome"
		}, [market.name])

		const marketLocation = useMemo(() => {
			return market.location || null
		}, [market.location])

		return (
			<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg font-medium line-clamp-2">{marketName}</CardTitle>
							{marketLocation && <p className="text-sm text-gray-600 mt-1">{marketLocation}</p>}
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleEdit}>
									<Edit className="h-4 w-4 mr-2" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDelete} className="text-red-600">
									<Trash2 className="h-4 w-4 mr-2" />
									Excluir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => (window.location.href = `/mercados/${market.id}`)}
					>
						<BarChart3 className="h-4 w-4 mr-2" />
						Ver Detalhes
					</Button>
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.market.id === nextProps.market.id &&
			prevProps.market.name === nextProps.market.name &&
			prevProps.market.location === nextProps.market.location &&
			prevProps.market.updatedAt === nextProps.market.updatedAt
		)
	},
)

MarketCardMemo.displayName = "MarketCardMemo"

// CategoryCard memoizado
interface CategoryCardMemoProps {
	category: any
	onDelete: (category: any) => void
	onEdit?: (category: any) => void
}

export const CategoryCardMemo = memo<CategoryCardMemoProps>(
	({ category, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(category)
		}, [category, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(category)
		}, [category, onEdit])

		const categoryName = useMemo(() => {
			return category.name || "Categoria sem nome"
		}, [category.name])

		const categoryIcon = useMemo(() => {
			return category.icon || "📦"
		}, [category.icon])

		return (
			<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg font-medium flex items-center gap-2">
								<span className="text-2xl">{categoryIcon}</span>
								<span className="line-clamp-2">{categoryName}</span>
							</CardTitle>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleEdit}>
									<Edit className="h-4 w-4 mr-2" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDelete} className="text-red-600">
									<Trash2 className="h-4 w-4 mr-2" />
									Excluir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => (window.location.href = `/categorias/${category.id}`)}
					>
						<BarChart3 className="h-4 w-4 mr-2" />
						Ver Detalhes
					</Button>
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.category.id === nextProps.category.id &&
			prevProps.category.name === nextProps.category.name &&
			prevProps.category.icon === nextProps.category.icon &&
			prevProps.category.updatedAt === nextProps.category.updatedAt
		)
	},
)

CategoryCardMemo.displayName = "CategoryCardMemo"

// BrandCard memoizado
interface BrandCardMemoProps {
	brand: any
	onDelete: (brand: any) => void
	onEdit?: (brand: any) => void
}

export const BrandCardMemo = memo<BrandCardMemoProps>(
	({ brand, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(brand)
		}, [brand, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(brand)
		}, [brand, onEdit])

		const brandName = useMemo(() => {
			return brand.name || "Marca sem nome"
		}, [brand.name])

		return (
			<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg font-medium line-clamp-2">{brandName}</CardTitle>
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={handleEdit}>
									<Edit className="h-4 w-4 mr-2" />
									Editar
								</DropdownMenuItem>
								<DropdownMenuItem onClick={handleDelete} className="text-red-600">
									<Trash2 className="h-4 w-4 mr-2" />
									Excluir
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</CardHeader>

				<CardContent className="pt-0">
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => (window.location.href = `/marcas/${brand.id}`)}
					>
						<BarChart3 className="h-4 w-4 mr-2" />
						Ver Detalhes
					</Button>
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.brand.id === nextProps.brand.id &&
			prevProps.brand.name === nextProps.brand.name &&
			prevProps.brand.updatedAt === nextProps.brand.updatedAt
		)
	},
)

BrandCardMemo.displayName = "BrandCardMemo"
