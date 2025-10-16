"use client"

import { motion } from "framer-motion"
import {
	ArrowLeft,
	BarChart3,
	Calendar,
	DollarSign,
	Edit,
	Package,
	ShoppingCart,
	Store,
	Tag,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDeleteCategoryMutation } from "@/hooks"

interface CategoryDetails {
	id: string
	name: string
	icon?: string
	color?: string
	isFood?: boolean
	products: {
		id: string
		name: string
		unit: string
		brand?: { name: string }
		_count?: {
			purchaseItems: number
		}
	}[]
	_count: {
		products: number
	}
}

interface CategoryStats {
	totalPurchases: number
	totalSpent: number
	totalQuantity: number
	avgPrice: number
	topProducts: Array<{
		productId: string
		productName: string
		totalQuantity: number
		totalSpent: number
		purchaseCount: number
		avgPrice: number
		unit: string
	}>
	marketComparison: Array<{
		marketId: string
		marketName: string
		totalSpent: number
		purchaseCount: number
		avgPrice: number
	}>
	monthlyTrend: Array<{
		month: string
		spent: number
		purchases: number
	}>
}

export default function CategoriaDetalhesPage() {
	const params = useParams()
	const router = useRouter()
	const categoryId = params.id as string
	const deleteCategoryMutation = useDeleteCategoryMutation()

	const [category, setCategory] = useState<CategoryDetails | null>(null)
	const [loading, setLoading] = useState(true)
	const [stats, setStats] = useState<CategoryStats | null>(null)
	const [statsLoading, setStatsLoading] = useState(true)

	const fetchCategoryDetails = async () => {
		try {
			const response = await fetch(`/api/categories/${categoryId}`)

			if (!response.ok) {
				toast.error("Categoria não encontrada")
				router.push("/categorias")
				return
			}

			const data = await response.json()
			setCategory(data)
		} catch (error) {
			console.error("Erro ao buscar detalhes da categoria:", error)
			toast.error("Erro ao carregar detalhes da categoria")
			router.push("/categorias")
		} finally {
			setLoading(false)
		}
	}

	// Buscar estatísticas da categoria
	useEffect(() => {
		const fetchStats = async () => {
			try {
				const response = await fetch(`/api/categories/${categoryId}/stats`)
				if (response.ok) {
					const data = await response.json()
					setStats(data)
				}
			} catch (error) {
				console.error("Erro ao buscar estatísticas:", error)
			} finally {
				setStatsLoading(false)
			}
		}

		if (categoryId) {
			fetchStats()
		}
	}, [categoryId])

	useEffect(() => {
		if (categoryId) {
			fetchCategoryDetails()
		}
	}, [categoryId])

	const deleteCategory = async () => {
		if (!categoryId) return

		if (!confirm("Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.")) {
			return
		}

		try {
			await deleteCategoryMutation.mutateAsync(categoryId)
			toast.success("Categoria excluída com sucesso!")
			setTimeout(() => {
				router.push("/categorias")
			}, 100)
		} catch (error) {
			console.error("Erro ao excluir categoria:", error)
			toast.error("Erro ao excluir categoria")
		}
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-9 w-20" />
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded" />
							<div>
								<Skeleton className="h-8 w-64 mb-2" />
								<Skeleton className="h-6 w-40" />
							</div>
						</div>
					</div>
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-24" />
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardHeader className="pb-3">
								<Skeleton className="h-4 w-24" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-8 w-20" />
							</CardContent>
						</Card>
					))}
				</div>

				<Skeleton className="h-10 w-full" />

				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<Card key={i}>
									<CardHeader>
										<Skeleton className="h-6 w-32" />
										<Skeleton className="h-4 w-24 mt-2" />
									</CardHeader>
									<CardContent>
										<Skeleton className="h-8 w-20" />
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!category) {
		return (
			<div className="text-center py-12">
				<Tag className="h-16 w-16 mx-auto mb-4 text-gray-400" />
				<h2 className="text-2xl font-semibold mb-2">Categoria não encontrada</h2>
				<p className="text-gray-600 mb-4">Esta categoria não existe ou foi excluída.</p>
				<Link href="/categorias">
					<Button>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar para Categorias
					</Button>
				</Link>
			</div>
		)
	}

	const hasStats = stats && stats.totalPurchases > 0

	return (
		<div className="space-y-6">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col md:flex-row md:items-center gap-4"
			>
				<Link href="/categorias">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<div className="text-5xl">{category.icon || "📦"}</div>
						<div>
							<h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
							<p className="text-gray-600 mt-1">
								{category._count.products}{" "}
								{category._count.products === 1 ? "produto cadastrado" : "produtos cadastrados"}
							</p>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Link href={`/categorias/${categoryId}/editar`}>
						<Button variant="outline" size="sm">
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</Button>
					</Link>
					<Button
						variant="destructive"
						size="sm"
						onClick={deleteCategory}
						disabled={(category._count?.products || 0) > 0 || deleteCategoryMutation.isPending}
						title={
							(category._count?.products || 0) > 0
								? "Não é possível excluir uma categoria com produtos cadastrados"
								: "Excluir categoria"
						}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Excluir
					</Button>
				</div>
			</motion.div>

			{/* Cards de Estatísticas */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.1 }}
				className="grid grid-cols-2 md:grid-cols-4 gap-4"
			>
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">Produtos</CardTitle>
							<Package className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{category._count?.products || 0}</div>
						<p className="text-xs text-muted-foreground mt-1">cadastrados</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">Compras</CardTitle>
							<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats?.totalPurchases || 0}</div>
						<p className="text-xs text-muted-foreground mt-1">realizadas</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
							<DollarSign className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">R$ {(stats?.totalSpent || 0).toFixed(2)}</div>
						<p className="text-xs text-muted-foreground mt-1">no histórico</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-sm font-medium">Preço Médio</CardTitle>
							<BarChart3 className="h-4 w-4 text-muted-foreground" />
						</div>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">R$ {(stats?.avgPrice || 0).toFixed(2)}</div>
						<p className="text-xs text-muted-foreground mt-1">por compra</p>
					</CardContent>
				</Card>
			</motion.div>

			{/* Tabs */}
			<Tabs defaultValue="products" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="products">
						<Package className="h-4 w-4 mr-2" />
						Produtos
					</TabsTrigger>
					<TabsTrigger value="stats">
						<BarChart3 className="h-4 w-4 mr-2" />
						Estatísticas
					</TabsTrigger>
					<TabsTrigger value="markets">
						<Store className="h-4 w-4 mr-2" />
						Mercados
					</TabsTrigger>
					<TabsTrigger value="insights">
						<TrendingUp className="h-4 w-4 mr-2" />
						Insights
					</TabsTrigger>
				</TabsList>

				{/* Tab de Produtos */}
				<TabsContent value="products" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								Produtos da Categoria
							</CardTitle>
							<CardDescription>Todos os produtos associados a {category.name}</CardDescription>
						</CardHeader>
						<CardContent>
							{category.products.length === 0 ? (
								<Empty className="border border-dashed py-12">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Package className="h-6 w-6" />
										</EmptyMedia>
										<EmptyTitle>Nenhum produto nesta categoria</EmptyTitle>
										<EmptyDescription>
											Comece adicionando produtos a esta categoria na página de produtos.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Link href="/produtos/novo">
											<Button>
												<Package className="h-4 w-4 mr-2" />
												Adicionar Produto
											</Button>
										</Link>
									</EmptyContent>
								</Empty>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{category.products.map((product) => (
										<motion.div
											key={product.id}
											initial={{ opacity: 0, scale: 0.95 }}
											animate={{ opacity: 1, scale: 1 }}
											whileHover={{ scale: 1.02 }}
											transition={{ duration: 0.2 }}
										>
											<Card className="hover:shadow-md transition-shadow h-full">
												<CardHeader className="pb-3">
													<CardTitle className="text-lg flex items-center gap-2">
														<Package className="h-5 w-5" />
														{product.name}
													</CardTitle>
													<CardDescription className="space-y-1">
														{product.brand && (
															<div className="flex items-center gap-1 text-sm">
																<Tag className="h-3 w-3" />
																<span>{product.brand.name}</span>
															</div>
														)}
														<div className="text-sm">Unidade: {product.unit}</div>
													</CardDescription>
												</CardHeader>
												<CardContent className="pt-0">
													<Link href={`/produtos/${product.id}`}>
														<Button variant="outline" size="sm" className="w-full">
															<BarChart3 className="h-4 w-4 mr-2" />
															Ver Detalhes
														</Button>
													</Link>
												</CardContent>
											</Card>
										</motion.div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab de Estatísticas */}
				<TabsContent value="stats" className="space-y-6">
					{!hasStats ? (
						<Card>
							<CardContent className="py-12">
								<Empty className="border border-dashed">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<BarChart3 className="h-6 w-6" />
										</EmptyMedia>
										<EmptyTitle>Sem estatísticas disponíveis</EmptyTitle>
										<EmptyDescription>
											Realize compras com produtos desta categoria para ver estatísticas detalhadas.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</CardContent>
						</Card>
					) : (
						<>
							{/* Produtos Mais Comprados desta Categoria */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ShoppingCart className="h-5 w-5" />
										Produtos Mais Comprados
									</CardTitle>
									<CardDescription>Top produtos desta categoria por quantidade</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{stats.topProducts.slice(0, 5).map((product, index) => (
											<div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
												<div className="flex items-center gap-3">
													<div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center">
														{index + 1}
													</div>
													<div>
														<div className="font-medium">{product.productName}</div>
														<div className="text-sm text-muted-foreground">
															{product.totalQuantity.toFixed(1)} {product.unit}
														</div>
													</div>
												</div>
												<div className="text-right">
													<div className="font-medium">R$ {product.totalSpent.toFixed(2)}</div>
													<div className="text-sm text-muted-foreground">{product.purchaseCount} compras</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>

							{/* Tendência Mensal */}
							{stats.monthlyTrend && stats.monthlyTrend.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle className="flex items-center gap-2">
											<Calendar className="h-5 w-5" />
											Tendência Mensal
										</CardTitle>
										<CardDescription>Gastos com produtos de {category.name} nos últimos meses</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{stats.monthlyTrend.map((month, index) => {
												const prevMonth = index > 0 ? stats.monthlyTrend[index - 1] : null

												// Calcular mudança percentual com segurança
												let change = 0
												let showChange = false

												if (prevMonth) {
													if (prevMonth.spent === 0 && month.spent > 0) {
														showChange = false
													} else if (prevMonth.spent > 0) {
														change = ((month.spent - prevMonth.spent) / prevMonth.spent) * 100
														showChange = true
													}
												}

												const isIncrease = change > 0

												return (
													<div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
														<div className="flex items-center gap-3">
															<Calendar className="h-5 w-5 text-muted-foreground" />
															<div>
																<div className="font-medium">{month.month}</div>
																<div className="text-sm text-muted-foreground">{month.purchases} compras</div>
															</div>
														</div>
														<div className="text-right">
															<div className="font-medium">R$ {month.spent.toFixed(2)}</div>
															{prevMonth && showChange && (
																<div
																	className={`text-xs flex items-center gap-1 justify-end ${isIncrease ? "text-red-600" : change < 0 ? "text-green-600" : "text-gray-600"
																		}`}
																>
																	{isIncrease ? (
																		<TrendingUp className="h-3 w-3" />
																	) : change < 0 ? (
																		<TrendingDown className="h-3 w-3" />
																	) : null}
																	{change !== 0 ? `${Math.abs(change).toFixed(1)}%` : "0%"}
																</div>
															)}
														</div>
													</div>
												)
											})}
										</div>
									</CardContent>
								</Card>
							)}
						</>
					)}
				</TabsContent>

				{/* Tab de Mercados */}
				<TabsContent value="markets" className="space-y-6">
					{!hasStats || !stats.marketComparison || stats.marketComparison.length === 0 ? (
						<Card>
							<CardContent className="py-12">
								<Empty className="border border-dashed">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<Store className="h-6 w-6" />
										</EmptyMedia>
										<EmptyTitle>Sem dados de mercados</EmptyTitle>
										<EmptyDescription>
											Realize compras com produtos desta categoria em diferentes mercados para ver comparações.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Store className="h-5 w-5" />
									Comparação de Mercados
								</CardTitle>
								<CardDescription>Onde você mais compra produtos de {category.name}</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{stats.marketComparison.map((market, index) => {
										const cheapest = stats.marketComparison.reduce((min, curr) =>
											curr.avgPrice < min.avgPrice ? curr : min,
										)
										const isCheapest = market.marketId === cheapest.marketId

										return (
											<div
												key={market.marketId}
												className={`flex items-center justify-between p-4 border rounded-lg ${isCheapest ? "bg-green-50 dark:bg-green-950 border-green-200" : ""
													}`}
											>
												<div className="flex items-center gap-3">
													<div
														className={`w-8 h-8 rounded-full text-sm flex items-center justify-center ${isCheapest
																? "bg-green-600 text-white"
																: "bg-muted text-muted-foreground"
															}`}
													>
														{index + 1}
													</div>
													<div>
														<div className="font-medium flex items-center gap-2">
															{market.marketName}
															{isCheapest && (
																<Badge variant="default" className="bg-green-600">
																	Mais Barato
																</Badge>
															)}
														</div>
														<div className="text-sm text-muted-foreground">
															{market.purchaseCount} compras • R$ {market.totalSpent.toFixed(2)} total
														</div>
													</div>
												</div>
												<div className="text-right">
													<div className="text-lg font-bold text-green-600">R$ {market.avgPrice.toFixed(2)}</div>
													<div className="text-xs text-muted-foreground">preço médio</div>
												</div>
											</div>
										)
									})}
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Tab de Insights */}
				<TabsContent value="insights" className="space-y-6">
					{!hasStats ? (
						<Card>
							<CardContent className="py-12">
								<Empty className="border border-dashed">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<TrendingUp className="h-6 w-6" />
										</EmptyMedia>
										<EmptyTitle>Sem insights disponíveis</EmptyTitle>
										<EmptyDescription>
											Continue comprando produtos desta categoria para receber insights personalizados.
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							</CardContent>
						</Card>
					) : (
						<>
							{/* Resumo de Insights */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{/* Economia Potencial */}
								{stats.marketComparison && stats.marketComparison.length > 1 && (
									<Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
										<CardHeader>
											<CardTitle className="text-base flex items-center gap-2">
												<DollarSign className="h-4 w-4 text-green-600" />
												Economia Potencial
											</CardTitle>
										</CardHeader>
										<CardContent>
											{(() => {
												const cheapest = stats.marketComparison.reduce((min, curr) =>
													curr.avgPrice < min.avgPrice ? curr : min,
												)
												const expensive = stats.marketComparison.reduce((max, curr) =>
													curr.avgPrice > max.avgPrice ? curr : max,
												)
												const savings = expensive.avgPrice - cheapest.avgPrice
												const savingsPercent = ((savings / expensive.avgPrice) * 100).toFixed(1)

												return (
													<div className="space-y-2">
														<p className="text-sm text-muted-foreground">
															Comprando no <span className="font-semibold">{cheapest.marketName}</span> ao invés do{" "}
															<span className="font-semibold">{expensive.marketName}</span>:
														</p>
														<div className="flex items-baseline gap-2">
															<span className="text-3xl font-bold text-green-600">
																R$ {savings.toFixed(2)}
															</span>
															<span className="text-sm text-muted-foreground">de economia por compra</span>
														</div>
														<Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
															{savingsPercent}% mais barato
														</Badge>
													</div>
												)
											})()}
										</CardContent>
									</Card>
								)}

								{/* Participação no Orçamento */}
								{stats.totalSpent > 0 && (
									<Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
										<CardHeader>
											<CardTitle className="text-base flex items-center gap-2">
												<ShoppingCart className="h-4 w-4 text-blue-600" />
												Participação no Orçamento
											</CardTitle>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												<div className="flex items-baseline gap-2">
													<span className="text-3xl font-bold text-blue-600">
														R$ {stats.totalSpent.toFixed(2)}
													</span>
													<span className="text-sm text-muted-foreground">gastos totais</span>
												</div>
												<p className="text-sm text-muted-foreground">
													Média de <span className="font-semibold">R$ {stats.avgPrice.toFixed(2)}</span> por compra
												</p>
												<Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
													{stats.totalQuantity.toFixed(0)} itens comprados
												</Badge>
											</div>
										</CardContent>
									</Card>
								)}
							</div>

							{/* Recomendações */}
							<Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<TrendingUp className="h-5 w-5 text-purple-600" />
										Recomendações
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{stats.marketComparison && stats.marketComparison.length > 0 && (
											<div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
												<div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
													💡
												</div>
												<div>
													<p className="font-semibold mb-1">Melhor mercado para {category.name}</p>
													<p className="text-sm text-muted-foreground">
														Compre no{" "}
														<span className="font-semibold text-green-600">
															{
																stats.marketComparison.reduce((min, curr) =>
																	curr.avgPrice < min.avgPrice ? curr : min,
																).marketName
															}
														</span>{" "}
														para economizar em produtos desta categoria.
													</p>
												</div>
											</div>
										)}

										{stats.topProducts && stats.topProducts.length > 0 && (
											<div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
												<div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
													📊
												</div>
												<div>
													<p className="font-semibold mb-1">Produto favorito</p>
													<p className="text-sm text-muted-foreground">
														<span className="font-semibold">{stats.topProducts[0].productName}</span> é o produto de{" "}
														{category.name} que você mais compra ({stats.topProducts[0].purchaseCount} vezes).
													</p>
												</div>
											</div>
										)}

										{stats.monthlyTrend && stats.monthlyTrend.length >= 2 && (
											<div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
												<div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0">
													📈
												</div>
												<div>
													<p className="font-semibold mb-1">Tendência de gastos</p>
													<p className="text-sm text-muted-foreground">
														{(() => {
															const lastMonth = stats.monthlyTrend[stats.monthlyTrend.length - 1]
															const prevMonth = stats.monthlyTrend[stats.monthlyTrend.length - 2]

															// Verificar se há dados suficientes para comparação
															if (prevMonth.spent === 0 && lastMonth.spent === 0) {
																return <>Sem dados suficientes para análise de tendência.</>
															}

															if (prevMonth.spent === 0 && lastMonth.spent > 0) {
																return (
																	<>
																		Você começou a comprar produtos de {category.name} este mês! Total gasto:{" "}
																		<span className="font-semibold text-blue-600">
																			R$ {lastMonth.spent.toFixed(2)}
																		</span>
																	</>
																)
															}

															if (lastMonth.spent === 0 && prevMonth.spent > 0) {
																return (
																	<>
																		Você parou de comprar produtos de {category.name} este mês.{" "}
																		Mês anterior: R$ {prevMonth.spent.toFixed(2)}
																	</>
																)
															}

															const change = ((lastMonth.spent - prevMonth.spent) / prevMonth.spent) * 100
															const isIncrease = change > 0

															return isIncrease ? (
																<>
																	Seus gastos com {category.name} aumentaram{" "}
																	<span className="font-semibold text-red-600">
																		{Math.abs(change).toFixed(1)}%
																	</span>{" "}
																	no último mês.
																</>
															) : change < 0 ? (
																<>
																	Você economizou{" "}
																	<span className="font-semibold text-green-600">
																		{Math.abs(change).toFixed(1)}%
																	</span>{" "}
																	em {category.name} no último mês!
																</>
															) : (
																<>
																	Seus gastos com {category.name} se mantiveram estáveis no último mês.
																</>
															)
														})()}
													</p>
												</div>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</>
					)}
				</TabsContent>
			</Tabs>
		</div>
	)
}
