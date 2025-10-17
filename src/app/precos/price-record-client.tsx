"use client"

import {
	Activity,
	Calendar,
	Clock,
	DollarSign,
	Filter,
	Package,
	Plus,
	Receipt,
	Search,
	StickyNote,
	Store,
	Target,
	Zap,
} from "lucide-react"
import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { MarketSelect } from "@/components/selects/market-select"
import { MarketSelectDialog } from "@/components/selects/market-select-dialog"
import { ProductSelect } from "@/components/selects/product-select"
import { ProductSelectDialog } from "@/components/selects/product-select-dialog"
import { PriceRecordSkeleton } from "@/components/skeletons/price-record-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PriceTagScanner } from "@/components/price-tag-scanner"
import { useUIPreferences } from "@/hooks"

function PriceAnalysisCard({ className, priceRecords }: { className?: string; priceRecords: PriceRecord[] }) {
	if (priceRecords.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="h-5 w-5" />
						Análise de Preços
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Empty className="border border-dashed py-12">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Activity className="h-6 w-6" />
							</EmptyMedia>
							<EmptyTitle>Sem dados para análise</EmptyTitle>
							<EmptyDescription>
								Registre preços para ver análises detalhadas e comparações entre mercados.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</CardContent>
			</Card>
		)
	}

	// Agrupar por produto
	const productPrices = priceRecords.reduce((acc, record) => {
		if (!acc[record.product]) {
			acc[record.product] = []
		}
		acc[record.product].push(record)
		return acc
	}, {} as Record<string, PriceRecord[]>)

	// Calcular estatísticas por produto
	const productStats = Object.entries(productPrices).map(([product, records]) => {
		const prices = records.map(r => r.price)
		const markets = new Set(records.map(r => r.market))

		return {
			product,
			minPrice: Math.min(...prices),
			maxPrice: Math.max(...prices),
			avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
			variance: Math.max(...prices) - Math.min(...prices),
			recordCount: records.length,
			marketCount: markets.size,
			lastRecord: records.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())[0]
		}
	}).sort((a, b) => b.variance - a.variance)

	// Top produtos com maior variação de preço
	const topVariance = productStats.slice(0, 5)

	// Comparação de preços por mercado
	const marketPrices = priceRecords.reduce((acc, record) => {
		if (!acc[record.market]) {
			acc[record.market] = []
		}
		acc[record.market].push(record.price)
		return acc
	}, {} as Record<string, number[]>)

	const marketStats = Object.entries(marketPrices).map(([market, prices]) => ({
		market,
		avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
		minPrice: Math.min(...prices),
		maxPrice: Math.max(...prices),
		recordCount: prices.length,
	})).sort((a, b) => a.avgPrice - b.avgPrice)

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Produtos com Maior Variação */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Activity className="h-5 w-5" />
						Produtos com Maior Variação de Preço
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{topVariance.map((stat) => (
							<div key={stat.product} className="border rounded-lg p-4">
								<div className="flex justify-between items-start mb-2">
									<div>
										<h4 className="font-semibold">{stat.product}</h4>
										<p className="text-sm text-muted-foreground">
											{stat.recordCount} registros em {stat.marketCount} mercado(s)
										</p>
									</div>
									<Badge variant="destructive">
										Variação: R$ {stat.variance.toFixed(2)}
									</Badge>
								</div>
								<div className="grid grid-cols-3 gap-4 mt-3">
									<div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded">
										<p className="text-xs text-muted-foreground">Menor</p>
										<p className="text-lg font-bold text-green-600">R$ {stat.minPrice.toFixed(2)}</p>
									</div>
									<div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded">
										<p className="text-xs text-muted-foreground">Média</p>
										<p className="text-lg font-bold text-blue-600">R$ {stat.avgPrice.toFixed(2)}</p>
									</div>
									<div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded">
										<p className="text-xs text-muted-foreground">Maior</p>
										<p className="text-lg font-bold text-red-600">R$ {stat.maxPrice.toFixed(2)}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Comparação entre Mercados */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Store className="h-5 w-5" />
						Ranking de Mercados (Menor → Maior Preço Médio)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{marketStats.map((stat, index) => (
							<div key={stat.market} className="flex items-center gap-4 p-3 border rounded-lg">
								<div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
									index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' :
										index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
											'bg-muted text-muted-foreground'
									}`}>
									{index + 1}
								</div>
								<div className="flex-1">
									<h4 className="font-semibold">{stat.market}</h4>
									<p className="text-sm text-muted-foreground">
										{stat.recordCount} registros
									</p>
								</div>
								<div className="text-right">
									<p className="text-lg font-bold text-green-600">R$ {stat.avgPrice.toFixed(2)}</p>
									<p className="text-xs text-muted-foreground">preço médio</p>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function BestDayCard({ className, priceRecords }: { className?: string; priceRecords: PriceRecord[] }) {
	if (priceRecords.length === 0) {
		return (
			<Card className={className}>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Target className="h-5 w-5" />
						Insights de Compra
					</CardTitle>
				</CardHeader>
				<CardContent>
					<Empty className="border border-dashed py-12">
						<EmptyHeader>
							<EmptyMedia variant="icon">
								<Target className="h-6 w-6" />
							</EmptyMedia>
							<EmptyTitle>Sem dados para insights</EmptyTitle>
							<EmptyDescription>
								Registre preços regularmente para receber insights sobre os melhores momentos e lugares para comprar.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				</CardContent>
			</Card>
		)
	}

	// Análise por dia da semana
	const dayOfWeekPrices: Record<number, number[]> = {}
	const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

	priceRecords.forEach(record => {
		const dayOfWeek = new Date(record.recordDate).getDay()
		if (!dayOfWeekPrices[dayOfWeek]) {
			dayOfWeekPrices[dayOfWeek] = []
		}
		dayOfWeekPrices[dayOfWeek].push(record.price)
	})

	const dayStats = Object.entries(dayOfWeekPrices)
		.map(([day, prices]) => ({
			day: parseInt(day),
			dayName: dayNames[parseInt(day)],
			avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
			recordCount: prices.length,
		}))
		.sort((a, b) => a.avgPrice - b.avgPrice)

	const bestDay = dayStats[0]
	const worstDay = dayStats[dayStats.length - 1]

	// Encontrar produtos mais e menos econômicos
	const productAvgPrices = priceRecords.reduce((acc, record) => {
		if (!acc[record.product]) {
			acc[record.product] = { total: 0, count: 0, market: record.market }
		}
		acc[record.product].total += record.price
		acc[record.product].count += 1
		return acc
	}, {} as Record<string, { total: number; count: number; market: string }>)

	const productRanking = Object.entries(productAvgPrices)
		.map(([product, data]) => ({
			product,
			avgPrice: data.total / data.count,
			recordCount: data.count,
			lastMarket: data.market,
		}))
		.sort((a, b) => b.avgPrice - a.avgPrice)

	const mostExpensive = productRanking.slice(0, 3)
	const cheapest = productRanking.slice(-3).reverse()

	// Recomendações por mercado
	const marketBestDeals = priceRecords.reduce((acc, record) => {
		const key = `${record.product}-${record.market}`
		if (!acc[key]) {
			acc[key] = record
		} else if (record.price < acc[key].price) {
			acc[key] = record
		}
		return acc
	}, {} as Record<string, PriceRecord>)

	const bestDeals = Object.values(marketBestDeals)
		.sort((a, b) => a.price - b.price)
		.slice(0, 5)

	return (
		<div className={`space-y-6 ${className}`}>
			{/* Melhor Dia para Comprar */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Calendar className="h-5 w-5" />
						Melhor Dia da Semana para Comprar
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid md:grid-cols-2 gap-4 mb-6">
						<div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
							<div className="flex items-center gap-2 mb-2">
								<div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center">
									👍
								</div>
								<h4 className="font-semibold text-green-900 dark:text-green-100">Melhor Dia</h4>
							</div>
							<p className="text-2xl font-bold text-green-600">{bestDay.dayName}</p>
							<p className="text-sm text-muted-foreground">
								Preço médio: R$ {bestDay.avgPrice.toFixed(2)} ({bestDay.recordCount} registros)
							</p>
						</div>

						<div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border-2 border-red-200 dark:border-red-800">
							<div className="flex items-center gap-2 mb-2">
								<div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center">
									👎
								</div>
								<h4 className="font-semibold text-red-900 dark:text-red-100">Evitar</h4>
							</div>
							<p className="text-2xl font-bold text-red-600">{worstDay.dayName}</p>
							<p className="text-sm text-muted-foreground">
								Preço médio: R$ {worstDay.avgPrice.toFixed(2)} ({worstDay.recordCount} registros)
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<h5 className="font-semibold text-sm">Ranking Completo:</h5>
						{dayStats.map((stat, index) => (
							<div key={stat.day} className="flex items-center justify-between p-2 border rounded">
								<div className="flex items-center gap-2">
									<span className="text-sm font-medium w-6">{index + 1}º</span>
									<span>{stat.dayName}</span>
								</div>
								<div className="text-right">
									<span className="font-semibold">R$ {stat.avgPrice.toFixed(2)}</span>
									<span className="text-xs text-muted-foreground ml-2">({stat.recordCount})</span>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Melhores Ofertas por Produto */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Target className="h-5 w-5" />
						Melhores Ofertas Encontradas
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{bestDeals.map((deal, index) => (
							<div key={deal.id} className="flex items-center gap-4 p-3 border rounded-lg bg-gradient-to-r from-green-50 to-transparent dark:from-green-950">
								<div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
									{index + 1}
								</div>
								<div className="flex-1">
									<h4 className="font-semibold">{deal.product}</h4>
									<div className="flex items-center gap-2 text-sm text-muted-foreground">
										<Store className="h-3 w-3" />
										<span>{deal.market}</span>
										<span>•</span>
										<Calendar className="h-3 w-3" />
										<span>{new Date(deal.recordDate).toLocaleDateString('pt-BR')}</span>
									</div>
								</div>
								<div className="text-right">
									<p className="text-xl font-bold text-green-600">R$ {deal.price.toFixed(2)}</p>
									<Badge variant="outline" className="text-xs">Melhor preço</Badge>
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Produtos Mais e Menos Caros */}
			<div className="grid md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<DollarSign className="h-4 w-4 text-red-600" />
							Produtos Mais Caros
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{mostExpensive.map((product, index) => (
								<div key={product.product} className="flex justify-between items-center p-2 border rounded">
									<div className="flex items-center gap-2">
										<span className="text-xs font-medium w-5">{index + 1}º</span>
										<div>
											<p className="font-medium text-sm">{product.product}</p>
											<p className="text-xs text-muted-foreground">{product.recordCount} registros</p>
										</div>
									</div>
									<span className="font-bold text-red-600">R$ {product.avgPrice.toFixed(2)}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							<DollarSign className="h-4 w-4 text-green-600" />
							Produtos Mais Baratos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{cheapest.map((product, index) => (
								<div key={product.product} className="flex justify-between items-center p-2 border rounded">
									<div className="flex items-center gap-2">
										<span className="text-xs font-medium w-5">{index + 1}º</span>
										<div>
											<p className="font-medium text-sm">{product.product}</p>
											<p className="text-xs text-muted-foreground">{product.recordCount} registros</p>
										</div>
									</div>
									<span className="font-bold text-green-600">R$ {product.avgPrice.toFixed(2)}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

interface PriceRecord {
	id: string
	product: string
	market: string
	price: number
	recordDate: string
	notes?: string
}

interface Product {
	id: string
	name: string
	brand?: { name: string }
	category?: { name: string }
}

interface Market {
	id: string
	name: string
	location?: string
}

interface PriceRecordClientProps {
	initialProducts: Product[]
	initialMarkets: Market[]
}

export function PriceRecordClient({ initialProducts, initialMarkets }: PriceRecordClientProps) {
	const { selectStyle } = useUIPreferences()
	const products = Array.isArray(initialProducts) ? initialProducts : []
	const markets = Array.isArray(initialMarkets) ? initialMarkets : []

	const [priceRecords, setPriceRecords] = useState<PriceRecord[]>([])
	const [loading, setLoading] = useState(false)
	const [initialLoading, setInitialLoading] = useState(true)
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedMarket, setSelectedMarket] = useState("")
	const [selectedProduct, setSelectedProduct] = useState("")

	// Estados para o formulário
	const [price, setPrice] = useState("")
	const [notes, setNotes] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Estados para o scanner
	const [isScannerOpen, setIsScannerOpen] = useState(false)
	const [scannerMarketId, setScannerMarketId] = useState("")

	const [formData, setFormData] = useState({
		productId: "",
		marketId: "",
	})

	// Carregar registros de preços
	const loadPriceRecords = useCallback(async (filters?: { product?: string; market?: string }) => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (filters?.product) params.append("product", filters.product)
			if (filters?.market) params.append("market", filters.market)
			params.append("limit", "100")

			const response = await fetch(`/api/prices/record?${params.toString()}`)
			const data = await response.json()

			if (data.success) {
				setPriceRecords(data.priceRecords)
			} else {
				toast.error("Erro ao carregar registros de preços")
			}
		} catch (_error) {
			toast.error("Erro ao conectar com o servidor")
		} finally {
			setLoading(false)
			setInitialLoading(false)
		}
	}, [])

	// Registrar novo preço
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!formData.productId || !formData.marketId || !price) {
			toast.error("Preencha todos os campos obrigatórios")
			return
		}

		const priceNum = parseFloat(price)
		if (Number.isNaN(priceNum) || priceNum < 0) {
			toast.error("Preço deve ser um número válido maior ou igual a zero")
			return
		}

		// Encontrar produto e mercado pelos IDs
		const selectedProduct = products.find((p) => p.id === formData.productId)
		const selectedMarket = markets.find((m) => m.id === formData.marketId)

		if (!selectedProduct || !selectedMarket) {
			toast.error("Produto ou mercado selecionado é inválido")
			return
		}

		setIsSubmitting(true)
		try {
			const response = await fetch("/api/prices/record", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productName: selectedProduct.name,
					marketName: selectedMarket.name,
					price: priceNum,
					notes: notes.trim() || undefined,
				}),
			})

			const data = await response.json()

			if (data.success) {
				toast.success(data.message)
				setFormData({ productId: "", marketId: "" })
				setPrice("")
				setNotes("")
				loadPriceRecords()
			} else {
				toast.error(data.message || "Erro ao registrar preço")
			}
		} catch (_error) {
			toast.error("Erro ao conectar com o servidor")
		} finally {
			setIsSubmitting(false)
		}
	}

	// Filtrar registros
	const filteredRecords = priceRecords.filter((record) => {
		const matchesSearch =
			!searchTerm ||
			record.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.market.toLowerCase().includes(searchTerm.toLowerCase())

		const matchesMarket =
			!selectedMarket || selectedMarket === "all" || record.market.toLowerCase().includes(selectedMarket.toLowerCase())
		const matchesProduct =
			!selectedProduct ||
			selectedProduct === "all" ||
			record.product.toLowerCase().includes(selectedProduct.toLowerCase())

		return matchesSearch && matchesMarket && matchesProduct
	})

	// Estatísticas
	const stats = {
		totalRecords: priceRecords.length,
		uniqueProducts: new Set(priceRecords.map((r) => r.product)).size,
		uniqueMarkets: new Set(priceRecords.map((r) => r.market)).size,
		avgPrice: priceRecords.length > 0 ? priceRecords.reduce((sum, r) => sum + r.price, 0) / priceRecords.length : 0,
	}

	useEffect(() => {
		loadPriceRecords()
	}, [loadPriceRecords])

	if (initialLoading) {
		return <PriceRecordSkeleton />
	}

	// Função para lidar com resultado do scanner
	const handleScanResult = async (result: { barcode: string; price: number; confidence: number }) => {
		try {
			// Buscar produto pelo código de barras
			const productResponse = await fetch(`/api/products/barcode/${result.barcode}`)

			if (productResponse.ok) {
				const product = await productResponse.json()
				// Produto encontrado - preencher formulário
				setFormData({
					productId: product.id,
					marketId: scannerMarketId,
				})
				setPrice(result.price.toString())
				setNotes(`Registrado via scanner (confiança: ${Math.round(result.confidence * 100)}%)`)

				toast.success(`Produto encontrado: ${product.name}`)
			} else {
				// Produto não encontrado - criar novo produto
				const createProductResponse = await fetch("/api/products", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						name: `Produto ${result.barcode}`,
						barcode: result.barcode,
						description: "Produto criado automaticamente via scanner",
					}),
				})

				if (createProductResponse.ok) {
					const newProduct = await createProductResponse.json()
					setFormData({
						productId: newProduct.id,
						marketId: scannerMarketId,
					})
					setPrice(result.price.toString())
					setNotes(`Produto criado via scanner (confiança: ${Math.round(result.confidence * 100)}%)`)

					toast.success("Novo produto criado e preço preenchido!")
				} else {
					toast.error("Erro ao criar produto automaticamente")
				}
			}

			setIsScannerOpen(false)
		} catch (error) {
			console.error("Erro ao processar resultado do scanner:", error)
			toast.error("Erro ao processar resultado do scanner")
		}
	}

	// Função para abrir scanner com validação de mercado
	const openScanner = () => {
		if (!formData.marketId) {
			toast.error("Selecione um mercado antes de usar o scanner")
			return
		}
		setScannerMarketId(formData.marketId)
		setIsScannerOpen(true)
	}

	return (
		<div className="space-y-6">
			{/* Estatísticas */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total de Registros</p>
								<p className="text-2xl font-bold">{stats.totalRecords}</p>
							</div>
							<Receipt className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Produtos Únicos</p>
								<p className="text-2xl font-bold">{stats.uniqueProducts}</p>
							</div>
							<Package className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Mercados Únicos</p>
								<p className="text-2xl font-bold">{stats.uniqueMarkets}</p>
							</div>
							<Store className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Preço Médio</p>
								<p className="text-2xl font-bold">R$ {stats.avgPrice.toFixed(2)}</p>
							</div>
							<DollarSign className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="new" className="w-full">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="new" className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Novo Registro
					</TabsTrigger>
					<TabsTrigger value="list" className="flex items-center gap-2">
						<Search className="h-4 w-4" />
						Histórico
					</TabsTrigger>
					<TabsTrigger value="analysis" className="flex items-center gap-2">
						<Activity className="h-4 w-4" />
						Análise
					</TabsTrigger>
					<TabsTrigger value="insights" className="flex items-center gap-2">
						<Target className="h-4 w-4" />
						Insights
					</TabsTrigger>
				</TabsList>

				<TabsContent value="new" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Plus className="h-5 w-5" />
								Registrar Novo Preço
							</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="product">Produto *</Label>
										{selectStyle === "dialog" ? (
											<ProductSelectDialog
												value={formData.productId}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, productId: value }))
												}}
												placeholder="Selecione o produto"
											/>
										) : (
											<ProductSelect
												value={formData.productId}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, productId: value }))
												}}
												placeholder="Selecione o produto"
											/>
										)}
									</div>

									<div>
										<Label htmlFor="market">Mercado *</Label>
										{selectStyle === "dialog" ? (
											<MarketSelectDialog
												value={formData.marketId}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, marketId: value }))
												}}
											/>
										) : (
											<MarketSelect
												value={formData.marketId}
												onValueChange={(value) => {
													setFormData((prev) => ({ ...prev, marketId: value }))
												}}
											/>
										)}
									</div>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="price">Valor (R$) *</Label>
										<Input
											id="price"
											type="number"
											step="0.01"
											min="0"
											value={price}
											onChange={(e) => setPrice(e.target.value)}
											placeholder="0,00"
											required
										/>
									</div>

									<div>
										<Label htmlFor="notes">Observações (opcional)</Label>
										<Input
											id="notes"
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											placeholder="Ex: Promoção, produto vencendo..."
										/>
									</div>
								</div>

								{/* Scanner Button */}
								<div className="flex flex-col sm:flex-row gap-2">
									<Button type="submit" disabled={isSubmitting} className="flex-1">
										{isSubmitting ? "Registrando..." : "Registrar Preço"}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={openScanner}
										disabled={isSubmitting}
										className="flex items-center gap-2"
									>
										<Zap className="h-4 w-4" />
										Scanner IA
									</Button>
								</div>

								{/* Instruções do Scanner */}
								<div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
									<div className="flex items-start gap-3">
										<Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
										<div>
											<h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
												Scanner de Etiquetas com IA
											</h4>
											<p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
												Use o scanner para registrar preços automaticamente através de fotos de etiquetas.
											</p>
											<ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
												<li>• Selecione o mercado antes de usar o scanner</li>
												<li>• Posicione a etiqueta dentro da área destacada</li>
												<li>• Certifique-se de que código de barras e preço estejam visíveis</li>
												<li>• O produto será criado automaticamente se não existir</li>
											</ul>
										</div>
									</div>
								</div>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="list" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Filter className="h-5 w-5" />
								Filtros
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<Label htmlFor="search">Buscar</Label>
									<div className="relative">
										<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
										<Input
											id="search"
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											placeholder="Produto ou mercado..."
											className="pl-10"
										/>
									</div>
								</div>

								<div>
									<Label htmlFor="filterMarket">Mercado</Label>
									<Select value={selectedMarket} onValueChange={setSelectedMarket}>
										<SelectTrigger>
											<SelectValue placeholder="Todos os mercados" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos os mercados</SelectItem>
											{Array.from(new Set(priceRecords?.map((r) => r.market) || []))
												.filter(Boolean)
												.map((market) => (
													<SelectItem key={market} value={market}>
														{market}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>

								<div>
									<Label htmlFor="filterProduct">Produto</Label>
									<Select value={selectedProduct} onValueChange={setSelectedProduct}>
										<SelectTrigger>
											<SelectValue placeholder="Todos os produtos" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos os produtos</SelectItem>
											{Array.from(new Set(priceRecords?.map((r) => r.product) || []))
												.filter(Boolean)
												.map((product) => (
													<SelectItem key={product} value={product}>
														{product}
													</SelectItem>
												))}
										</SelectContent>
									</Select>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="h-5 w-5" />
								Histórico de Preços ({filteredRecords.length})
							</CardTitle>
						</CardHeader>
						<CardContent>
							{loading ? (
								<div className="text-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
									<p className="text-muted-foreground mt-2">Carregando...</p>
								</div>
							) : filteredRecords.length === 0 ? (
								priceRecords.length > 0 ? (
									<Empty className="border border-dashed py-12">
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<Receipt className="h-6 w-6" />
											</EmptyMedia>
											<EmptyTitle>Nenhum registro encontrado</EmptyTitle>
											<EmptyDescription>Tente ajustar os filtros para encontrar registros.</EmptyDescription>
										</EmptyHeader>
									</Empty>
								) : (
									<Empty className="border border-dashed py-12">
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<Receipt className="h-6 w-6" />
											</EmptyMedia>
											<EmptyTitle>Nenhum preço registrado</EmptyTitle>
											<EmptyDescription>
												Comece registrando preços de produtos para acompanhar variações e encontrar as melhores ofertas.
											</EmptyDescription>
										</EmptyHeader>
									</Empty>
								)
							) : (
								<div className="space-y-4">
									{filteredRecords.map((record) => (
										<div key={record.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
											<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
												<div className="space-y-1">
													<div className="flex items-center gap-2">
														<h3 className="font-semibold">{record.product}</h3>
														<Badge variant="outline">{record.market}</Badge>
													</div>
													<div className="flex items-center gap-4 text-sm text-muted-foreground">
														<span className="flex items-center gap-1">
															<Calendar className="h-3 w-3" />
															{new Date(record.recordDate).toLocaleDateString("pt-BR")}
														</span>
														{record.notes && (
															<span className="flex items-center gap-1">
																<StickyNote className="h-3 w-3" />
																{record.notes}
															</span>
														)}
													</div>
												</div>

												<div className="flex items-center gap-2">
													<div className="text-right">
														<p className="text-2xl font-bold text-green-600">R$ {record.price.toFixed(2)}</p>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="analysis" className="space-y-6">
					<PriceAnalysisCard className="w-full" priceRecords={priceRecords} />
				</TabsContent>

				<TabsContent value="insights" className="space-y-6">
					<BestDayCard className="w-full" priceRecords={priceRecords} />
				</TabsContent>
			</Tabs>

			{/* Price Tag Scanner */}
			<PriceTagScanner
				isOpen={isScannerOpen}
				onClose={() => setIsScannerOpen(false)}
				onScan={handleScanResult}
				marketId={scannerMarketId}
			/>
		</div>
	)
}
