"use client"

import {
	BarChart3,
	Barcode,
	DollarSign,
	Edit,
	ImageIcon,
	MoreHorizontal,
	Package,
	Receipt,
	ShoppingCart,
	Store,
	Trash2,
} from "lucide-react"
import Image from "next/image"
import { memo, useCallback, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

		// URL da imagem baseada no código de barras
		const imageUrl = useMemo(() => {
			if (product.barcode) {
				return `https://cdn-cosmos.bluesoft.com.br/products/${product.barcode}`
			}
			return null
		}, [product.barcode])

		// Estado para controlar o carregamento da imagem
		const [imageError, setImageError] = useState(false)

		// Blur placeholder para melhor UX durante carregamento
		const blurDataURL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="

		return (
			<TooltipProvider>
				<Card className="h-full flex flex-col hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
					<CardContent className="flex-1 flex flex-col p-0">
						{/* Layout horizontal com imagem e informações */}
						<div className="flex h-full p-4">
							{/* Área da imagem */}
							<div className="w-24 h-24 flex-shrink-0 relative rounded-lg overflow-hidden">
								{imageUrl && !imageError ? (
									<Image
										src={imageUrl}
										alt={productDisplayName}
										fill
										className="object-cover object-center rounded-lg"
										sizes="96px"
										quality={90}
										placeholder="blur"
										blurDataURL={blurDataURL}
										loading="lazy"
										onError={() => setImageError(true)}
									/>
								) : (
									<div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center">
										<ImageIcon className="h-8 w-8 text-gray-400" />
									</div>
								)}
							</div>

							{/* Área das informações */}
							<div className="flex-1 flex flex-col pl-4">
								{/* Header com título e menu */}
								<div className="flex items-start justify-between mb-3">
									<Tooltip>
										<TooltipTrigger asChild>
											<h3 className="font-semibold text-base line-clamp-2 flex-1 mr-2 text-gray-900 dark:text-gray-100">
												{productDisplayName}
											</h3>
										</TooltipTrigger>
										<TooltipContent>
											<p>{productDisplayName}</p>
										</TooltipContent>
									</Tooltip>

									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="sm"
												className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
											>
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

								{/* Informações do produto */}
								<div className="flex-1 space-y-2">
									{/* Marca */}
									{brandName && (
										<div className="flex items-center gap-2">
											<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Marca:</span>
											<Badge variant="secondary" className="text-xs">
												{brandName}
											</Badge>
										</div>
									)}

									{/* Categoria */}
									{product.category?.name && (
										<div className="flex items-center gap-2">
											<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Categoria:</span>
											<Badge variant="outline" className="text-xs">
												{product.category.icon} {product.category.name}
											</Badge>
										</div>
									)}

									{/* Tamanho e Unidade */}
									<div className="flex items-center gap-2">
										<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Tamanho:</span>
										<div className="flex gap-1">
											{product.packageSize && (
												<Badge variant="default" className="text-xs bg-blue-600">
													📦 {product.packageSize}
												</Badge>
											)}
											<Badge variant="secondary" className="text-xs">
												{productUnit}
											</Badge>
										</div>
									</div>

									{/* Código de barras */}
									{product.barcode && (
										<div className="flex items-center gap-2">
											<span className="text-xs font-medium text-gray-500 dark:text-gray-400">Código:</span>
											<Badge variant="outline" className="text-xs flex items-center gap-1">
												<Barcode className="h-3 w-3" />
												{product.barcode}
											</Badge>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Botão de ação - agora ocupa toda a largura */}
						<div className="px-4 pb-4">
							<Button
								variant="outline"
								size="sm"
								className="w-full"
								onClick={() => {
									window.location.href = `/produtos/${product.id}`
								}}
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
			prevProps.product.barcode === nextProps.product.barcode &&
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
						onClick={() => {
							window.location.href = `/mercados/${market.id}`
						}}
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
						onClick={() => {
							window.location.href = `/categorias/${category.id}`
						}}
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
						onClick={() => {
							window.location.href = `/marcas/${brand.id}`
						}}
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

// PurchaseCard memoizado
interface PurchaseCardMemoProps {
	purchase: any
	onDelete: (purchase: any) => void
	onEdit?: (purchase: any) => void
}

export const PurchaseCardMemo = memo<PurchaseCardMemoProps>(
	({ purchase, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(purchase)
		}, [purchase, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(purchase)
		}, [purchase, onEdit])

		const purchaseDate = useMemo(() => {
			return new Date(purchase.purchaseDate).toLocaleDateString()
		}, [purchase.purchaseDate])

		const totalAmount = useMemo(() => {
			return purchase.totalAmount?.toFixed(2) || "0.00"
		}, [purchase.totalAmount])

		const itemCount = useMemo(() => {
			return purchase.items?.length || 0
		}, [purchase.items?.length])

		return (
			<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg font-medium line-clamp-2">{purchase.market?.name || "Mercado"}</CardTitle>
							<p className="text-sm text-gray-600 mt-1">{purchaseDate}</p>
							<p className="text-sm text-gray-500">{itemCount} itens</p>
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
					<div className="text-right mb-3">
						<p className="font-bold text-lg">R$ {totalAmount}</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="w-full"
						onClick={() => {
							window.location.href = `/compras/${purchase.id}`
						}}
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
			prevProps.purchase.id === nextProps.purchase.id &&
			prevProps.purchase.totalAmount === nextProps.purchase.totalAmount &&
			prevProps.purchase.purchaseDate === nextProps.purchase.purchaseDate &&
			prevProps.purchase.items?.length === nextProps.purchase.items?.length &&
			prevProps.purchase.updatedAt === nextProps.purchase.updatedAt
		)
	},
)

PurchaseCardMemo.displayName = "PurchaseCardMemo"

// DashboardCardMemo memoizado
interface DashboardCardMemoProps {
	cardId: string
	stats: any
	onClick?: () => void
}

export const DashboardCardMemo = memo<DashboardCardMemoProps>(
	({ cardId, stats, onClick }) => {
		const cardContent = useMemo(() => {
			switch (cardId) {
				case "total-purchases":
					return {
						title: "Total de Compras",
						value: stats?.totalPurchases || 0,
						icon: "ShoppingCart",
						format: "number",
					}
				case "total-spent":
					return {
						title: "Total Gasto",
						value: stats?.totalSpent || 0,
						icon: "DollarSign",
						format: "currency",
					}
				case "total-products":
					return {
						title: "Produtos Cadastrados",
						value: stats?.totalProducts || 0,
						icon: "Package",
						format: "number",
					}
				case "total-markets":
					return {
						title: "Mercados Cadastrados",
						value: stats?.totalMarkets || 0,
						icon: "Store",
						format: "number",
					}
				case "price-records":
					return {
						title: "Preços Registrados",
						value: stats?.priceRecords?.totalRecords || 0,
						icon: "Receipt",
						format: "number",
						subtitle:
							stats?.priceRecords?.averagePrice > 0
								? `Média: R$ ${stats.priceRecords.averagePrice.toFixed(2)}`
								: undefined,
					}
				default:
					return null
			}
		}, [cardId, stats])

		if (!cardContent) return null

		const formatValue = (value: number, format: string) => {
			switch (format) {
				case "currency":
					return `R$ ${value.toFixed(2)}`
				default:
					return value.toString()
			}
		}

		const CardComponent = onClick ? "button" : "div"
		const cardProps = onClick ? { onClick } : {}

		return (
			<CardComponent
				{...cardProps}
				className={`shadow-sm hover:shadow-lg transition-shadow ${onClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
			>
				<Card className="h-full">
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-xs md:text-sm font-medium">{cardContent.title}</CardTitle>
						{cardContent.icon === "ShoppingCart" && <ShoppingCart className="h-4 w-4 text-muted-foreground" />}
						{cardContent.icon === "DollarSign" && <DollarSign className="h-4 w-4 text-muted-foreground" />}
						{cardContent.icon === "Package" && <Package className="h-4 w-4 text-muted-foreground" />}
						{cardContent.icon === "Store" && <Store className="h-4 w-4 text-muted-foreground" />}
						{cardContent.icon === "Receipt" && <Receipt className="h-4 w-4 text-muted-foreground" />}
					</CardHeader>
					<CardContent>
						<div className="text-xl md:text-2xl font-bold">{formatValue(cardContent.value, cardContent.format)}</div>
						{cardContent.subtitle && <div className="text-xs text-muted-foreground mt-1">{cardContent.subtitle}</div>}
					</CardContent>
				</Card>
			</CardComponent>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.cardId === nextProps.cardId &&
			prevProps.stats?.totalPurchases === nextProps.stats?.totalPurchases &&
			prevProps.stats?.totalSpent === nextProps.stats?.totalSpent &&
			prevProps.stats?.totalProducts === nextProps.stats?.totalProducts &&
			prevProps.stats?.totalMarkets === nextProps.stats?.totalMarkets &&
			prevProps.stats?.priceRecords?.totalRecords === nextProps.stats?.priceRecords?.totalRecords &&
			prevProps.stats?.priceRecords?.averagePrice === nextProps.stats?.priceRecords?.averagePrice
		)
	},
)

DashboardCardMemo.displayName = "DashboardCardMemo"

// DashboardStatsCardMemo memoizado
interface DashboardStatsCardMemoProps {
	title: string
	description: string
	icon: React.ReactNode
	children: React.ReactNode
}

export const DashboardStatsCardMemo = memo<DashboardStatsCardMemoProps>(
	({ title, description, icon, children }) => {
		return (
			<Card className="shadow-sm hover:shadow-lg transition-shadow">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{icon}
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return prevProps.title === nextProps.title && prevProps.description === nextProps.description
	},
)

DashboardStatsCardMemo.displayName = "DashboardStatsCardMemo"

// ShoppingListCard memoizado
interface ShoppingListCardMemoProps {
	shoppingList: any
	onDelete: (shoppingList: any) => void
	onEdit?: (shoppingList: any) => void
}

export const ShoppingListCardMemo = memo<ShoppingListCardMemoProps>(
	({ shoppingList, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(shoppingList)
		}, [shoppingList, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(shoppingList)
		}, [shoppingList, onEdit])

		const listName = useMemo(() => {
			return shoppingList.name || "Lista sem nome"
		}, [shoppingList.name])

		const itemCount = useMemo(() => {
			return shoppingList.items?.length || 0
		}, [shoppingList.items?.length])

		const createdAt = useMemo(() => {
			return new Date(shoppingList.createdAt).toLocaleDateString()
		}, [shoppingList.createdAt])

		return (
			<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg font-medium line-clamp-2">{listName}</CardTitle>
							<p className="text-sm text-gray-600 mt-1">{createdAt}</p>
							<p className="text-sm text-gray-500">{itemCount} itens</p>
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
						onClick={() => {
							window.location.href = `/lista/${shoppingList.id}`
						}}
					>
						<BarChart3 className="h-4 w-4 mr-2" />
						Ver Lista
					</Button>
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.shoppingList.id === nextProps.shoppingList.id &&
			prevProps.shoppingList.name === nextProps.shoppingList.name &&
			prevProps.shoppingList.items?.length === nextProps.shoppingList.items?.length &&
			prevProps.shoppingList.createdAt === nextProps.shoppingList.createdAt &&
			prevProps.shoppingList.updatedAt === nextProps.shoppingList.updatedAt
		)
	},
)

ShoppingListCardMemo.displayName = "ShoppingListCardMemo"

// RecipeCard memoizado
interface RecipeCardMemoProps {
	recipe: any
	onDelete: (recipe: any) => void
	onEdit?: (recipe: any) => void
}

export const RecipeCardMemo = memo<RecipeCardMemoProps>(
	({ recipe, onDelete, onEdit }) => {
		const handleDelete = useCallback(() => {
			onDelete(recipe)
		}, [recipe, onDelete])

		const handleEdit = useCallback(() => {
			onEdit?.(recipe)
		}, [recipe, onEdit])

		const recipeName = useMemo(() => {
			return recipe.name || "Receita sem nome"
		}, [recipe.name])

		const ingredientCount = useMemo(() => {
			return recipe.ingredients?.length || 0
		}, [recipe.ingredients?.length])

		const prepTime = useMemo(() => {
			return recipe.prepTime || "N/A"
		}, [recipe.prepTime])

		return (
			<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
				<CardHeader className="pb-3">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<CardTitle className="text-lg font-medium line-clamp-2">{recipeName}</CardTitle>
							<p className="text-sm text-gray-600 mt-1">{ingredientCount} ingredientes</p>
							<p className="text-sm text-gray-500">Tempo: {prepTime}min</p>
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
						onClick={() => {
							window.location.href = `/receitas/${recipe.id}`
						}}
					>
						<BarChart3 className="h-4 w-4 mr-2" />
						Ver Receita
					</Button>
				</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return (
			prevProps.recipe.id === nextProps.recipe.id &&
			prevProps.recipe.name === nextProps.recipe.name &&
			prevProps.recipe.ingredients?.length === nextProps.recipe.ingredients?.length &&
			prevProps.recipe.prepTime === nextProps.recipe.prepTime &&
			prevProps.recipe.updatedAt === nextProps.recipe.updatedAt
		)
	},
)

RecipeCardMemo.displayName = "RecipeCardMemo"
