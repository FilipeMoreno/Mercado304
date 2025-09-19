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
} from "lucide-react"
import type React from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MarketSelect } from "@/components/selects/market-select"
import { ProductSelect } from "@/components/selects/product-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMarketsQuery, useProductsQuery } from "@/hooks/use-react-query"

function PriceAnalysisCard({ className }: { className?: string }) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Activity className="h-5 w-5" />
					Análise de Preços
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-center text-muted-foreground py-8">
					<p>O componente de análise de preços será exibido aqui.</p>
					<p className="text-sm">Esta é uma área reservada para gráficos e estatísticas detalhadas.</p>
				</div>
			</CardContent>
		</Card>
	)
}

function BestDayCard({ className }: { className?: string }) {
	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-5 w-5" />
					Insights de Compra
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="text-center text-muted-foreground py-8">
					<p>O componente de insights sobre os melhores dias para compra será exibido aqui.</p>
					<p className="text-sm">Esta é uma área reservada para sugestões baseadas nos dados coletados.</p>
				</div>
			</CardContent>
		</Card>
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

export function PriceRecordClient() {
	const { data: productsData } = useProductsQuery()
	const { data: marketsData } = useMarketsQuery()

	const products = productsData?.products || []
	const markets = marketsData?.markets || []

	const [priceRecords, setPriceRecords] = useState<PriceRecord[]>([])
	const [loading, setLoading] = useState(false)
	const [searchTerm, setSearchTerm] = useState("")
	const [selectedMarket, setSelectedMarket] = useState("")
	const [selectedProduct, setSelectedProduct] = useState("")

	// Estados para o formulário
	const [price, setPrice] = useState("")
	const [notes, setNotes] = useState("")
	const [isSubmitting, setIsSubmitting] = useState(false)

	const [formData, setFormData] = useState({
		productId: "",
		marketId: "",
	})

	// Carregar registros de preços
	const loadPriceRecords = async (filters?: { product?: string; market?: string }) => {
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
		}
	}

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

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">Registro de Preços</h1>
					<p className="text-muted-foreground">Registre preços que você viu mas não comprou para futuras comparações</p>
				</div>
			</div>

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
										<ProductSelect
											value={formData.productId}
											onValueChange={(value) => {
												setFormData((prev) => ({ ...prev, productId: value }))
											}}
											placeholder="Selecione o produto"
										/>
									</div>

									<div>
										<Label htmlFor="market">Mercado *</Label>
										<MarketSelect
											value={formData.marketId}
											onValueChange={(value) => {
												setFormData((prev) => ({ ...prev, marketId: value }))
											}}
										/>
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

								<Button type="submit" disabled={isSubmitting} className="w-full">
									{isSubmitting ? "Registrando..." : "Registrar Preço"}
								</Button>
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
								<div className="text-center py-8">
									<Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
									<p className="text-muted-foreground">Nenhum registro encontrado</p>
									{priceRecords.length > 0 && (
										<p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros</p>
									)}
								</div>
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
					<PriceAnalysisCard className="w-full" />
				</TabsContent>

				<TabsContent value="insights" className="space-y-6">
					<BestDayCard className="w-full" />
				</TabsContent>
			</Tabs>
		</div>
	)
}
