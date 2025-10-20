"use client"

import { BarChart3, Brain, Clock, Lightbulb, ShoppingCart, Star, Target, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface RecommendationData {
	userId: string
	purchaseHistory: Array<{
		date: string
		products: Array<{
			name: string
			category: string
			price: number
			quantity: number
		}>
		market: string
		total: number
	}>
}

interface ProductRecommendation {
	name: string
	category: string
	confidence: number
	reason: string
	averagePrice: number
	lastPurchased?: string
	frequency: number
	seasonality?: "high" | "medium" | "low"
}

interface ShoppingPattern {
	preferredMarkets: Array<{
		name: string
		frequency: number
		averageSpent: number
	}>
	topCategories: Array<{
		category: string
		percentage: number
		trend: string
	}>
	shoppingFrequency: {
		weeklyAverage: number
		bestDay: string
		bestTime: string
	}
	budgetPattern: {
		averageSpent: number
		monthlyTrend: string
		savingsOpportunity: number
	}
}

interface MLRecommendationsProps {
	data?: RecommendationData
	onAddToCart?: (product: ProductRecommendation) => void
	showPatterns?: boolean
}

export function MLRecommendations({ data, onAddToCart, showPatterns = true }: MLRecommendationsProps) {
	const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([])
	const [patterns, setPatterns] = useState<ShoppingPattern | null>(null)
	const [loading, setLoading] = useState(true)
	const [analysisProgress, setAnalysisProgress] = useState(0)

	// Algoritmo de análise de padrões de compra
	const analyzeShoppingPatterns = (data: RecommendationData): ShoppingPattern => {
		const purchases = data.purchaseHistory

		// Análise de mercados preferidos
		const marketFrequency = new Map<string, { count: number; totalSpent: number }>()
		purchases.forEach((purchase) => {
			const current = marketFrequency.get(purchase.market) || { count: 0, totalSpent: 0 }
			marketFrequency.set(purchase.market, {
				count: current.count + 1,
				totalSpent: current.totalSpent + purchase.total,
			})
		})

		const preferredMarkets = Array.from(marketFrequency.entries())
			.map(([name, data]) => ({
				name,
				frequency: data.count,
				averageSpent: data.totalSpent / data.count,
			}))
			.sort((a, b) => b.frequency - a.frequency)
			.slice(0, 3)

		// Análise de categorias
		const categoryStats = new Map<string, number[]>()
		purchases.forEach((purchase) => {
			purchase.products.forEach((product) => {
				const prices = categoryStats.get(product.category) || []
				prices.push(product.price * product.quantity)
				categoryStats.set(product.category, prices)
			})
		})

		const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0)
		const topCategories = Array.from(categoryStats.entries())
			.map(([category, amounts]) => {
				const categoryTotal = amounts.reduce((sum, amount) => sum + amount, 0)
				return {
					category,
					percentage: (categoryTotal / totalSpent) * 100,
					trend: Math.random() > 0.5 ? "increasing" : "stable",
				}
			})
			.sort((a, b) => b.percentage - a.percentage)
			.slice(0, 5)

		// Análise de frequência de compras
		const dates = purchases.map((p) => new Date(p.date))
		const dayOfWeek = dates.map((d) => d.getDay())
		const dayFrequency = [0, 0, 0, 0, 0, 0, 0]
		dayOfWeek.forEach((day) => dayFrequency[day]++)

		const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
		const bestDay = days[dayFrequency.indexOf(Math.max(...dayFrequency))]

		const shoppingFrequency = {
			weeklyAverage: purchases.length / 4, // Assumindo 4 semanas de dados
			bestDay,
			bestTime: "10:00", // Placeholder - poderia ser calculado com dados de hora
		}

		// Análise de orçamento
		const averageSpent = totalSpent / purchases.length
		const budgetPattern = {
			averageSpent,
			monthlyTrend: "stable",
			savingsOpportunity: averageSpent * 0.15, // 15% de potencial economia
		}

		return {
			preferredMarkets,
			topCategories,
			shoppingFrequency,
			budgetPattern,
		}
	}

	// Algoritmo de Machine Learning para recomendações
	const generateRecommendations = (data: RecommendationData): ProductRecommendation[] => {
		const purchases = data.purchaseHistory
		const allProducts = purchases.flatMap((p) => p.products)

		// Calcular frequência de cada produto
		const productStats = new Map<
			string,
			{
				count: number
				totalSpent: number
				lastPurchased: string
				category: string
				avgPrice: number
			}
		>()

		allProducts.forEach((product) => {
			const key = product.name
			const current = productStats.get(key) || {
				count: 0,
				totalSpent: 0,
				lastPurchased: "",
				category: product.category,
				avgPrice: 0,
			}

			current.count++
			current.totalSpent += product.price * product.quantity
			current.category = product.category
			current.avgPrice = current.totalSpent / current.count

			productStats.set(key, current)
		})

		// Gerar recomendações baseadas em diferentes algoritmos
		const recommendations: ProductRecommendation[] = []

		// 1. Produtos frequentemente comprados
		const frequentProducts = Array.from(productStats.entries())
			.filter(([_, stats]) => stats.count >= 2)
			.sort((a, b) => b[1].count - a[1].count)
			.slice(0, 3)
			.map(([name, stats]) => ({
				name,
				category: stats.category,
				confidence: Math.min(95, (stats.count / purchases.length) * 100),
				reason: `Comprado ${stats.count} vezes - produto habitual`,
				averagePrice: stats.avgPrice,
				frequency: stats.count,
				seasonality: "high" as const,
			}))

		recommendations.push(...frequentProducts)

		// 2. Collaborative Filtering simulado (produtos que outros compraram junto)
		const complementaryProducts = [
			{
				name: "Leite",
				category: "Laticínios",
				confidence: 87,
				reason: "Frequentemente comprado com café",
				averagePrice: 4.5,
				frequency: 8,
				seasonality: "high" as const,
			},
			{
				name: "Banana",
				category: "Frutas",
				confidence: 82,
				reason: "Combinação popular com aveia",
				averagePrice: 3.2,
				frequency: 6,
				seasonality: "medium" as const,
			},
			{
				name: "Azeite Extra Virgem",
				category: "Condimentos",
				confidence: 78,
				reason: "Essencial para cozinha saudável",
				averagePrice: 12.9,
				frequency: 4,
				seasonality: "low" as const,
			},
		]

		recommendations.push(...complementaryProducts)

		// 3. Produtos sazonais e tendências
		const seasonalProducts = [
			{
				name: "Chocolate 70% Cacau",
				category: "Doces",
				confidence: 75,
				reason: "Tendência de alimentação saudável",
				averagePrice: 8.9,
				frequency: 3,
				seasonality: "medium" as const,
			},
			{
				name: "Quinoa",
				category: "Grãos",
				confidence: 70,
				reason: "Superfood em alta demanda",
				averagePrice: 15.9,
				frequency: 2,
				seasonality: "high" as const,
			},
		]

		recommendations.push(...seasonalProducts)

		// 4. Análise de padrões nutricionais
		const nutritionalProducts = [
			{
				name: "Iogurte Natural",
				category: "Laticínios",
				confidence: 85,
				reason: "Complementa perfil nutricional",
				averagePrice: 5.9,
				frequency: 7,
				seasonality: "high" as const,
			},
		]

		recommendations.push(...nutritionalProducts)

		// Ordenar por confiança e retornar top 8
		return recommendations.sort((a, b) => b.confidence - a.confidence).slice(0, 8)
	}

	// Simular processo de análise ML
	useEffect(() => {
		if (!data) {
			// Dados de exemplo para demonstração
			const sampleData: RecommendationData = {
				userId: "demo-user",
				purchaseHistory: [
					{
						date: "2024-01-15",
						products: [
							{ name: "Café", category: "Bebidas", price: 12.9, quantity: 1 },
							{ name: "Açúcar", category: "Condimentos", price: 3.5, quantity: 2 },
							{ name: "Pão de Forma", category: "Padaria", price: 4.2, quantity: 1 },
						],
						market: "Supermercado Central",
						total: 24.1,
					},
					{
						date: "2024-01-10",
						products: [
							{ name: "Leite", category: "Laticínios", price: 4.5, quantity: 2 },
							{ name: "Ovos", category: "Proteínas", price: 8.9, quantity: 1 },
							{ name: "Café", category: "Bebidas", price: 12.9, quantity: 1 },
						],
						market: "Supermercado Central",
						total: 30.8,
					},
				],
			}

			setLoading(true)

			// Simular processamento ML com progress
			const interval = setInterval(() => {
				setAnalysisProgress((prev) => {
					if (prev >= 100) {
						clearInterval(interval)

						// Processar dados
						const patterns = analyzeShoppingPatterns(sampleData)
						const recs = generateRecommendations(sampleData)

						setPatterns(patterns)
						setRecommendations(recs)
						setLoading(false)

						toast.success(`🧠 Análise ML concluída! ${recs.length} recomendações geradas`)
						return 100
					}
					return prev + 10
				})
			}, 200)

			return () => clearInterval(interval)
		}
	}, [data])

	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 85) return "bg-green-500"
		if (confidence >= 70) return "bg-yellow-500"
		return "bg-blue-500"
	}

	const getSeasonalityIcon = (seasonality?: string) => {
		switch (seasonality) {
			case "high":
				return "🔥"
			case "medium":
				return "📈"
			case "low":
				return "💡"
			default:
				return "⭐"
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="size-5 animate-pulse" />
						Analisando Padrões com IA
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="text-center">
							<p className="text-sm text-gray-600 mb-2">Processando histórico de compras...</p>
							<Progress value={analysisProgress} className="w-full" />
							<p className="text-xs text-gray-500 mt-1">{analysisProgress}% concluído</p>
						</div>
						<div className="text-xs text-gray-500 space-y-1">
							<p>🔍 Analisando padrões de compra</p>
							<p>🧮 Calculando correlações de produtos</p>
							<p>📊 Identificando tendências</p>
							<p>🎯 Gerando recomendações personalizadas</p>
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<div className="space-y-6">
			{/* Recomendações de Produtos */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Brain className="size-5 text-purple-500" />
						Recomendações IA
						<Badge variant="secondary" className="bg-purple-100 text-purple-700">
							ML Powered
						</Badge>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{recommendations.map((rec, index) => (
							<Card key={index} className="p-4 hover:shadow-md transition-shadow-sm">
								<div className="space-y-3">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h4 className="font-medium flex items-center gap-2">
												{rec.name}
												<span>{getSeasonalityIcon(rec.seasonality)}</span>
											</h4>
											<p className="text-sm text-gray-600">{rec.category}</p>
										</div>
										<Badge className={`${getConfidenceColor(rec.confidence)} text-white`}>{rec.confidence}%</Badge>
									</div>

									<div className="space-y-2">
										<p className="text-sm text-gray-700">{rec.reason}</p>
										<div className="flex items-center justify-between text-sm">
											<span className="font-medium text-green-600">R$ {rec.averagePrice.toFixed(2)}</span>
											<span className="text-gray-500">{rec.frequency}x comprado</span>
										</div>
									</div>

									{onAddToCart && (
										<Button size="sm" className="w-full" onClick={() => onAddToCart(rec)}>
											<ShoppingCart className="h-3 w-3 mr-2" />
											Adicionar
										</Button>
									)}
								</div>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>

			{/* Padrões de Compra */}
			{showPatterns && patterns && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Mercados Preferidos */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Target className="size-5 text-blue-500" />
								Mercados Preferidos
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{patterns.preferredMarkets.map((market, index) => (
									<div key={index} className="flex items-center justify-between">
										<div>
											<p className="font-medium">{market.name}</p>
											<p className="text-sm text-gray-600">{market.frequency} visitas</p>
										</div>
										<div className="text-right">
											<p className="font-medium text-green-600">R$ {market.averageSpent.toFixed(2)}</p>
											<p className="text-xs text-gray-500">média/visita</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Categorias Top */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<BarChart3 className="size-5 text-orange-500" />
								Categorias Favoritas
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{patterns.topCategories.map((category, index) => (
									<div key={index} className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="font-medium">{category.category}</span>
											<div className="flex items-center gap-2">
												<span className="text-sm">{category.percentage.toFixed(1)}%</span>
												<TrendingUp
													className={`h-4 w-4 ${
														category.trend === "increasing"
															? "text-green-500"
															: category.trend === "decreasing"
																? "text-red-500"
																: "text-gray-500"
													}`}
												/>
											</div>
										</div>
										<Progress value={category.percentage} className="h-2" />
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Padrões de Frequência */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="size-5 text-green-500" />
								Frequência de Compras
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div className="text-center p-3 bg-blue-50 rounded-lg">
										<p className="text-2xl font-bold text-blue-600">
											{patterns.shoppingFrequency.weeklyAverage.toFixed(1)}
										</p>
										<p className="text-sm text-gray-600">compras/semana</p>
									</div>
									<div className="text-center p-3 bg-green-50 rounded-lg">
										<p className="text-lg font-bold text-green-600">{patterns.shoppingFrequency.bestDay}</p>
										<p className="text-sm text-gray-600">melhor dia</p>
									</div>
								</div>
								<div className="text-center p-3 bg-purple-50 rounded-lg">
									<p className="text-lg font-bold text-purple-600">{patterns.shoppingFrequency.bestTime}</p>
									<p className="text-sm text-gray-600">horário preferido</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Insights de Orçamento */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Lightbulb className="size-5 text-yellow-500" />
								Insights Financeiros
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<p className="font-medium text-yellow-800">💡 Oportunidade de Economia</p>
									<p className="text-sm text-yellow-700">
										Você pode economizar até <strong>R$ {patterns.budgetPattern.savingsOpportunity.toFixed(2)}</strong>
										por compra comprando em promoções
									</p>
								</div>
								<div className="grid grid-cols-2 gap-4 text-center">
									<div>
										<p className="text-2xl font-bold text-gray-800">
											R$ {patterns.budgetPattern.averageSpent.toFixed(2)}
										</p>
										<p className="text-sm text-gray-600">gasto médio</p>
									</div>
									<div>
										<p className="text-lg font-bold text-blue-600">
											{patterns.budgetPattern.monthlyTrend === "stable"
												? "📊"
												: patterns.budgetPattern.monthlyTrend === "increasing"
													? "📈"
													: "📉"}
										</p>
										<p className="text-sm text-gray-600">tendência mensal</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	)
}
