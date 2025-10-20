"use client"

import {
	AlertCircle,
	Car,
	CheckCircle2,
	Clock,
	DollarSign,
	Home,
	Loader2,
	MapPin,
	Navigation,
	Package,
	Store,
	TrendingDown,
} from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Separator } from "@/components/ui/separator"

interface OptimizedRouteItem {
	itemId: string
	productId: string
	productName: string
	quantity: number
	bestPrice: number
	estimatedTotal: number
	averagePrice?: number
	savings?: number
}

interface OptimizedMarket {
	marketId: string
	marketName: string
	marketLocation?: string | null
	items: OptimizedRouteItem[]
	totalCost: number
	estimatedSavings: number
	itemCount: number
	distanceKm?: number
	durationMinutes?: number
	order?: number
}

interface AIAnalysis {
	worthIt: boolean
	summary: string
	factors: {
		totalSavings: number
		estimatedFuelCost: number
		estimatedTimeCost: number
		netBenefit: number
	}
	recommendation: string
}

interface OptimizedRouteData {
	listName: string
	optimizedRoute: OptimizedMarket[]
	totalEstimatedSavings: number
	totalDistanceKm?: number
	totalDurationMinutes?: number
	aiAnalysis?: AIAnalysis
	summary: {
		totalMarkets: number
		totalItems: number
		itemsDistributed: number
	}
}

interface OptimizedShoppingRouteProps {
	listId: string
	listName: string
	isOpen: boolean
	onClose: () => void
}

export function OptimizedShoppingRoute({ listId, listName, isOpen, onClose }: OptimizedShoppingRouteProps) {
	const [loading, setLoading] = useState(false)
	const [routeData, setRouteData] = useState<OptimizedRouteData | null>(null)
	const [selectedMarkets, setSelectedMarkets] = useState<string[]>([])
	const [userAddress, setUserAddress] = useState("")
	const [hasCalculatedRoute, setHasCalculatedRoute] = useState(false)
	const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
	const addressInputId = useId()

	const fetchOptimizedRoute = useCallback(async () => {
		setLoading(true)
		setHasCalculatedRoute(false)
		try {
			const response = await fetch(`/api/shopping-lists/${listId}/optimize-route`)

			if (!response.ok) {
				throw new Error("Erro ao otimizar roteiro")
			}

			const data = await response.json()
			setRouteData(data)

			// Inicialmente, selecionar todos os mercados
			setSelectedMarkets(data.optimizedRoute.map((market: OptimizedMarket) => market.marketId))
		} catch (error) {
			console.error("Erro ao buscar roteiro otimizado:", error)
			toast.error("Erro ao calcular roteiro otimizado")
		} finally {
			setLoading(false)
		}
	}, [listId])

	useEffect(() => {
		if (isOpen && listId) {
			// Buscar roteiro básico (sem distâncias)
			fetchOptimizedRoute()
			// Tentar carregar endereço salvo do localStorage
			const savedAddress = localStorage.getItem("userAddress")
			if (savedAddress) {
				setUserAddress(savedAddress)
			}
		}
	}, [isOpen, listId, fetchOptimizedRoute])

	const calculateRouteWithDistances = async () => {
		if (!userAddress.trim()) {
			toast.error("Por favor, insira seu endereço")
			return
		}

		setIsCalculatingRoute(true)
		try {
			// Salvar endereço no localStorage para futuros usos
			localStorage.setItem("userAddress", userAddress)

			const response = await fetch(`/api/shopping-lists/${listId}/optimize-route-with-distances`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userAddress,
					selectedMarketIds: selectedMarkets,
				}),
			})

			if (!response.ok) {
				throw new Error("Erro ao calcular distâncias")
			}

			const data = await response.json()
			setRouteData(data)
			setHasCalculatedRoute(true)
			toast.success("Roteiro otimizado com distâncias calculado!")
		} catch (error) {
			console.error("Erro ao calcular distâncias:", error)
			toast.error("Erro ao calcular distâncias. Verifique se o endereço está correto.")
		} finally {
			setIsCalculatingRoute(false)
		}
	}

	const toggleMarketSelection = (marketId: string) => {
		setSelectedMarkets((prev) => (prev.includes(marketId) ? prev.filter((id) => id !== marketId) : [...prev, marketId]))
	}

	const getSelectedSummary = () => {
		if (!routeData) return { totalCost: 0, totalSavings: 0, totalItems: 0 }

		const selectedMarketData = routeData.optimizedRoute.filter((market) => selectedMarkets.includes(market.marketId))

		return {
			totalCost: selectedMarketData.reduce((sum, market) => sum + market.totalCost, 0),
			totalSavings: selectedMarketData.reduce((sum, market) => sum + market.estimatedSavings, 0),
			totalItems: selectedMarketData.reduce((sum, market) => sum + market.itemCount, 0),
		}
	}

	const selectedSummary = getSelectedSummary()

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			title={`Roteiro Otimizado - ${listName}`}
			maxWidth="2xl"
			maxHeight={true}
		>
			<div className="space-y-4 px-1 sm:px-0">
				{loading ? (
					<div className="flex flex-col items-center justify-center py-12 gap-3">
						<Loader2 className="size-8 animate-spin text-blue-600" />
						<span className="text-base sm:text-lg">Calculando melhor roteiro...</span>
					</div>
				) : routeData ? (
					<div className="space-y-4 sm:space-y-6">
						{/* Campo de Endereço */}
						<Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
							<CardContent className="pt-4 sm:pt-6">
								<div className="space-y-3">
									<div className="flex items-center gap-2">
										<Home className="size-5 text-blue-600" />
										<Label htmlFor={addressInputId} className="text-sm sm:text-base font-semibold text-blue-900">
											Seu Endereço
										</Label>
									</div>
									<div className="flex flex-col sm:flex-row gap-2">
										<Input
											id={addressInputId}
											type="text"
											placeholder="Ex: Rua das Flores, 123 - Centro, Curitiba - PR"
											value={userAddress}
											onChange={(e) => setUserAddress(e.target.value)}
											className="flex-1 text-sm sm:text-base"
											disabled={isCalculatingRoute}
										/>
										<Button
											onClick={calculateRouteWithDistances}
											disabled={isCalculatingRoute || !userAddress.trim()}
											className="w-full sm:w-auto"
										>
											{isCalculatingRoute ? (
												<>
													<Loader2 className="size-4 mr-2 animate-spin" />
													Calculando...
												</>
											) : (
												<>
													<Car className="size-4 mr-2" />
													Calcular Rota
												</>
											)}
										</Button>
									</div>
									<p className="text-xs sm:text-sm text-blue-700">
										Informe seu endereço para calcular a melhor rota, distâncias e análise de custo-benefício
									</p>
								</div>
							</CardContent>
						</Card>

						{/* Análise de IA (se disponível) */}
						{routeData.aiAnalysis && hasCalculatedRoute && (
							<Card
								className={`${routeData.aiAnalysis.worthIt ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}
							>
								<CardContent className="pt-4 sm:pt-6">
									<div className="space-y-3">
										<div className="flex items-start gap-3">
											<AlertCircle
												className={`h-5 w-5 mt-0.5 ${routeData.aiAnalysis.worthIt ? "text-green-600" : "text-orange-600"}`}
											/>
											<div className="flex-1">
												<h3
													className={`font-semibold text-sm sm:text-base ${routeData.aiAnalysis.worthIt ? "text-green-900" : "text-orange-900"}`}
												>
													Análise de Custo-Benefício
												</h3>
												<p
													className={`text-xs sm:text-sm mt-1 ${routeData.aiAnalysis.worthIt ? "text-green-700" : "text-orange-700"}`}
												>
													{routeData.aiAnalysis.summary}
												</p>
											</div>
										</div>
										<Separator />
										<div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
											<div>
												<p className="text-gray-600">Economia em Produtos:</p>
												<p className="font-semibold text-green-600">
													R$ {routeData.aiAnalysis.factors.totalSavings.toFixed(2)}
												</p>
											</div>
											<div>
												<p className="text-gray-600">Custo de Combustível:</p>
												<p className="font-semibold text-red-600">
													-R$ {routeData.aiAnalysis.factors.estimatedFuelCost.toFixed(2)}
												</p>
											</div>
											<div>
												<p className="text-gray-600">Custo de Tempo:</p>
												<p className="font-semibold text-red-600">
													-R$ {routeData.aiAnalysis.factors.estimatedTimeCost.toFixed(2)}
												</p>
											</div>
											<div>
												<p className="text-gray-600">Benefício Líquido:</p>
												<p
													className={`font-semibold ${routeData.aiAnalysis.factors.netBenefit > 0 ? "text-green-600" : "text-red-600"}`}
												>
													R$ {routeData.aiAnalysis.factors.netBenefit.toFixed(2)}
												</p>
											</div>
										</div>
										<div
											className={`p-3 rounded-lg ${routeData.aiAnalysis.worthIt ? "bg-green-100" : "bg-orange-100"}`}
										>
											<p
												className={`text-xs sm:text-sm font-medium ${routeData.aiAnalysis.worthIt ? "text-green-900" : "text-orange-900"}`}
											>
												💡 {routeData.aiAnalysis.recommendation}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Resumo Geral */}
						<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
							<Card>
								<CardContent className="pt-4 sm:pt-6">
									<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
										<Store className="size-4 sm:h-5 sm:w-5 text-blue-600" />
										<div>
											<div className="text-xl sm:text-2xl font-bold">{routeData.summary.totalMarkets}</div>
											<div className="text-xs sm:text-sm text-gray-600">Mercados</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="pt-4 sm:pt-6">
									<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
										<Package className="size-4 sm:h-5 sm:w-5 text-green-600" />
										<div>
											<div className="text-xl sm:text-2xl font-bold">{selectedSummary.totalItems}</div>
											<div className="text-xs sm:text-sm text-gray-600">Itens</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="pt-4 sm:pt-6">
									<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
										<DollarSign className="size-4 sm:h-5 sm:w-5 text-purple-600" />
										<div>
											<div className="text-lg sm:text-xl md:text-2xl font-bold">
												R$ {selectedSummary.totalCost.toFixed(2)}
											</div>
											<div className="text-xs sm:text-sm text-gray-600">Custo Total</div>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="pt-4 sm:pt-6">
									<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
										<TrendingDown className="size-4 sm:h-5 sm:w-5 text-green-600" />
										<div>
											<div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">
												R$ {selectedSummary.totalSavings.toFixed(2)}
											</div>
											<div className="text-xs sm:text-sm text-gray-600">Economia</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Informações de Distância (se disponível) */}
						{hasCalculatedRoute && routeData.totalDistanceKm && (
							<Card className="bg-purple-50 border-purple-200">
								<CardContent className="pt-4 sm:pt-6">
									<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
										<div className="flex items-center gap-2">
											<Car className="size-5 text-purple-600" />
											<div>
												<p className="text-xs sm:text-sm text-gray-600">Distância Total</p>
												<p className="text-lg sm:text-xl font-bold text-purple-900">
													{routeData.totalDistanceKm.toFixed(1)} km
												</p>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<Clock className="size-5 text-purple-600" />
											<div>
												<p className="text-xs sm:text-sm text-gray-600">Tempo Estimado</p>
												<p className="text-lg sm:text-xl font-bold text-purple-900">
													{routeData.totalDurationMinutes ? Math.round(routeData.totalDurationMinutes) : 0} min
												</p>
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{/* Instruções */}
						<Card className="bg-blue-50 border-blue-200">
							<CardContent className="pt-4 sm:pt-6">
								<div className="flex items-start gap-3">
									<Navigation className="size-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5" />
									<div>
										<h3 className="font-semibold text-sm sm:text-base text-blue-900">Como funciona</h3>
										<p className="text-blue-700 text-xs sm:text-sm mt-1">
											Analisamos o histórico de preços e sugerimos em quais mercados comprar cada item para obter o
											melhor preço.{" "}
											{hasCalculatedRoute &&
												"A ordem dos mercados foi otimizada considerando a distância do seu endereço."}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Lista de Mercados Otimizados */}
						<div className="space-y-3 sm:space-y-4">
							<h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
								<MapPin className="size-4 sm:h-5 sm:w-5" />
								{hasCalculatedRoute ? "Roteiro Otimizado" : "Roteiro Sugerido"}
							</h3>

							{routeData.optimizedRoute.map((market, index) => (
								<Card
									key={market.marketId}
									className={`transition-all duration-200 ${
										selectedMarkets.includes(market.marketId) ? "ring-2 ring-blue-500 bg-blue-50" : "opacity-60"
									}`}
								>
									<CardHeader className="pb-3 sm:pb-6">
										<div className="space-y-3">
											{/* Header do Mercado */}
											<div className="flex items-start justify-between gap-2">
												<div className="flex items-start gap-2 sm:gap-3 flex-1">
													<div
														className={`
															w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base shrink-0
															${selectedMarkets.includes(market.marketId) ? "bg-blue-600" : "bg-gray-400"}
														`}
													>
														{market.order ?? index + 1}
													</div>
													<div className="flex-1 min-w-0">
														<CardTitle className="text-sm sm:text-base md:text-lg break-words">
															{market.marketName}
														</CardTitle>
														{market.marketLocation && (
															<p className="text-xs sm:text-sm text-gray-600 mt-0.5">{market.marketLocation}</p>
														)}
														{/* Informações de Distância */}
														{market.distanceKm && market.durationMinutes && (
															<div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-purple-700">
																<span className="flex items-center gap-1">
																	<Car className="h-3 w-3" />
																	{market.distanceKm.toFixed(1)} km
																</span>
																<span>•</span>
																<span className="flex items-center gap-1">
																	<Clock className="h-3 w-3" />
																	{Math.round(market.durationMinutes)} min
																</span>
															</div>
														)}
													</div>
												</div>

												<Button
													variant={selectedMarkets.includes(market.marketId) ? "default" : "outline"}
													size="sm"
													onClick={() => toggleMarketSelection(market.marketId)}
													className="shrink-0 text-xs sm:text-sm"
												>
													{selectedMarkets.includes(market.marketId) ? (
														<>
															<CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
															<span className="hidden sm:inline">Selecionado</span>
														</>
													) : (
														<>
															<Clock className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
															<span className="hidden sm:inline">Selecionar</span>
														</>
													)}
												</Button>
											</div>

											{/* Resumo de Preços */}
											<div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
												<div className="flex items-center gap-1">
													<DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
													<span className="font-bold">R$ {market.totalCost.toFixed(2)}</span>
												</div>
												<div className="flex items-center gap-1 text-green-600">
													<TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
													<span>Economia: R$ {market.estimatedSavings.toFixed(2)}</span>
												</div>
												<Badge variant="secondary" className="text-xs">
													{market.itemCount} {market.itemCount === 1 ? "item" : "itens"}
												</Badge>
											</div>
										</div>
									</CardHeader>

									<CardContent className="pt-0">
										<Separator className="mb-3" />
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
											{market.items.map((item) => (
												<div
													key={item.itemId}
													className="flex justify-between items-start gap-2 p-2 sm:p-3 bg-gray-50 rounded-lg"
												>
													<div className="flex-1 min-w-0">
														<div className="font-medium text-xs sm:text-sm break-words">{item.productName}</div>
														<div className="text-xs text-gray-600 mt-0.5">
															{item.quantity} un × R$ {item.bestPrice.toFixed(2)}
														</div>
													</div>
													<div className="text-right shrink-0">
														<div className="font-medium text-xs sm:text-sm">R$ {item.estimatedTotal.toFixed(2)}</div>
														{item.savings && item.savings > 0 && (
															<div className="text-xs text-green-600">-R$ {item.savings.toFixed(2)}</div>
														)}
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						{/* Resumo Final */}
						<Card className="bg-green-50 border-green-200">
							<CardContent className="pt-4 sm:pt-6">
								<div className="text-center space-y-2">
									<h3 className="text-base sm:text-lg font-semibold text-green-900">Economia Total Estimada</h3>
									<div className="text-2xl sm:text-3xl font-bold text-green-600">
										R$ {selectedSummary.totalSavings.toFixed(2)}
									</div>
									<p className="text-green-700 text-xs sm:text-sm">
										Comprando {selectedSummary.totalItems} itens em {selectedMarkets.length} mercado(s) selecionado(s)
									</p>
								</div>
							</CardContent>
						</Card>
					</div>
				) : (
					<div className="p-6 text-center">
						<p className="text-gray-600">Erro ao carregar dados do roteiro.</p>
					</div>
				)}
			</div>
		</ResponsiveDialog>
	)
}
