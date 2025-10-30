"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	ArrowLeft,
	BarChart3,
	Calendar,
	DollarSign,
	Filter,
	History,
	MapPin,
	Package,
	Plus,
	Search,
	ShoppingCart,
	Store,
	Tag,
	TrendingDown,
	TrendingUp,
	Users,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MarketImageFallback } from "@/components/ui/market-image-fallback"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatLocalDate } from "@/lib/date-utils"
import { useMarketStatsQuery, usePurchasesQuery } from "@/hooks/use-react-query"

interface MarketStats {
	market: any
	stats: {
		totalPurchases: number
		totalSpent: number
		averageTicket: number
	}
	lastPurchase: any
	recentPurchases: any[]
	topProducts: any[]
	priceEvolution: any[]
	priceComparison: any[]
	categoryStats: {
		categoryId: string
		categoryName: string
		icon?: string
		color?: string
		totalSpent: number
		totalPurchases: number
		totalQuantity: number
		averagePrice: number
	}[]
}

export default function MarketDetailsPage() {
	const params = useParams()
	const router = useRouter()
	const marketId = params.id as string

	// React Query hooks
	const { data: statsData, isLoading: isLoadingStats, error: statsError } = useMarketStatsQuery(marketId)

	const purchaseParams = new URLSearchParams()
	purchaseParams.append("marketId", marketId)
	const { data: purchasesData, isLoading: isLoadingPurchases } = usePurchasesQuery(purchaseParams)

	// Local state for filtering
	const [filteredPurchases, setFilteredPurchases] = useState<any[]>([])
	const [searchTerm, setSearchTerm] = useState("")
	const [dateFilter, setDateFilter] = useState("all")
	const [sortBy, setSortBy] = useState("date-desc")

	const loading = isLoadingStats || isLoadingPurchases
	const data = statsData
	const allPurchases = purchasesData?.purchases || []

	// Handle error - redirect to markets page
	useEffect(() => {
		if (statsError) {
			console.error("Erro ao carregar dados:", statsError)
			router.push("/mercados")
		}
	}, [statsError, router])

	// Filtrar compras
	useEffect(() => {
		if (!Array.isArray(allPurchases)) return
		let filtered = [...allPurchases]

		// Filtro por busca
		if (searchTerm) {
			filtered = filtered.filter((purchase) =>
				purchase.items?.some((item: any) =>
					(item.product?.name || item.productName)?.toLowerCase().includes(searchTerm.toLowerCase()),
				),
			)
		}

		// Filtro por data
		if (dateFilter !== "all") {
			const now = new Date()
			let dateThreshold

			switch (dateFilter) {
				case "week":
					dateThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
					break
				case "month":
					dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
					break
				case "3months":
					dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
					break
				default:
					dateThreshold = null
			}

			if (dateThreshold) {
				filtered = filtered.filter((purchase) => new Date(purchase.purchaseDate) >= dateThreshold)
			}
		}

		// Ordenação
		switch (sortBy) {
			case "date-desc":
				filtered.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
				break
			case "date-asc":
				filtered.sort((a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime())
				break
			case "value-desc":
				filtered.sort((a, b) => b.totalAmount - a.totalAmount)
				break
			case "value-asc":
				filtered.sort((a, b) => a.totalAmount - b.totalAmount)
				break
		}

		setFilteredPurchases(filtered)
	}, [allPurchases, searchTerm, dateFilter, sortBy])

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
					<div>
						<div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-2" />
						<div className="h-5 w-80 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<Card key={i}>
							<CardHeader>
								<div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
								<div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
							</CardHeader>
						</Card>
					))}
				</div>
			</div>
		)
	}

	if (!data) {
		return <div>Mercado não encontrado</div>
	}

	const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start gap-6">
				<Link href="/mercados">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				
				{/* Área de imagem - sempre presente */}
				<div className="flex-shrink-0">
					<div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-gray-200">
						{data.market.imageUrl ? (
							<Image
								src={data.market.imageUrl}
								alt={data.market.name}
								fill
								className="object-cover"
								sizes="96px"
							/>
						) : (
							<MarketImageFallback 
								marketName={data.market.name}
								className="w-full h-full"
								size="sm"
							/>
						)}
					</div>
				</div>
				
				<div className="flex-1">
					<h1 className="text-3xl font-bold flex items-center gap-2">
						<Store className="h-8 w-8" />
						{data.market.name}
					</h1>
					{data.market.legalName && (
						<p className="text-muted-foreground mt-1 text-sm">Razão Social: {data.market.legalName}</p>
					)}
					{data.market.location && (
						<p className="text-gray-600 mt-2 flex items-center gap-1">
							<MapPin className="h-4 w-4" />
							{data.market.location}
						</p>
					)}
				</div>
			</div>

			{/* Tabs de Navegação */}
			<Tabs defaultValue="overview" className="space-y-6">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="overview" className="flex items-center gap-2">
						<BarChart3 className="h-4 w-4" />
						Overview
					</TabsTrigger>
					<TabsTrigger value="history" className="flex items-center gap-2">
						<History className="h-4 w-4" />
						Histórico ({allPurchases.length})
					</TabsTrigger>
				</TabsList>

				{/* Tab Overview */}
				<TabsContent value="overview" className="space-y-6">
					{/* Cards de Estatísticas Principais */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
								<ShoppingCart className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{data.stats.totalPurchases}</div>
								<p className="text-xs text-muted-foreground">compras realizadas</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
								<DollarSign className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">R$ {data.stats.totalSpent.toFixed(2)}</div>
								<p className="text-xs text-muted-foreground">em todas as compras</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
								<TrendingUp className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">R$ {data.stats.averageTicket.toFixed(2)}</div>
								<p className="text-xs text-muted-foreground">por compra</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Última Compra</CardTitle>
								<Calendar className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{data.lastPurchase
										? format(new Date(data.lastPurchase.purchaseDate), "dd/MM", { locale: ptBR })
										: "N/A"}
								</div>
								<p className="text-xs text-muted-foreground">
									{data.lastPurchase ? `R$ ${data.lastPurchase.totalAmount.toFixed(2)}` : "Nenhuma compra"}
								</p>
							</CardContent>
						</Card>
					</div>

					{/* Gráficos */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Evolução do Gasto Mensal */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<BarChart3 className="h-5 w-5" />
									Evolução Mensal
								</CardTitle>
								<CardDescription>Gasto médio por compra nos últimos 6 meses</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<LineChart data={data.priceEvolution}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="month"
											tickFormatter={(value) => format(new Date(value), "MMM/yy", { locale: ptBR })}
										/>
										<YAxis tickFormatter={(value) => `R$ ${value.toFixed(0)}`} />
										<Tooltip
											formatter={(value: any) => [`R$ ${value.toFixed(2)}`, "Gasto Médio"]}
											labelFormatter={(value) => format(new Date(value), "MMMM yyyy", { locale: ptBR })}
										/>
										<Line
											type="monotone"
											dataKey="avg_amount"
											stroke="#8884d8"
											strokeWidth={2}
											dot={{ fill: "#8884d8" }}
										/>
									</LineChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						{/* Top Produtos */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5" />
									Produtos Mais Comprados
								</CardTitle>
								<CardDescription>Top 5 produtos por frequência</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart data={data.topProducts.slice(0, 5)}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis
											dataKey="product.name"
											tick={{ fontSize: 12 }}
											interval={0}
											angle={-45}
											textAnchor="end"
											height={80}
										/>
										<YAxis />
										<Tooltip formatter={(value: any) => [value, "Vezes Comprado"]} />
										<Bar dataKey="_count.productId" fill="#8884d8" />
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					{/* Seções Detalhadas */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Compras Recentes */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingCart className="h-5 w-5" />
									Compras Recentes
								</CardTitle>
								<CardDescription>Últimas 5 compras realizadas neste mercado</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{data.recentPurchases.slice(0, 5).map((purchase) => (
										<div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
											<div>
												<p className="font-medium">
													{format(new Date(purchase.purchaseDate), "dd 'de' MMM", { locale: ptBR })}
												</p>
												<p className="text-sm text-gray-600">{purchase.items.length} itens</p>
											</div>
											<div className="text-right">
												<p className="font-bold">R$ {purchase.totalAmount.toFixed(2)}</p>
											</div>
										</div>
									))}
									{data.recentPurchases.length === 0 && (
										<p className="text-center text-gray-500 py-4">Nenhuma compra realizada ainda</p>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Produtos Favoritos Detalhado */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5" />
									Análise de Produtos
								</CardTitle>
								<CardDescription>Produtos mais comprados com valores</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{data.topProducts.slice(0, 5).map((item, index) => (
										<div key={item.productId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
											<div className="flex items-center gap-3">
												<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
													{index + 1}
												</div>
												<div>
													<p className="font-medium">{item.product?.name}</p>
													<p className="text-sm text-gray-600">
														{item.product?.brand?.name} • {item.product?.unit}
													</p>
												</div>
											</div>
											<div className="text-right">
												<p className="font-bold">{item._count.productId}x</p>
												<p className="text-sm text-gray-600">R$ {(item._sum.totalPrice || 0).toFixed(2)}</p>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Comparação de Preços */}
					{data.priceComparison.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Users className="h-5 w-5" />
									Comparação com Outros Mercados
								</CardTitle>
								<CardDescription>Preço médio unitário nos últimos 3 meses</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<BarChart
										data={[
											{
												name: data.market.name,
												avgPrice: data.stats.averageTicket / (data.stats.totalPurchases || 1),
												isCurrentMarket: true,
											},
											...data.priceComparison.map((market: any) => ({
												name: market.name,
												avgPrice: parseFloat(market.avg_price),
												isCurrentMarket: false,
											})),
										]}
									>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="name" />
										<YAxis tickFormatter={(value) => `R$ ${value.toFixed(1)}`} />
										<Tooltip
											formatter={(value: any, _name, props) => [
												`R$ ${value.toFixed(2)}`,
												props.payload.isCurrentMarket ? "Este Mercado" : "Preço Médio",
											]}
										/>
										<Bar dataKey="avgPrice">
											{[
												{
													name: data.market.name,
													avgPrice: data.stats.averageTicket / (data.stats.totalPurchases || 1),
													isCurrentMarket: true,
												},
												...data.priceComparison.map((market: any) => ({
													name: market.name,
													avgPrice: parseFloat(market.avg_price),
													isCurrentMarket: false,
												})),
											].map((entry, index) => (
												<Cell key={`cell-${index}`} fill={entry.isCurrentMarket ? "#10b981" : "#6b7280"} />
											))}
										</Bar>
									</BarChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					)}

					{/* Estatísticas por Categoria */}
					{data.categoryStats && data.categoryStats.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Package className="h-5 w-5" />
									Gastos por Categoria
								</CardTitle>
								<CardDescription>Distribuição de gastos por categoria neste mercado</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{data.categoryStats.slice(0, 8).map((category, index) => {
										const percentage =
											data.stats.totalSpent > 0 ? (category.totalSpent / data.stats.totalSpent) * 100 : 0
										return (
											<div key={category.categoryId} className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
														{index + 1}
													</div>
													<div>
														<div className="font-medium">{category.categoryName}</div>
														<div className="text-sm text-gray-500">
															{category.totalQuantity.toFixed(1)} itens • {category.totalPurchases} compras
														</div>
													</div>
												</div>
												<div className="text-right">
													<div className="font-medium">R$ {category.totalSpent.toFixed(2)}</div>
													<div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
												</div>
											</div>
										)
									})}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Distribuição de Gastos por Categoria - Gráfico */}
					{data.categoryStats && data.categoryStats.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5" />
									Distribuição de Gastos
								</CardTitle>
								<CardDescription>Valor gasto por categoria de produto</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={300}>
									<PieChart>
										<Pie
											data={data.categoryStats.slice(0, 5).map((category, index) => ({
												name: category.categoryName,
												value: category.totalSpent,
												fill: COLORS[index % COLORS.length],
											}))}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
											outerRadius={80}
											fill="#8884d8"
											dataKey="value"
										>
											{data.categoryStats.slice(0, 5).map((_, index) => (
												<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
											))}
										</Pie>
										<Tooltip formatter={(value: any) => [`R$ ${value.toFixed(2)}`, "Total Gasto"]} />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					)}

					{/* Insights e Recomendações */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<TrendingUp className="h-5 w-5" />
								Insights e Análises
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<h4 className="font-semibold">Padrões de Compra</h4>
									<div className="space-y-2">
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Frequência de compras:</span>
											<span className="font-medium">
												{data.stats.totalPurchases > 0
													? `${(data.stats.totalPurchases / 6).toFixed(1)} por mês`
													: "Dados insuficientes"}
											</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Produto favorito:</span>
											<span className="font-medium">{data.topProducts[0]?.product?.name || "N/A"}</span>
										</div>
										<div className="flex justify-between">
											<span className="text-sm text-gray-600">Categoria principal:</span>
											<span className="font-medium">{data.topProducts[0]?.product?.category?.name || "N/A"}</span>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h4 className="font-semibold">Recomendações</h4>
									<div className="space-y-2 text-sm">
										{data.stats.averageTicket > 100 && (
											<div className="p-2 bg-blue-50 rounded text-blue-800">
												💡 Seu ticket médio é alto. Considere comparar preços com outros mercados.
											</div>
										)}
										{data.topProducts.length > 0 && data.topProducts[0]._count.productId > 5 && (
											<div className="p-2 bg-green-50 rounded text-green-800">
												🎯 Você tem produtos frequentes. Considere criar uma lista de compras padrão.
											</div>
										)}
										{data.stats.totalPurchases < 3 && (
											<div className="p-2 bg-yellow-50 rounded text-yellow-800">
												📊 Poucas compras registradas. Continue usando para melhores insights.
											</div>
										)}
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Ações Rápidas */}
					<Card>
						<CardHeader>
							<CardTitle>Ações Rápidas</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex gap-4">
								<Link href="/compras/nova">
									<Button>
										<Plus className="h-4 w-4 mr-2" />
										Nova Compra neste Mercado
									</Button>
								</Link>
								{data.topProducts.length > 0 && (
									<Link href="/lista/nova">
										<Button variant="outline">
											<Package className="h-4 w-4 mr-2" />
											Lista com Produtos Favoritos
										</Button>
									</Link>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab Histórico */}
				<TabsContent value="history" className="space-y-6">
					{/* Filtros */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Filter className="h-5 w-5" />
								Filtros
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="space-y-2">
									<Label htmlFor="search">Buscar por produto</Label>
									<div className="relative">
										<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
										<Input
											id="search"
											placeholder="Nome do produto..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-8"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="dateFilter">Período</Label>
									<Select value={dateFilter} onValueChange={setDateFilter}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todas as compras</SelectItem>
											<SelectItem value="week">Última semana</SelectItem>
											<SelectItem value="month">Último mês</SelectItem>
											<SelectItem value="3months">Últimos 3 meses</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="sortBy">Ordenar por</Label>
									<Select value={sortBy} onValueChange={setSortBy}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="date-desc">Data (mais recente)</SelectItem>
											<SelectItem value="date-asc">Data (mais antiga)</SelectItem>
											<SelectItem value="value-desc">Valor (maior)</SelectItem>
											<SelectItem value="value-asc">Valor (menor)</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<History className="h-5 w-5" />
								Histórico Completo ({Array.isArray(filteredPurchases) ? filteredPurchases.length : 0} compras)
							</CardTitle>
							<CardDescription>Todas as compras realizadas neste mercado</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{(Array.isArray(filteredPurchases) ? filteredPurchases : []).map((purchase) => {
									const hasDiscount = (purchase.totalDiscount || 0) > 0
									const finalAmount = purchase.finalAmount || purchase.totalAmount

									return (
										<Card
											key={purchase.id}
											className={`border-l-4 ${hasDiscount ? "border-l-green-500" : "border-l-blue-500"}`}
										>
											<CardContent className="pt-4">
												<div className="flex justify-between items-start mb-3">
													<div className="flex-1">
														<div className="flex items-center gap-2 flex-wrap">
															<p className="font-semibold text-lg">
																{formatLocalDate(purchase.purchaseDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
															</p>
															{hasDiscount && (
																<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
																	<Tag className="h-3 w-3" />
																	Com desconto
																</span>
															)}
														</div>
														<p className="text-sm text-gray-600">{purchase.items?.length || 0} itens</p>
													</div>
													<div className="text-right">
														{hasDiscount ? (
															<div>
																<div className="text-sm text-gray-500 line-through">
																	R$ {purchase.totalAmount.toFixed(2)}
																</div>
																<div className="text-2xl font-bold text-green-600">R$ {finalAmount.toFixed(2)}</div>
																<div className="flex items-center gap-1 text-xs text-green-600 font-medium">
																	<TrendingDown className="h-3 w-3" />
																	-R$ {(purchase.totalDiscount || 0).toFixed(2)}
																</div>
															</div>
														) : (
															<div>
																<div className="text-2xl font-bold text-green-600">
																	R$ {purchase.totalAmount.toFixed(2)}
																</div>
															</div>
														)}
														<p className="text-xs text-gray-500 mt-1">
															{format(new Date(purchase.purchaseDate), "HH:mm", {
																locale: ptBR,
															})}
														</p>
													</div>
												</div>

												{/* Itens da Compra */}
												<div className="space-y-2">
													<h4 className="text-sm font-medium text-gray-700 mb-2">Itens comprados:</h4>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
														{purchase.items?.map((item: any, index: number) => {
															const itemHasDiscount = (item.totalDiscount || 0) > 0
															const itemFinalPrice = item.finalPrice || item.totalPrice

															return (
																<div
																	key={item.id || `${purchase.id}-item-${index}`}
																	className={`flex justify-between items-center p-2 rounded text-sm ${
																		itemHasDiscount ? "bg-green-50 border border-green-200" : "bg-gray-50"
																	}`}
																>
																	<div className="flex-1 min-w-0">
																		<div className="flex items-center gap-1 flex-wrap">
																			<span className="font-medium">{item.product?.name || item.productName}</span>
																			{itemHasDiscount && <Tag className="h-3 w-3 text-green-600 flex-shrink-0" />}
																		</div>
																		{(item.product?.brand?.name || item.brandName) && (
																			<span className="text-gray-500 text-xs">
																				{item.product?.brand?.name || item.brandName}
																			</span>
																		)}
																		{!item.product && <span className="text-red-500 text-xs">(produto removido)</span>}
																	</div>
																	<div className="text-right flex-shrink-0 ml-2">
																		<div className="font-medium">
																			{item.quantity} {item.product?.unit || item.productUnit}
																		</div>
																		{itemHasDiscount ? (
																			<div className="space-y-0.5">
																				<div className="text-xs text-gray-400 line-through">
																					R$ {item.totalPrice.toFixed(2)}
																				</div>
																				<div className="text-xs font-medium text-green-600">
																					R$ {itemFinalPrice.toFixed(2)}
																				</div>
																				<div className="text-xs text-green-600">
																					-R$ {(item.totalDiscount || 0).toFixed(2)}
																				</div>
																			</div>
																		) : (
																			<div className="text-xs text-gray-500">
																				R$ {item.unitPrice.toFixed(2)} → R$ {item.totalPrice.toFixed(2)}
																			</div>
																		)}
																	</div>
																</div>
															)
														})}
													</div>
												</div>

												{/* Estatísticas da Compra */}
												<div className={`grid ${hasDiscount ? "grid-cols-4" : "grid-cols-3"} gap-4 mt-4 pt-3 border-t`}>
													<div className="text-center">
														<p className="text-xs text-gray-500">Itens</p>
														<p className="font-semibold">{purchase.items?.length || 0}</p>
													</div>
													<div className="text-center">
														<p className="text-xs text-gray-500">Preço Médio</p>
														<p className="font-semibold">
															R${" "}
															{purchase.items?.length > 0 ? (finalAmount / purchase.items.length).toFixed(2) : "0.00"}
														</p>
													</div>
													{hasDiscount && (
														<div className="text-center">
															<p className="text-xs text-gray-500">Desconto</p>
															<p className="font-semibold text-green-600 flex items-center justify-center gap-1">
																<TrendingDown className="h-3 w-3" />
																R$ {(purchase.totalDiscount || 0).toFixed(2)}
															</p>
														</div>
													)}
													<div className="text-center">
														<p className="text-xs text-gray-500">Total {hasDiscount ? "Final" : ""}</p>
														<p className="font-semibold text-green-600">R$ {finalAmount.toFixed(2)}</p>
													</div>
												</div>
											</CardContent>
										</Card>
									)
								})}

								{(!Array.isArray(filteredPurchases) || filteredPurchases.length === 0) && (
									<div className="text-center py-12">
										<History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
										<h3 className="text-lg font-medium mb-2">
											{searchTerm || dateFilter !== "all" ? "Nenhuma compra encontrada" : "Nenhuma compra realizada"}
										</h3>
										<p className="text-gray-600">
											{searchTerm || dateFilter !== "all"
												? "Tente ajustar os filtros de busca"
												: "Registre a primeira compra neste mercado"}
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	)
}
