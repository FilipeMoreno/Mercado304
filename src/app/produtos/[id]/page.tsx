"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	AlertTriangle,
	ArrowLeft,
	BarChart3,
	Calendar,
	CheckCircle,
	ChevronLeft,
	ChevronRight,
	DollarSign,
	Edit,
	Minus,
	MoreVertical,
	Package,
	ShoppingCart,
	Sparkles,
	Store,
	Trash2,
	TrendingDown,
	TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"
import { AnvisaNutritionalTable } from "@/components/AnvisaNutritionalTable"
import { AllergenIcons } from "@/components/allergen-icons"
import { AnvisaWarnings } from "@/components/anvisa-warnings"
import { BestDayToBuyCard } from "@/components/best-day-to-buy-card"
import { NutritionAiAnalysis } from "@/components/nutrition-ai-analysis"
import { ProductDetailsSkeleton } from "@/components/skeletons/product-details-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { NutritionalInfo, Product } from "@/types"

export default function ProdutoDetalhesPage() {
	const params = useParams()
	const router = useRouter()
	const productId = params.id as string

	const [product, setProduct] = useState<Product | null>(null)
	const [loading, setLoading] = useState(true)
	const [stats, setStats] = useState<any>(null)
	const [priceHistory, setPriceHistory] = useState<any[]>([])
	const [marketComparison, setMarketComparison] = useState<any[]>([])
	const [recentPurchases, setRecentPurchases] = useState<any[]>([])
	const [stockAlerts, setStockAlerts] = useState<any>(null)
	const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo | null>(null)
	const [nutritionalViewMode, setNutritionalViewMode] = useState<"per100" | "perServing">("per100")
	const [purchasesPage, setPurchasesPage] = useState(1)
	const purchasesPerPage = 5

	// Helper para calcular valores por porção
	const getDisplayValue = (value: number | null | undefined, unit: string = "") => {
		if (!value || !nutritionalInfo?.servingSize) return null

		if (nutritionalViewMode === "per100") {
			return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}${unit}`
		} else {
			// Calcular valor por porção
			const servingMatch = nutritionalInfo.servingSize.match(/(\d+[.,]?\d*)/)
			if (!servingMatch)
				return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}${unit}`

			const servingSize = parseFloat(servingMatch[1].replace(",", "."))
			const perServingValue = (value * servingSize) / 100

			return `${perServingValue.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}${unit}`
		}
	}

	// Helper para obter a unidade de referência
	const getReferenceUnit = () => {
		if (!nutritionalInfo?.servingSize) return "100g"

		if (nutritionalViewMode === "per100") {
			const unitMatch = nutritionalInfo.servingSize.match(/\d+[.,]?\d*\s*([a-zA-Z]+)/)
			const unit = unitMatch ? unitMatch[1] : "g"
			return `100${unit}`
		} else {
			return nutritionalInfo.servingSize
		}
	}

	useEffect(() => {
		if (productId) {
			fetchProductDetails()
			fetchNutritionalInfo()
		}
	}, [productId])

	const fetchProductDetails = async () => {
		try {
			const response = await fetch(`/api/products/${productId}?includeStats=true`)

			if (!response.ok) {
				toast.error("Produto não encontrado")
				router.push("/produtos")
				return
			}

			const data = await response.json()
			setProduct(data.product)
			setStats(data.stats)
			setPriceHistory(data.priceHistory || [])
			setMarketComparison(data.marketComparison || [])
			setRecentPurchases(data.recentPurchases || [])
			setStockAlerts(data.stockAlerts)
		} catch (error) {
			console.error("Erro ao buscar detalhes do produto:", error)
			toast.error("Erro ao carregar detalhes do produto")
			router.push("/produtos")
		} finally {
			setLoading(false)
		}
	}

	const fetchNutritionalInfo = async () => {
		try {
			const response = await fetch(`/api/products/${productId}/scan-nutrition`)

			if (response.ok) {
				const data = await response.json()
				setNutritionalInfo(data)
			} else {
				// Não mostrar erro se não houver informações nutricionais
				setNutritionalInfo(null)
			}
		} catch (error) {
			console.error("Erro ao buscar informações nutricionais:", error)
			setNutritionalInfo(null)
		}
	}

	const handleDeleteProduct = async () => {
		if (!confirm(`Tem certeza que deseja excluir o produto "${product?.name}"? Esta ação não pode ser desfeita.`)) {
			return
		}

		try {
			const response = await fetch(`/api/products/${productId}`, {
				method: "DELETE",
			})

			if (response.ok) {
				toast.success("Produto excluído com sucesso!")
				router.push("/produtos")
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao excluir produto")
			}
		} catch (error) {
			console.error("Erro ao excluir produto:", error)
			toast.error("Erro ao excluir produto")
		}
	}

	if (loading) {
		return <ProductDetailsSkeleton />
	}

	if (!product) {
		return null
	}

	const _hasValue = (value: number | null | undefined): value is number => {
		return value !== null && typeof value !== "undefined" && value > 0
	}

	return (
		<div className="space-y-6">
			{/* Header Simplificado */}
			<div className="space-y-4">
				{/* Título e Badges */}
				<div className="flex items-start gap-3">
					<div className="flex-1 min-w-0">
						<h1 className="text-xl md:text-3xl font-bold break-words leading-tight">{product.name}</h1>
						<div className="flex flex-wrap items-center gap-2 mt-3">
							{product.brand && <Badge variant="secondary">{product.brand.name}</Badge>}
							{product.category && (
								<Badge variant="outline">
									{product.category.icon} {product.category.name}
								</Badge>
							)}
							<Badge variant="outline">{product.unit}</Badge>
						</div>
					</div>
				</div>
				<div className="flex flex-row gap-3">
					<Link href="/produtos" className="flex-1">
						<Button variant="outline" size="lg" className="w-full">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar para Produtos
						</Button>
					</Link>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="lg">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={`/produtos/${productId}/editar`} className="flex items-center cursor-pointer">
									<Edit className="h-4 w-4 mr-2" />
									Editar Produto
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleDeleteProduct}
								className="text-red-600 focus:text-red-600 cursor-pointer"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Excluir Produto
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<AnvisaWarnings nutritionalInfo={nutritionalInfo} unit={product.unit} layout="horizontal-inline" />
			<AllergenIcons nutritionalInfo={nutritionalInfo} />

			{/* Botão para Análise Nutricional Completa */}
			{nutritionalInfo && (
				<Link href={`/produtos/${productId}/analise-nutricional`}>
					<Button size="lg" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
						<Sparkles className="h-5 w-5 mr-2" />
						Ver Análise Nutricional Completa com IA
					</Button>
				</Link>
			)}

			{/* Cards de Estatísticas Rápidas */}
			{stats && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
									<ShoppingCart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<p className="text-2xl font-bold">{stats.totalPurchases || 0}</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">Compras Realizadas</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
									<DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
								<div>
									<p className="text-2xl font-bold">R$ {(stats.averagePrice || 0).toFixed(2)}</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">Preço Médio</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
									<Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
								</div>
								<div>
									<p className="text-2xl font-bold">
										{stats.lastPriceDate
											? format(new Date(stats.lastPriceDate), "dd/MM", {
													locale: ptBR,
												})
											: "-"}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">Última Compra</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="p-4">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
									{stats.priceChange > 0 ? (
										<TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
									) : stats.priceChange < 0 ? (
										<TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
									) : (
										<Minus className="h-5 w-5 text-gray-600 dark:text-gray-400" />
									)}
								</div>
								<div>
									<p
										className={`text-2xl font-bold ${
											stats.priceChange > 0
												? "text-red-600 dark:text-red-400"
												: stats.priceChange < 0
													? "text-green-600 dark:text-green-400"
													: "text-gray-600 dark:text-gray-400"
										}`}
									>
										{stats.priceChange > 0 ? "+" : ""}
										{(stats.priceChange || 0).toFixed(1)}%
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">Variação de Preço</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Alertas de Estoque */}
			{stockAlerts && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<AlertTriangle className="h-5 w-5" />
							Status do Estoque
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="flex items-center gap-3">
								<div
									className={`p-2 rounded-lg ${
										stockAlerts.status === "low"
											? "bg-red-100 dark:bg-red-900"
											: stockAlerts.status === "ok"
												? "bg-green-100 dark:bg-green-900"
												: "bg-gray-100 dark:bg-gray-900"
									}`}
								>
									{stockAlerts.status === "low" ? (
										<AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
									) : (
										<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
									)}
								</div>
								<div>
									<p className="text-xl font-bold">{stockAlerts.currentStock || 0}</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">Estoque Atual</p>
								</div>
							</div>

							{product.minStock && (
								<div className="flex items-center gap-3">
									<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
										<Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<p className="text-xl font-bold">{product.minStock}</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">Mínimo</p>
									</div>
								</div>
							)}

							{product.maxStock && (
								<div className="flex items-center gap-3">
									<div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
										<Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
									</div>
									<div>
										<p className="text-xl font-bold">{product.maxStock}</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">Máximo</p>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Gráfico de Evolução de Preços */}
			{priceHistory.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							Evolução de Preços por Mercado
						</CardTitle>
						<CardDescription>Histórico de preços nos últimos 3 meses</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={priceHistory}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="week" />
								<YAxis />
								<Tooltip
									formatter={(value: number) => [`R$ ${value.toFixed(2)}`, ""]}
									labelFormatter={(label) => `Semana: ${label}`}
								/>
								<Legend />
								{Object.keys(priceHistory[0] || {})
									.filter((key) => key !== "week")
									.map((marketName, index) => (
										<Line
											key={marketName}
											type="monotone"
											dataKey={marketName}
											stroke={`hsl(${(index * 137.5) % 360}, 70%, 50%)`}
											strokeWidth={2}
											connectNulls={false}
										/>
									))}
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Informações Básicas */}
				<Card>
					<Tabs defaultValue="info">
						<CardHeader>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="info">Informações Gerais</TabsTrigger>
								<TabsTrigger value="nutrition" disabled={!nutritionalInfo}>
									Tabela Nutricional
								</TabsTrigger>
							</TabsList>
						</CardHeader>
						<TabsContent value="info">
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Código de Barras</p>
										<p className="text-lg font-mono">{product.barcode || "Não informado"}</p>
									</div>
									<div>
										<p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unidade</p>
										<p className="text-lg">{product.unit}</p>
									</div>
								</div>

								{product.hasStock && (
									<div className="border-t pt-4">
										<h4 className="font-medium mb-2">Controle de Estoque</h4>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<p className="text-sm text-gray-600 dark:text-gray-400">Estoque Mínimo</p>
												<p className="font-medium">{product.minStock || "-"}</p>
											</div>
											<div>
												<p className="text-sm text-gray-600 dark:text-gray-400">Estoque Máximo</p>
												<p className="font-medium">{product.maxStock || "-"}</p>
											</div>
										</div>
									</div>
								)}

								{product.hasExpiration && (
									<div className="border-t pt-4">
										<h4 className="font-medium mb-2">Controle de Validade</h4>
										<div>
											<p className="text-sm text-gray-600 dark:text-gray-400">Prazo padrão</p>
											<p className="font-medium">{product.defaultShelfLifeDays || "-"} dias</p>
										</div>
									</div>
								)}
							</CardContent>
						</TabsContent>

						<TabsContent value="nutrition">
							<CardContent>
								<AnvisaNutritionalTable nutritionalInfo={nutritionalInfo} />
							</CardContent>
						</TabsContent>
					</Tabs>
				</Card>

				{/* Análise do melhor dia */}
				<BestDayToBuyCard productId={productId} />
			</div>

			{/* Comparação entre Mercados */}
			{marketComparison.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Store className="h-5 w-5" />
							Comparação entre Mercados
						</CardTitle>
						<CardDescription>Preços médios nos diferentes mercados</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{marketComparison.map((market: any, index: number) => {
								const isCheapest = index === 0 // Assumindo que vem ordenado
								return (
									<div
										key={market.marketId}
										className={`p-4 rounded-lg border ${
											isCheapest
												? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
												: "border-gray-200 dark:border-gray-700"
										}`}
									>
										<div className="flex justify-between items-start">
											<div>
												<h4 className="font-medium">{market.marketName}</h4>
												<p className="text-sm text-gray-600 dark:text-gray-400">{market.purchaseCount} compras</p>
											</div>
											{isCheapest && <Badge className="bg-green-500">Melhor Preço</Badge>}
										</div>
										<p className="text-xl font-bold mt-2">R$ {market.averagePrice.toFixed(2)}</p>
									</div>
								)
							})}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Compras Recentes */}
			{recentPurchases.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<div>
								<CardTitle className="flex items-center gap-2">
									<BarChart3 className="h-5 w-5" />
									Compras Recentes
								</CardTitle>
								<CardDescription>Histórico das últimas compras deste produto</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm text-gray-600 dark:text-gray-400">
									{(purchasesPage - 1) * purchasesPerPage + 1}-
									{Math.min(purchasesPage * purchasesPerPage, recentPurchases.length)} de {recentPurchases.length}
								</span>
								<div className="flex gap-1">
									<Button
										variant="outline"
										size="icon"
										className="h-8 w-8"
										onClick={() => setPurchasesPage((p) => Math.max(1, p - 1))}
										disabled={purchasesPage === 1}
									>
										<ChevronLeft className="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="icon"
										className="h-8 w-8"
										onClick={() => setPurchasesPage((p) => p + 1)}
										disabled={purchasesPage * purchasesPerPage >= recentPurchases.length}
									>
										<ChevronRight className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{recentPurchases
								.slice((purchasesPage - 1) * purchasesPerPage, purchasesPage * purchasesPerPage)
								.map((purchase: any) => (
									<div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
										<div className="flex items-center gap-3">
											<Store className="h-4 w-4 text-gray-400" />
											<div>
												<p className="font-medium">{purchase.market?.name}</p>
												<p className="text-sm text-gray-600 dark:text-gray-400">
													{format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: ptBR })} •{purchase.quantity}{" "}
													{product.unit}
												</p>
											</div>
										</div>
										<div className="text-right">
											<p className="font-bold">R$ {purchase.unitPrice.toFixed(2)}</p>
											<p className="text-sm text-gray-600 dark:text-gray-400">por {product.unit}</p>
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Informações Nutricionais Completas */}
			{nutritionalInfo && (
				<Card>
					<CardHeader>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div>
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5 text-green-600" />
									Informações Nutricionais Completas
								</CardTitle>
								<CardDescription className="mt-2">
									{nutritionalInfo.servingsPerPackage && (
										<>Porções por embalagem: {nutritionalInfo.servingsPerPackage} • </>
									)}
									Valores calculados por {getReferenceUnit()}
								</CardDescription>
							</div>
							<Tabs
								value={nutritionalViewMode}
								onValueChange={(value) => setNutritionalViewMode(value as "per100" | "perServing")}
								className="w-auto"
							>
								<TabsList className="grid w-full grid-cols-2">
									<TabsTrigger value="per100" className="text-xs sm:text-sm">
										Por 100
										{nutritionalInfo.servingSize ? nutritionalInfo.servingSize.match(/[a-zA-Z]+/)?.[0] || "g" : "g"}
									</TabsTrigger>
									<TabsTrigger value="perServing" className="text-xs sm:text-sm">
										Por Porção
									</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-8">
							{/* Macronutrientes */}
							<div>
								{_hasValue(nutritionalInfo.calories) ||
									_hasValue(nutritionalInfo.carbohydrates) ||
									_hasValue(nutritionalInfo.proteins) ||
									(_hasValue(nutritionalInfo.totalFat) && (
										<div className="flex items-center gap-2 mb-4">
											<div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
											<h4 className="font-semibold text-gray-900 dark:text-gray-100">Macronutrientes</h4>
										</div>
									))}
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
									{_hasValue(nutritionalInfo.calories) && (
										<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
											<div className="relative z-10">
												<p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Valor Energético</p>
												<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
													{getDisplayValue(nutritionalInfo.calories, " kcal")}
												</p>
											</div>
											<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-blue-200 dark:bg-blue-700 opacity-20"></div>
										</div>
									)}
									{_hasValue(nutritionalInfo.carbohydrates) && (
										<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
											<div className="relative z-10">
												<p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Carboidratos</p>
												<p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
													{getDisplayValue(nutritionalInfo.carbohydrates, "g")}
												</p>
											</div>
											<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-orange-200 dark:bg-orange-700 opacity-20"></div>
										</div>
									)}
									{_hasValue(nutritionalInfo.proteins) && (
										<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
											<div className="relative z-10">
												<p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Proteínas</p>
												<p className="text-2xl font-bold text-green-900 dark:text-green-100">
													{getDisplayValue(nutritionalInfo.proteins, "g")}
												</p>
											</div>
											<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-green-200 dark:bg-green-700 opacity-20"></div>
										</div>
									)}
									{_hasValue(nutritionalInfo.totalFat) && (
										<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-4 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300">
											<div className="relative z-10">
												<p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Gorduras Totais</p>
												<p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
													{getDisplayValue(nutritionalInfo.totalFat, "g")}
												</p>
											</div>
											<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-yellow-200 dark:bg-yellow-700 opacity-20"></div>
										</div>
									)}
								</div>
							</div>

							{/* Açúcares e Fibras */}
							{(nutritionalInfo.totalSugars || nutritionalInfo.addedSugars || nutritionalInfo.fiber) && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="h-1 w-8 bg-gradient-to-r from-pink-500 to-teal-500 rounded-full"></div>
										<h4 className="font-semibold text-gray-900 dark:text-gray-100">Açúcares e Fibras</h4>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
										{_hasValue(nutritionalInfo.totalSugars) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 p-4 border border-pink-200 dark:border-pink-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-1">Açúcares Totais</p>
													<p className="text-xl font-bold text-pink-900 dark:text-pink-100">
														{getDisplayValue(nutritionalInfo.totalSugars, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-pink-200 dark:bg-pink-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.addedSugars) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<div className="flex items-center justify-between mb-1">
														<p className="text-sm font-medium text-red-700 dark:text-red-300">Açúcares Adicionados</p>
														{(() => {
															// Verificar se há aviso ANVISA para açúcar adicionado
															const isLiquid = ["ml", "litro"].includes(product.unit.toLowerCase())
															const threshold = isLiquid ? 7.5 : 15
															const servingMatch = nutritionalInfo.servingSize?.match(/(\d+[.,]?\d*)/)
															const servingSize = servingMatch ? parseFloat(servingMatch[1].replace(",", ".")) : 100
															const multiplier = servingSize / 100
															const addedSugarsPerServing = nutritionalInfo.addedSugars * multiplier

															if (addedSugarsPerServing >= threshold) {
																return (
																	<Badge className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1">
																		Alto
																	</Badge>
																)
															}
															return null
														})()}
													</div>
													<p className="text-xl font-bold text-red-900 dark:text-red-100">
														{getDisplayValue(nutritionalInfo.addedSugars, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-red-200 dark:bg-red-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.fiber) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 p-4 border border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">Fibras</p>
													<p className="text-xl font-bold text-teal-900 dark:text-teal-100">
														{getDisplayValue(nutritionalInfo.fiber, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-teal-200 dark:bg-teal-700 opacity-20"></div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Gorduras Detalhadas */}
							{(nutritionalInfo.saturatedFat ||
								nutritionalInfo.transFat ||
								nutritionalInfo.monounsaturatedFat ||
								nutritionalInfo.polyunsaturatedFat ||
								nutritionalInfo.cholesterol) && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="h-1 w-8 bg-gradient-to-r from-yellow-500 to-red-500 rounded-full"></div>
										<h4 className="font-semibold text-gray-900 dark:text-gray-100">Gorduras Detalhadas</h4>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
										{_hasValue(nutritionalInfo.saturatedFat) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Saturadas</p>
													<p className="text-xl font-bold text-red-900 dark:text-red-100">
														{getDisplayValue(nutritionalInfo.saturatedFat, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-red-200 dark:bg-red-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.transFat) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Trans</p>
													<p className="text-xl font-bold text-purple-900 dark:text-purple-100">
														{getDisplayValue(nutritionalInfo.transFat, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-purple-200 dark:bg-purple-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.monounsaturatedFat) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-4 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">
														Monoinsaturadas
													</p>
													<p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
														{getDisplayValue(nutritionalInfo.monounsaturatedFat, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-yellow-200 dark:bg-yellow-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.polyunsaturatedFat) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
														Poli-insaturadas
													</p>
													<p className="text-xl font-bold text-orange-900 dark:text-orange-100">
														{getDisplayValue(nutritionalInfo.polyunsaturatedFat, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-orange-200 dark:bg-orange-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.cholesterol) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-4 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Colesterol</p>
													<p className="text-xl font-bold text-gray-900 dark:text-gray-100">
														{getDisplayValue(nutritionalInfo.cholesterol, "mg")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-600 opacity-20"></div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Vitaminas */}
							{(nutritionalInfo.vitaminA ||
								nutritionalInfo.vitaminC ||
								nutritionalInfo.vitaminD ||
								nutritionalInfo.vitaminE ||
								nutritionalInfo.vitaminK ||
								nutritionalInfo.thiamine ||
								nutritionalInfo.riboflavin ||
								nutritionalInfo.niacin ||
								nutritionalInfo.vitaminB6 ||
								nutritionalInfo.folate ||
								nutritionalInfo.vitaminB12 ||
								nutritionalInfo.biotin ||
								nutritionalInfo.pantothenicAcid) && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"></div>
										<h4 className="font-semibold text-gray-900 dark:text-gray-100">Vitaminas</h4>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
										{_hasValue(nutritionalInfo.vitaminA) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-3 border border-emerald-200 dark:border-emerald-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-1">Vitamina A</p>
												<p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
													{getDisplayValue(nutritionalInfo.vitaminA, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.vitaminC) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 p-3 border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">Vitamina C</p>
												<p className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
													{getDisplayValue(nutritionalInfo.vitaminC, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.vitaminD) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-3 border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Vitamina D</p>
												<p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
													{getDisplayValue(nutritionalInfo.vitaminD, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.vitaminE) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-3 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Vitamina E</p>
												<p className="text-lg font-bold text-amber-900 dark:text-amber-100">
													{getDisplayValue(nutritionalInfo.vitaminE, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.vitaminK) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-lime-50 to-lime-100 dark:from-lime-950 dark:to-lime-900 p-3 border border-lime-200 dark:border-lime-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-lime-700 dark:text-lime-300 mb-1">Vitamina K</p>
												<p className="text-lg font-bold text-lime-900 dark:text-lime-100">
													{getDisplayValue(nutritionalInfo.vitaminK, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.thiamine) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-3 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">B1 (Tiamina)</p>
												<p className="text-lg font-bold text-blue-900 dark:text-blue-100">
													{getDisplayValue(nutritionalInfo.thiamine, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.riboflavin) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 p-3 border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">
													B2 (Riboflavina)
												</p>
												<p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
													{getDisplayValue(nutritionalInfo.riboflavin, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.niacin) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 p-3 border border-violet-200 dark:border-violet-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-1">B3 (Niacina)</p>
												<p className="text-lg font-bold text-violet-900 dark:text-violet-100">
													{getDisplayValue(nutritionalInfo.niacin, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.vitaminB6) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-3 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Vitamina B6</p>
												<p className="text-lg font-bold text-purple-900 dark:text-purple-100">
													{getDisplayValue(nutritionalInfo.vitaminB6, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.folate) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 dark:from-fuchsia-950 dark:to-fuchsia-900 p-3 border border-fuchsia-200 dark:border-fuchsia-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300 mb-1">Folato</p>
												<p className="text-lg font-bold text-fuchsia-900 dark:text-fuchsia-100">
													{getDisplayValue(nutritionalInfo.folate, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.vitaminB12) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 p-3 border border-pink-200 dark:border-pink-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-pink-700 dark:text-pink-300 mb-1">Vitamina B12</p>
												<p className="text-lg font-bold text-pink-900 dark:text-pink-100">
													{getDisplayValue(nutritionalInfo.vitaminB12, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.biotin) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950 dark:to-rose-900 p-3 border border-rose-200 dark:border-rose-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-rose-700 dark:text-rose-300 mb-1">Biotina</p>
												<p className="text-lg font-bold text-rose-900 dark:text-rose-100">
													{getDisplayValue(nutritionalInfo.biotin, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.pantothenicAcid) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-3 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
													B5 (Ác. Pantotênico)
												</p>
												<p className="text-lg font-bold text-slate-900 dark:text-slate-100">
													{getDisplayValue(nutritionalInfo.pantothenicAcid, "mg")}
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Minerais */}
							{(nutritionalInfo.sodium ||
								nutritionalInfo.calcium ||
								nutritionalInfo.iron ||
								nutritionalInfo.magnesium ||
								nutritionalInfo.phosphorus ||
								nutritionalInfo.potassium ||
								nutritionalInfo.zinc ||
								nutritionalInfo.copper ||
								nutritionalInfo.manganese ||
								nutritionalInfo.selenium ||
								nutritionalInfo.iodine ||
								nutritionalInfo.chromium ||
								nutritionalInfo.molybdenum) && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="h-1 w-8 bg-gradient-to-r from-stone-500 to-amber-500 rounded-full"></div>
										<h4 className="font-semibold text-gray-900 dark:text-gray-100">Minerais</h4>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
										{_hasValue(nutritionalInfo.sodium) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sódio</p>
												<p className="text-lg font-bold text-gray-900 dark:text-gray-100">
													{getDisplayValue(nutritionalInfo.sodium, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.calcium) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-800 dark:to-stone-700 p-3 border border-stone-200 dark:border-stone-600 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-stone-700 dark:text-stone-300 mb-1">Cálcio</p>
												<p className="text-lg font-bold text-stone-900 dark:text-stone-100">
													{getDisplayValue(nutritionalInfo.calcium, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.iron) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-3 border border-red-200 dark:border-red-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Ferro</p>
												<p className="text-lg font-bold text-red-900 dark:text-red-100">
													{getDisplayValue(nutritionalInfo.iron, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.magnesium) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-3 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Magnésio</p>
												<p className="text-lg font-bold text-green-900 dark:text-green-100">
													{getDisplayValue(nutritionalInfo.magnesium, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.phosphorus) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-3 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Fósforo</p>
												<p className="text-lg font-bold text-orange-900 dark:text-orange-100">
													{getDisplayValue(nutritionalInfo.phosphorus, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.potassium) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-3 border border-yellow-200 dark:border-yellow-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">Potássio</p>
												<p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
													{getDisplayValue(nutritionalInfo.potassium, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.zinc) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-3 border border-blue-200 dark:border-blue-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Zinco</p>
												<p className="text-lg font-bold text-blue-900 dark:text-blue-100">
													{getDisplayValue(nutritionalInfo.zinc, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.copper) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-3 border border-amber-200 dark:border-amber-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Cobre</p>
												<p className="text-lg font-bold text-amber-900 dark:text-amber-100">
													{getDisplayValue(nutritionalInfo.copper, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.manganese) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-3 border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Manganês</p>
												<p className="text-lg font-bold text-purple-900 dark:text-purple-100">
													{getDisplayValue(nutritionalInfo.manganese, "mg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.selenium) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 p-3 border border-cyan-200 dark:border-cyan-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-cyan-700 dark:text-cyan-300 mb-1">Selênio</p>
												<p className="text-lg font-bold text-cyan-900 dark:text-cyan-100">
													{getDisplayValue(nutritionalInfo.selenium, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.iodine) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 p-3 border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-1">Iodo</p>
												<p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
													{getDisplayValue(nutritionalInfo.iodine, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.chromium) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-3 border border-slate-200 dark:border-slate-600 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Cromo</p>
												<p className="text-lg font-bold text-slate-900 dark:text-slate-100">
													{getDisplayValue(nutritionalInfo.chromium, "mcg")}
												</p>
											</div>
										)}
										{_hasValue(nutritionalInfo.molybdenum) && (
											<div className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 p-3 border border-neutral-200 dark:border-neutral-600 hover:shadow-md transition-all duration-300">
												<p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Molibdênio</p>
												<p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
													{getDisplayValue(nutritionalInfo.molybdenum, "mcg")}
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Outros Compostos */}
							{(nutritionalInfo.omega3 ||
								nutritionalInfo.omega6 ||
								nutritionalInfo.epa ||
								nutritionalInfo.dha ||
								nutritionalInfo.taurine ||
								nutritionalInfo.caffeine ||
								nutritionalInfo.alcoholContent) && (
								<div>
									<div className="flex items-center gap-2 mb-4">
										<div className="h-1 w-8 bg-gradient-to-r from-teal-500 to-purple-500 rounded-full"></div>
										<h4 className="font-semibold text-gray-900 dark:text-gray-100">Outros Compostos</h4>
									</div>
									<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
										{_hasValue(nutritionalInfo.omega3) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 p-4 border border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-1">Ômega 3</p>
													<p className="text-xl font-bold text-teal-900 dark:text-teal-100">
														{getDisplayValue(nutritionalInfo.omega3, "mg")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-teal-200 dark:bg-teal-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.omega6) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-4 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 mb-1">Ômega 6</p>
													<p className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
														{getDisplayValue(nutritionalInfo.omega6, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-emerald-200 dark:bg-emerald-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.epa) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">EPA</p>
													<p className="text-xl font-bold text-blue-900 dark:text-blue-100">
														{getDisplayValue(nutritionalInfo.epa, "mg")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-blue-200 dark:bg-blue-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.dha) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 p-4 border border-cyan-200 dark:border-cyan-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-cyan-700 dark:text-cyan-300 mb-1">DHA</p>
													<p className="text-xl font-bold text-cyan-900 dark:text-cyan-100">
														{getDisplayValue(nutritionalInfo.dha, "mg")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-cyan-200 dark:bg-cyan-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.taurine) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Taurina</p>
													<p className="text-xl font-bold text-purple-900 dark:text-purple-100">
														{getDisplayValue(nutritionalInfo.taurine, "mg")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-purple-200 dark:bg-purple-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.caffeine) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 p-4 border border-amber-200 dark:border-amber-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Cafeína</p>
													<p className="text-xl font-bold text-amber-900 dark:text-amber-100">
														{getDisplayValue(nutritionalInfo.caffeine, "mg")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-amber-200 dark:bg-amber-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.galactose) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Galactose</p>
													<p className="text-xl font-bold text-red-900 dark:text-red-100">
														{getDisplayValue(nutritionalInfo.lactose, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-red-200 dark:bg-red-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.lactose) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Lactose</p>
													<p className="text-xl font-bold text-red-900 dark:text-red-100">
														{getDisplayValue(nutritionalInfo.lactose, "g")}
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-red-200 dark:bg-red-700 opacity-20"></div>
											</div>
										)}
										{_hasValue(nutritionalInfo.alcoholContent) && (
											<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 p-4 border border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-300">
												<div className="relative z-10">
													<p className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">Teor Alcoólico</p>
													<p className="text-xl font-bold text-red-900 dark:text-red-100">
														{nutritionalInfo.alcoholContent} %
													</p>
												</div>
												<div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-red-200 dark:bg-red-700 opacity-20"></div>
											</div>
										)}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			<NutritionAiAnalysis productId={productId} productName={product.name} />

			{/* Informações sobre Alérgenos */}
			{nutritionalInfo &&
				(nutritionalInfo.allergensContains?.length > 0 || nutritionalInfo.allergensMayContain?.length > 0) && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<AlertTriangle className="h-5 w-5 text-orange-500" />
								Informações sobre Alérgenos
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{nutritionalInfo.allergensContains?.length > 0 && (
								<div>
									<h4 className="font-semibold text-red-600 mb-2">CONTÉM:</h4>
									<div className="flex flex-wrap gap-2">
										{nutritionalInfo.allergensContains.map((allergen, index) => (
											<Badge key={index} variant="destructive">
												{allergen}
											</Badge>
										))}
									</div>
								</div>
							)}

							{nutritionalInfo.allergensMayContain?.length > 0 && (
								<div>
									<h4 className="font-semibold text-yellow-600 mb-2">PODE CONTER:</h4>
									<div className="flex flex-wrap gap-2">
										{nutritionalInfo.allergensMayContain.map((allergen, index) => (
											<Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
												{allergen}
											</Badge>
										))}
									</div>
								</div>
							)}
						</CardContent>
					</Card>
				)}
		</div>
	)
}
