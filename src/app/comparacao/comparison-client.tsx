"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@radix-ui/react-popover"
import { CommandGroup, CommandItem, CommandList } from "cmdk"
import {
	Check,
	ChevronDown,
	ChevronUp,
	Command,
	Loader2,
	MapPin,
	Search,
	ShoppingCart,
	Target,
	TrendingDown,
	TrendingUp,
	X,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ProductSelect } from "@/components/selects/product-select"
import { ShoppingListSelect } from "@/components/selects/shopping-list-select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select" // Assumindo um multi-select
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TempStorage } from "@/lib/temp-storage"
import { cn } from "@/lib/utils"
import type { ShoppingList } from "@/types"

interface PriceComparison {
	productId: string
	productName: string
	brandName?: string
	unit: string
	markets: {
		marketId: string
		marketName: string
		location?: string
		currentPrice: number
		lastPurchase: string
		priceTrend: "up" | "down" | "stable"
		priceChange: number
	}[]
}

interface ListComparison {
	listId: string
	listName: string
	markets: {
		marketId: string
		marketName: string
		location?: string
		totalPrice: number
		availableItems: number
		missingItems: number
		savings: number
		items: {
			listItemId: string
			productId: string
			productName: string
			quantity: number
			unitPrice: number | null
			totalPrice: number
			available: boolean
		}[]
	}[]
	analysis: {
		bestMarket: {
			marketId: string
		} | null
	}
}

interface DetailedComparison {
	listId: string
	listName: string
	markets: {
		id: string
		name: string
		location?: string
	}[]
	products: {
		product: {
			id: string
			name: string
			brand?: { name: string }
			unit: string
		}
		comparison: {
			marketId: string
			price: number | null
			lastPurchase: string | null
			isCheapest: boolean
			saving: number
		}[]
	}[]
}

interface ComparisonClientProps {
	initialLists: ShoppingList[]
	initialMarkets: any[]
	initialProducts: any[]
	searchParams: {
		lista?: string
	}
}

export function ComparisonClient({
	initialLists,
	initialMarkets,
	initialProducts,
	searchParams,
}: ComparisonClientProps) {
	const nextSearchParams = useSearchParams()
	const listaParam = searchParams.lista
	const [activeTab, setActiveTab] = useState(listaParam ? "lista" : "produto")
	const [lists, setLists] = useState<ShoppingList[]>(initialLists)
	const [markets, setMarkets] = useState<any[]>(initialMarkets)
	const [products, setProducts] = useState<any[]>(initialProducts)

	const [selectedProductId, setSelectedProductId] = useState("")
	const [productComparison, setProductComparison] = useState<PriceComparison | null>(null)
	const [loadingProduct, setLoadingProduct] = useState(false)

	const [selectedListId, setSelectedListId] = useState("")
	const [listComparison, setListComparison] = useState<ListComparison | null>(null)
	const [loadingList, setLoadingList] = useState(false)
	const [expandedMarket, setExpandedMarket] = useState<string | null>(null)

	// Novos estados para a comparação detalhada
	const [detailedListId, setDetailedListId] = useState("")
	const [selectedMarketIds, setSelectedMarketIds] = useState<string[]>([])
	const [detailedComparison, setDetailedComparison] = useState<DetailedComparison | null>(null)
	const [loadingDetailed, setLoadingDetailed] = useState(false)

	useEffect(() => {
		if (listaParam && lists.length > 0) {
			setSelectedListId(listaParam)
			setDetailedListId(listaParam)
			const listExists = lists.find((list) => list.id === listaParam)
			if (listExists) {
				compareList()
			}
		}
	}, [listaParam, lists])

	useEffect(() => {
		const storageKey = nextSearchParams.get("storageKey")
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey)
			if (preservedData) {
				try {
					if (preservedData.selectedProductId) {
						setSelectedProductId(preservedData.selectedProductId)
					}
					if (preservedData.selectedListId) {
						setSelectedListId(preservedData.selectedListId)
					}
					if (preservedData.activeTab) {
						setActiveTab(preservedData.activeTab)
					}
					if (preservedData.newProductId) {
						setTimeout(() => {
							setSelectedProductId(preservedData.newProductId)
						}, 1000)
					}
					TempStorage.remove(storageKey)
					window.history.replaceState({}, "", "/comparacao")
				} catch (error) {
					console.error("Erro ao restaurar dados:", error)
					TempStorage.remove(storageKey)
				}
			}
		}
	}, [nextSearchParams])

	const compareProduct = async () => {
		if (!selectedProductId) {
			toast.error("Selecione um produto para comparar")
			return
		}
		setLoadingProduct(true)
		try {
			const response = await fetch("/api/price-comparison/product", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId: selectedProductId }),
			})
			if (response.ok) {
				const data = await response.json()
				setProductComparison(data)
			} else {
				toast.error("Erro ao buscar comparação de preços")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao comparar preços")
		} finally {
			setLoadingProduct(false)
		}
	}

	const compareList = async () => {
		if (!selectedListId) {
			toast.error("Selecione uma lista para comparar")
			return
		}
		setLoadingList(true)
		try {
			const response = await fetch("/api/price-comparison/list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ listId: selectedListId }),
			})
			if (response.ok) {
				const data = await response.json()
				setListComparison(data)
			} else {
				toast.error("Erro ao buscar comparação de lista")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao comparar lista")
		} finally {
			setLoadingList(false)
		}
	}

	const compareDetailedList = async () => {
		if (!detailedListId) {
			toast.error("Selecione uma lista para comparar")
			return
		}
		if (selectedMarketIds.length < 2) {
			toast.error("Selecione pelo menos 2 mercados para a comparação detalhada")
			return
		}

		setLoadingDetailed(true)
		setDetailedComparison(null)

		try {
			const response = await fetch("/api/price-comparison/detailed-list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listId: detailedListId,
					marketIds: selectedMarketIds,
				}),
			})
			if (response.ok) {
				const data = await response.json()
				setDetailedComparison(data)
			} else {
				toast.error("Erro ao buscar comparação detalhada")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao comparar lista detalhada")
		} finally {
			setLoadingDetailed(false)
		}
	}

	const getBestPrice = (markets: any[]) => {
		if (markets.length === 0) return null
		return markets.reduce((best, current) => (current.currentPrice < best.currentPrice ? current : best))
	}

	const getWorstPrice = (markets: any[]) => {
		if (markets.length === 0) return null
		return markets.reduce((worst, current) => (current.currentPrice > worst.currentPrice ? current : worst))
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Comparação de Preços</h1>
				<p className="text-gray-600 mt-2">Compare preços entre mercados para economizar nas suas compras</p>
			</div>
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="produto">Por Produto</TabsTrigger>
					<TabsTrigger value="lista">Resumo da Lista</TabsTrigger>
					<TabsTrigger value="detalhada">Comparação Detalhada</TabsTrigger>
				</TabsList>
				<TabsContent value="produto" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Search className="h-5 w-5" />
								Comparar Produto
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex gap-4">
								<div className="flex-1">
									<Label>Selecione um Produto</Label>
									<ProductSelect
										value={selectedProductId}
										onValueChange={setSelectedProductId}
										placeholder="Buscar produto..."
										products={products}
										preserveFormData={{
											selectedProductId,
											selectedListId,
											activeTab,
											returnContext: "comparacao",
										}}
									/>
								</div>
								<div className="flex items-end">
									<Button onClick={compareProduct} disabled={loadingProduct}>
										{loadingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comparar"}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
					{productComparison && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Target className="h-5 w-5" />
									{productComparison.productName}
									{productComparison.brandName && <Badge variant="secondary">{productComparison.brandName}</Badge>}
								</CardTitle>
							</CardHeader>
							<CardContent>
								{productComparison.markets.length === 0 ? (
									<div className="text-center py-8 text-gray-500">
										<Target className="h-12 w-12 mx-auto mb-4" />
										<p>Nenhum preço encontrado para este produto</p>
									</div>
								) : (
									<div className="space-y-4">
										{productComparison.markets
											.sort((a, b) => a.currentPrice - b.currentPrice)
											.map((market, index) => {
												const best = getBestPrice(productComparison.markets)
												const worst = getWorstPrice(productComparison.markets)
												const isBest = market.marketId === best?.marketId
												const isWorst = market.marketId === worst?.marketId
												return (
													<div
														key={market.marketId}
														className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
															isBest
																? "bg-green-50 border-green-200"
																: isWorst
																	? "bg-red-50 border-red-200"
																	: "bg-gray-50"
														}`}
													>
														<div>
															<div className="flex items-center gap-2">
																<h4 className="font-medium">{market.marketName}</h4>
																{isBest && <Badge className="bg-green-500">Melhor Preço</Badge>}
																{isWorst && <Badge variant="destructive">Mais Caro</Badge>}
															</div>
															<div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
																{market.location && (
																	<>
																		<MapPin className="h-3 w-3" />
																		<span>{market.location}</span>
																	</>
																)}
																<span className="ml-2">
																	Última compra: {new Date(market.lastPurchase).toLocaleDateString("pt-BR")}
																</span>
															</div>
														</div>
														<div className="text-right">
															<div className="text-xl font-bold">
																R$ {market.currentPrice.toFixed(2)}
																<span className="text-sm font-normal text-gray-500">/{productComparison.unit}</span>
															</div>
															<div className="flex items-center justify-end gap-1 text-sm mt-1">
																{market.priceTrend === "up" && (
																	<>
																		<TrendingUp className="h-3 w-3 text-red-500" />
																		<span className="text-red-500">+{market.priceChange.toFixed(1)}%</span>
																	</>
																)}
																{market.priceTrend === "down" && (
																	<>
																		<TrendingDown className="h-3 w-3 text-green-500" />
																		<span className="text-green-500">-{market.priceChange.toFixed(1)}%</span>
																	</>
																)}
																{market.priceTrend === "stable" && <span className="text-gray-500">Estável</span>}
															</div>
														</div>
													</div>
												)
											})}
										{productComparison.markets.length > 1 && (
											<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
												<h4 className="font-medium text-blue-800 mb-2">💰 Economia Potencial</h4>
												<p className="text-blue-600 text-sm">
													Comprando no <strong>{getBestPrice(productComparison.markets)?.marketName}</strong>, você
													economiza
													<strong>
														{" "}
														R${" "}
														{(
															getWorstPrice(productComparison.markets)!.currentPrice -
															getBestPrice(productComparison.markets)!.currentPrice
														).toFixed(2)}
													</strong>{" "}
													por {productComparison.unit}
												</p>
											</div>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</TabsContent>
				<TabsContent value="lista" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShoppingCart className="h-5 w-5" />
								Comparar Lista de Compras
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex gap-4">
								<div className="flex-1">
									<Label>Selecione uma Lista</Label>
									<ShoppingListSelect
										value={selectedListId}
										onValueChange={setSelectedListId}
										placeholder="Selecionar lista..."
									/>
								</div>
								<div className="flex items-end">
									<Button onClick={compareList} disabled={loadingList}>
										{loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comparar"}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
					{listComparison && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<ShoppingCart className="h-5 w-5" />
										{listComparison.listName}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{(() => {
											const cheapestTotal = listComparison.markets
												.filter((m) => m.availableItems > 0)
												.reduce(
													(min, curr) => (curr.totalPrice < min.totalPrice ? curr : min),
													listComparison.markets.find((m) => m.availableItems > 0) || {
														totalPrice: Infinity,
														marketId: "",
														marketName: "",
														availableItems: 0,
														missingItems: 0,
														savings: 0,
														items: [],
													},
												)

											return listComparison.markets
												.sort((a, b) => {
													if (a.availableItems === 0 && b.availableItems > 0) return 1
													if (a.availableItems > 0 && b.availableItems === 0) return -1
													return a.totalPrice - b.totalPrice
												})
												.map((market, index) => {
													const isExpanded = expandedMarket === market.marketId
													const isCheapest = market.marketId === cheapestTotal.marketId && market.availableItems > 0
													return (
														<div
															key={market.marketId}
															className={cn(
																"p-4 rounded-lg border transition-colors cursor-pointer",
																isCheapest ? "bg-green-50 border-green-200" : "bg-gray-50",
															)}
															onClick={() => setExpandedMarket(isExpanded ? null : market.marketId)}
														>
															<div className="flex items-start justify-between">
																<div>
																	<div className="flex items-center gap-2">
																		<h4 className="font-medium">{market.marketName}</h4>
																		{isCheapest && <Badge className="bg-green-500">Mais Barato</Badge>}
																	</div>
																	<div className="text-sm text-gray-600 mt-1">
																		{market.location && (
																			<div className="flex items-center gap-1">
																				<MapPin className="h-3 w-3" />
																				<span>{market.location}</span>
																			</div>
																		)}
																		<div className="mt-1">
																			{market.availableItems} itens disponíveis • {market.missingItems} não encontrados
																		</div>
																	</div>
																</div>
																<div className="text-right">
																	<div className="text-xl font-bold">R$ {market.totalPrice.toFixed(2)}</div>
																	{market.savings > 0 && (
																		<div className="text-sm text-green-600">
																			Economiza R$ {market.savings.toFixed(2)}
																		</div>
																	)}
																	<Button variant="ghost" size="icon" className="h-auto w-auto mt-2">
																		{isExpanded ? (
																			<ChevronUp className="h-4 w-4" />
																		) : (
																			<ChevronDown className="h-4 w-4" />
																		)}
																	</Button>
																</div>
															</div>

															{isExpanded && (
																<div className="mt-4 pt-4 border-t">
																	<h5 className="text-sm font-medium mb-2">Produtos da Lista</h5>
																	<div className="space-y-2">
																		{market.items.map((item) => (
																			<div
																				key={item.listItemId}
																				className={cn(
																					"flex justify-between p-2 rounded-lg text-sm",
																					item.available ? "bg-white border" : "bg-gray-200 text-gray-600",
																				)}
																			>
																				<div className="flex items-center gap-2">
																					{item.available ? (
																						<ShoppingCart className="h-4 w-4 text-green-500" />
																					) : (
																						<X className="h-4 w-4 text-red-500" />
																					)}
																					<div>
																						<div className="font-medium">{item.productName}</div>
																						{item.unitPrice && (
																							<div className="text-xs text-muted-foreground">
																								{item.quantity} x R$ {item.unitPrice.toFixed(2)}
																							</div>
																						)}
																					</div>
																				</div>
																				<div className="text-right">
																					<div className="font-semibold">
																						{item.unitPrice ? `R$ ${item.totalPrice.toFixed(2)}` : "Não Encontrado"}
																					</div>
																				</div>
																			</div>
																		))}
																	</div>
																</div>
															)}
														</div>
													)
												})
										})()}
										{(() => {
											const cheapestTotal = listComparison.markets
												.filter((m) => m.availableItems > 0)
												.reduce(
													(min, curr) => (curr.totalPrice < min.totalPrice ? curr : min),
													listComparison.markets.find((m) => m.availableItems > 0) || {
														totalPrice: Infinity,
														marketId: "",
														marketName: "",
														availableItems: 0,
														missingItems: 0,
														savings: 0,
														items: [],
													},
												)

											return (
												listComparison.markets.length > 1 && (
													<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
														<h4 className="font-medium text-blue-800 mb-2">💡 Recomendação</h4>
														<p className="text-blue-600 text-sm">
															Comprando no <strong>{cheapestTotal.marketName}</strong>, você economiza{" "}
															<strong>
																R${" "}
																{(
																	Math.max(...listComparison.markets.map((m) => m.totalPrice)) -
																	Math.min(...listComparison.markets.map((m) => m.totalPrice))
																).toFixed(2)}
															</strong>{" "}
															comparado ao mercado mais caro.
														</p>
													</div>
												)
											)
										})()}
									</div>
								</CardContent>
							</Card>
						</div>
					)}
				</TabsContent>
				{/* Nova Aba de Comparação Detalhada */}
				<TabsContent value="detalhada" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Search className="h-5 w-5" />
								Comparar Listas e Mercados
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="detailedListSelect">Selecione uma Lista</Label>
									<ShoppingListSelect
										value={detailedListId}
										onValueChange={setDetailedListId}
										placeholder="Selecionar lista..."
										className="w-full"
									/>
								</div>
								<div className="space-y-2">
									<Label>Selecione os Mercados</Label>
									<MultiSelect
										options={markets.map((m) => ({
											value: m.id,
											label: m.name,
										}))}
										selected={selectedMarketIds}
										onSelectedChange={setSelectedMarketIds}
										placeholder="Selecione mercados..."
									/>
								</div>
							</div>
							<div className="flex justify-end">
								<Button
									onClick={compareDetailedList}
									disabled={loadingDetailed || selectedMarketIds.length < 2 || !detailedListId}
								>
									{loadingDetailed ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comparar Detalhadamente"}
								</Button>
							</div>
						</CardContent>
					</Card>

					{detailedComparison && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingCart className="h-5 w-5" />
									{detailedComparison.listName}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="w-full text-left table-fixed">
										<thead>
											<tr className="border-b">
												<th className="w-64 p-2 text-sm font-medium">Produto</th>
												{detailedComparison.markets.map((market) => (
													<th key={market.id} className="p-2 text-sm font-medium">
														{market.name}
													</th>
												))}
											</tr>
										</thead>
										<tbody>
											{detailedComparison.products.map((productItem) => (
												<tr key={productItem.product?.id} className="border-b last:border-b-0">
													<td className="p-2 text-sm font-medium">{productItem.product?.name}</td>
													{productItem.comparison.map((comp) => (
														<td key={comp.marketId} className="p-2">
															{comp.price !== null ? (
																<div className="flex flex-col">
																	<span
																		className={cn(
																			"font-semibold",
																			comp.isCheapest ? "text-green-600" : "text-foreground",
																		)}
																	>
																		R$ {comp.price.toFixed(2)}
																	</span>
																	{comp.saving > 0 && (
																		<span className="text-xs text-red-500">
																			(Economia: R$ {comp.saving.toFixed(2)})
																		</span>
																	)}
																</div>
															) : (
																<span className="text-sm text-gray-500">Não encontrado</span>
															)}
														</td>
													))}
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	)
}
