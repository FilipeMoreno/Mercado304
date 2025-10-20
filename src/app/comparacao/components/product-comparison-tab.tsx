"use client"

import { Loader2, MapPin, Search, Target, TrendingDown, TrendingUp } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ProductSelect } from "@/components/selects/product-select"
import { ProductSelectDialog } from "@/components/selects/product-select-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Label } from "@/components/ui/label"
import { useUIPreferences } from "@/hooks"
import type { Product } from "@/types"

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

interface ProductComparisonTabProps {
	products: Product[]
	selectedProductId: string
	onProductChange: (productId: string) => void
	preserveFormData: Record<string, unknown>
}

export function ProductComparisonTab({
	products,
	selectedProductId,
	onProductChange,
	preserveFormData,
}: ProductComparisonTabProps) {
	const { selectStyle } = useUIPreferences()
	const [productComparison, setProductComparison] = useState<PriceComparison | null>(null)
	const [loadingProduct, setLoadingProduct] = useState(false)

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

	const getBestPrice = (markets: PriceComparison["markets"]) => {
		if (markets.length === 0) return null
		return markets.reduce((best, current) => (current.currentPrice < best.currentPrice ? current : best))
	}

	const getWorstPrice = (markets: PriceComparison["markets"]) => {
		if (markets.length === 0) return null
		return markets.reduce((worst, current) => (current.currentPrice > worst.currentPrice ? current : worst))
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Search className="size-5" />
						Comparar Produto
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<Label>Selecione um Produto</Label>
							{selectStyle === "dialog" ? (
								<ProductSelectDialog
									value={selectedProductId}
									onValueChange={onProductChange}
									placeholder="Buscar produto..."
									preserveFormData={preserveFormData}
								/>
							) : (
								<ProductSelect
									value={selectedProductId}
									onValueChange={onProductChange}
									placeholder="Buscar produto..."
									products={products}
									preserveFormData={preserveFormData}
								/>
							)}
						</div>
						<div className="flex items-end">
							<Button onClick={compareProduct} disabled={loadingProduct} className="w-full sm:w-auto">
								{loadingProduct ? <Loader2 className="size-4 animate-spin" /> : "Comparar"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{productComparison && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 flex-wrap">
							<Target className="size-5" />
							<span className="break-words">{productComparison.productName}</span>
							{productComparison.brandName && (
								<Badge variant="secondary" className="text-xs">
									{productComparison.brandName}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{productComparison.markets.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia>
										<Target className="size-12 text-gray-400" />
									</EmptyMedia>
									<EmptyTitle>Nenhum preço encontrado</EmptyTitle>
									<EmptyDescription>
										Este produto ainda não possui preços registrados em nenhum mercado.
									</EmptyDescription>
								</EmptyHeader>
								<EmptyContent />
							</Empty>
						) : (
							<div className="space-y-4">
								{productComparison.markets
									.sort((a, b) => a.currentPrice - b.currentPrice)
									.map((market) => {
										const best = getBestPrice(productComparison.markets)
										const worst = getWorstPrice(productComparison.markets)
										const isBest = market.marketId === best?.marketId
										const isWorst = market.marketId === worst?.marketId
										return (
											<div
												key={market.marketId}
												className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-colors gap-3 ${isBest ? "bg-green-50 border-green-200" : isWorst ? "bg-red-50 border-red-200" : "bg-gray-50"
													}`}
											>
												<div className="flex-1 min-w-0">
													<div className="flex items-center gap-2 flex-wrap">
														<h4 className="font-medium truncate">{market.marketName}</h4>
														{isBest && <Badge className="bg-green-500 text-xs">Melhor Preço</Badge>}
														{isWorst && (
															<Badge variant="destructive" className="text-xs">
																Mais Caro
															</Badge>
														)}
													</div>
													<div className="text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
														{market.location && (
															<div className="flex items-center gap-1">
																<MapPin className="h-3 w-3 shrink-0" />
																<span className="truncate">{market.location}</span>
															</div>
														)}
														<span className="text-xs sm:text-sm">
															Última compra: {new Date(market.lastPurchase).toLocaleDateString("pt-BR")}
														</span>
													</div>
												</div>
												<div className="text-right shrink-0">
													<div className="text-lg sm:text-xl font-bold">
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
												R$ {(() => {
													const best = getBestPrice(productComparison.markets)
													const worst = getWorstPrice(productComparison.markets)
													return best && worst ? (worst.currentPrice - best.currentPrice).toFixed(2) : "0.00"
												})()}
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
		</div>
	)
}
