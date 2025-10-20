"use client"

import { Check, DollarSign, TrendingDown, TrendingUp, X, Zap } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"
import { MarketSelect } from "@/components/selects/market-select"
import { MarketSelectDialog } from "@/components/selects/market-select-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useUIPreferences } from "@/hooks"

interface KitPriceComparisonProps {
	kitId: string
	kitName: string
	items: Array<{
		id: string
		product: {
			id: string
			name: string
		}
		quantity: number
	}>
}

interface AnalysisResult {
	kitPrice: number
	individualTotal: number
	savings: number
	savingsPercentage: number
	worthIt: boolean
	recommendation: string
	itemBreakdown: Array<{
		productId: string
		productName: string
		quantity: number
		unitPrice: number
		totalPrice: number
	}>
}

export function KitPriceComparison({ kitId, kitName, items }: KitPriceComparisonProps) {
	const id = useId()
	const { selectStyle } = useUIPreferences()

	const [selectedMarketId, setSelectedMarketId] = useState("")
	const [kitPrice, setKitPrice] = useState("")
	const [itemPrices, setItemPrices] = useState<Record<string, string>>(() => {
		const prices: Record<string, string> = {}
		for (const item of items) {
			prices[item.product.id] = ""
		}
		return prices
	})
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

	const handleItemPriceChange = (productId: string, value: string) => {
		setItemPrices((prev) => ({ ...prev, [productId]: value }))
	}

	const handleQuickAnalysis = async () => {
		// Validations
		if (!selectedMarketId) {
			toast.error("Selecione um mercado")
			return
		}

		if (!kitPrice || parseFloat(kitPrice) <= 0) {
			toast.error("Digite o preço do kit")
			return
		}

		const missingPrices = items.filter(
			(item) => !itemPrices[item.product.id] || parseFloat(itemPrices[item.product.id]) <= 0,
		)

		if (missingPrices.length > 0) {
			toast.error(`Digite o preço de todos os produtos (faltam ${missingPrices.length})`)
			return
		}

		setIsAnalyzing(true)

		try {
			const response = await fetch(`/api/product-kits/${kitId}/quick-price-analysis`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					marketId: selectedMarketId,
					kitPrice: parseFloat(kitPrice),
					itemPrices: items.map((item) => ({
						productId: item.product.id,
						price: parseFloat(itemPrices[item.product.id]),
					})),
				}),
			})

			if (!response.ok) {
				throw new Error("Erro ao analisar preços")
			}

			const data = await response.json()
			setAnalysisResult(data.data)
			toast.success("Análise concluída! Preços registrados.")
		} catch (error) {
			console.error("Error analyzing prices:", error)
			toast.error("Erro ao analisar preços")
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handleReset = () => {
		setKitPrice("")
		const resetPrices: Record<string, string> = {}
		for (const item of items) {
			resetPrices[item.product.id] = ""
		}
		setItemPrices(resetPrices)
		setAnalysisResult(null)
	}

	const allFieldsFilled = selectedMarketId && kitPrice && items.every((item) => itemPrices[item.product.id])

	return (
		<div className="space-y-4">
			{/* Quick Price Entry */}
			<Card className="border-primary/50">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="size-5 text-primary" />
						Registro Rápido de Preços
					</CardTitle>
					<CardDescription>Registre os preços do kit e produtos individuais para análise instantânea</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Market Selection */}
					<div className="space-y-2">
						<Label>Mercado *</Label>
						{selectStyle === "dialog" ? (
							<MarketSelectDialog
								value={selectedMarketId || undefined}
								onValueChange={(value) => setSelectedMarketId(value || "")}
								placeholder="Selecione o mercado"
							/>
						) : (
							<MarketSelect
								value={selectedMarketId || undefined}
								onValueChange={(value) => setSelectedMarketId(value || "")}
								placeholder="Selecione o mercado"
							/>
						)}
					</div>

					<Separator />

					{/* Kit Price */}
					<div className="space-y-2">
						<Label htmlFor={`${id}-kitPrice`}>Preço do Kit {kitName} *</Label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
							<Input
								id={`${id}-kitPrice`}
								type="number"
								step="0.01"
								min="0"
								placeholder="0,00"
								value={kitPrice}
								onChange={(e) => setKitPrice(e.target.value)}
								className="pl-10"
							/>
						</div>
					</div>

					<Separator />

					{/* Individual Product Prices */}
					<div className="space-y-3">
						<Label>Preços dos Produtos Individuais *</Label>
						{items.map((item) => (
							<div key={item.id} className="space-y-1">
								<Label htmlFor={`${id}-price-${item.product.id}`} className="text-sm font-normal">
									{item.quantity}x {item.product.name}
								</Label>
								<div className="relative">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
									<Input
										id={`${id}-price-${item.product.id}`}
										type="number"
										step="0.01"
										min="0"
										placeholder="0,00"
										value={itemPrices[item.product.id]}
										onChange={(e) => handleItemPriceChange(item.product.id, e.target.value)}
										className="pl-10"
									/>
								</div>
							</div>
						))}
					</div>

					<div className="flex gap-2 pt-4">
						<Button onClick={handleQuickAnalysis} disabled={!allFieldsFilled || isAnalyzing} className="flex-1">
							<DollarSign className="size-4 mr-2" />
							{isAnalyzing ? "Analisando..." : "Analisar e Registrar"}
						</Button>
						{analysisResult && (
							<Button variant="outline" onClick={handleReset} disabled={isAnalyzing}>
								Limpar
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Analysis Result */}
			{analysisResult && (
				<Card className={analysisResult.worthIt ? "border-green-500" : "border-yellow-500"}>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{analysisResult.worthIt ? (
								<>
									<Check className="size-5 text-green-500" />
									<span className="text-green-700 dark:text-green-400">Vale a pena comprar o kit!</span>
								</>
							) : (
								<>
									<X className="size-5 text-yellow-500" />
									<span className="text-yellow-700 dark:text-yellow-400">Melhor comprar separado</span>
								</>
							)}
						</CardTitle>
						<CardDescription>{analysisResult.recommendation}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{/* Price Comparison */}
						<div className="grid grid-cols-2 gap-4">
							<div className="p-4 bg-secondary/30 rounded-lg">
								<p className="text-sm text-muted-foreground mb-1">Preço do Kit</p>
								<p className="text-2xl font-bold">R$ {analysisResult.kitPrice.toFixed(2)}</p>
							</div>
							<div className="p-4 bg-secondary/30 rounded-lg">
								<p className="text-sm text-muted-foreground mb-1">Produtos Separados</p>
								<p className="text-2xl font-bold">R$ {analysisResult.individualTotal.toFixed(2)}</p>
							</div>
						</div>

						{/* Savings */}
						<Card className="border-muted">
							<CardContent className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{analysisResult.savings > 0 ? (
											<TrendingDown className="size-5 text-green-500" />
										) : (
											<TrendingUp className="size-5 text-red-500" />
										)}
										<span className="font-semibold">{analysisResult.savings > 0 ? "Economia" : "Diferença"}</span>
									</div>
									<div className="text-right">
										<p
											className={`text-2xl font-bold ${analysisResult.savings > 0 ? "text-green-600" : "text-red-600"}`}
										>
											R$ {Math.abs(analysisResult.savings).toFixed(2)}
										</p>
										<p className="text-sm text-muted-foreground">
											{Math.abs(analysisResult.savingsPercentage).toFixed(1)}%
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Item Breakdown */}
						<div>
							<p className="text-sm font-semibold mb-2 text-muted-foreground">Detalhamento por Produto:</p>
							<div className="space-y-2">
								{analysisResult.itemBreakdown.map((item) => (
									<div
										key={item.productId}
										className="flex items-center justify-between p-2 rounded-md bg-secondary/20 text-sm"
									>
										<span>{item.productName}</span>
										<div className="flex items-center gap-3">
											<span className="text-muted-foreground">
												{item.quantity}x R$ {item.unitPrice.toFixed(2)}
											</span>
											<span className="font-medium">R$ {item.totalPrice.toFixed(2)}</span>
										</div>
									</div>
								))}
							</div>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
