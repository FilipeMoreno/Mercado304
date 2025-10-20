"use client"

import {
	Activity,
	AlertTriangle,
	Apple,
	CheckCircle2,
	RefreshCw,
	Shield,
	TrendingUp,
	Zap,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface NutritionAnalysis {
	period: number
	summary: {
		totalProducts: number
		averageCaloriesPerProduct: number
		averageProteinsPerProduct: number
		averageCarbsPerProduct: number
		averageFatPerProduct: number
		qualityIndicators: {
			highSodiumPercentage: number
			highSugarPercentage: number
			highSaturatedFatPercentage: number
			highTransFatPercentage: number
			highFiberPercentage: number
			highProteinPercentage: number
		}
	}
	categoryAnalysis: Array<{
		name: string
		icon: string
		color: string
		totalCalories: number
		avgCalories: number
		count: number
		healthScore: number
	}>
	topAllergens: Array<{
		allergen: string
		count: number
	}>
	healthiestProducts: Array<{
		id: string
		healthScore: number
		product: {
			name: string
			brand?: { name: string }
			category?: { name: string }
		}
	}>
	leastHealthyProducts: Array<{
		id: string
		healthScore: number
		product: {
			name: string
			brand?: { name: string }
			category?: { name: string }
		}
	}>
	totals: {
		calories: number
		proteins: number
		carbohydrates: number
		totalFat: number
		saturatedFat: number
		transFat: number
		fiber: number
		sodium: number
	}
}

export default function NutricaoClient() {
	const [analysis, setAnalysis] = useState<NutritionAnalysis | null>(null)
	const [loading, setLoading] = useState(true)
	const [period, setPeriod] = useState("30")

	const fetchAnalysis = useCallback(async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams({
				period,
			})

			const response = await fetch(`/api/nutrition/analysis?${params}`)
			if (response.ok) {
				const data = await response.json()
				setAnalysis(data)
			}
		} catch (error) {
			console.error("Erro ao buscar análise nutricional:", error)
		} finally {
			setLoading(false)
		}
	}, [period])

	useEffect(() => {
		fetchAnalysis()
	}, [fetchAnalysis])

	const getHealthScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
		if (score >= 60) return "text-yellow-600 bg-yellow-50 border-yellow-200"
		return "text-red-600 bg-red-50 border-red-200"
	}

	const getHealthScoreIcon = (score: number) => {
		if (score >= 80) return <CheckCircle2 className="size-4 text-green-600" />
		if (score >= 60) return <AlertTriangle className="size-4 text-yellow-600" />
		return <AlertTriangle className="size-4 text-red-600" />
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<Card key="skeleton-1">
						<CardContent className="p-6">
							<div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse" />
						</CardContent>
					</Card>
					<Card key="skeleton-2">
						<CardContent className="p-6">
							<div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse" />
						</CardContent>
					</Card>
					<Card key="skeleton-3">
						<CardContent className="p-6">
							<div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse" />
						</CardContent>
					</Card>
					<Card key="skeleton-4">
						<CardContent className="p-6">
							<div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-sm animate-pulse" />
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	if (!analysis) {
		return (
			<Empty className="border border-dashed py-12">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Apple className="size-6" />
					</EmptyMedia>
					<EmptyTitle>Nenhum dado nutricional encontrado</EmptyTitle>
					<EmptyDescription>
						Adicione produtos com informações nutricionais para ver a análise completa.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		)
	}

	const macronutrientData = [
		{
			name: "Carboidratos",
			value: analysis.totals.carbohydrates,
			color: "#f97316",
		},
		{ name: "Proteínas", value: analysis.totals.proteins, color: "#22c55e" },
		{ name: "Gorduras", value: analysis.totals.totalFat, color: "#eab308" },
	]

	const qualityData = [
		{
			name: "Alto Sódio",
			percentage: analysis.summary.qualityIndicators.highSodiumPercentage,
			color: "#ef4444",
			icon: AlertTriangle,
		},
		{
			name: "Alto Açúcar",
			percentage: analysis.summary.qualityIndicators.highSugarPercentage,
			color: "#f97316",
			icon: AlertTriangle,
		},
		{
			name: "Rica em Fibras",
			percentage: analysis.summary.qualityIndicators.highFiberPercentage,
			color: "#22c55e",
			icon: CheckCircle2,
		},
		{
			name: "Rica em Proteínas",
			percentage: analysis.summary.qualityIndicators.highProteinPercentage,
			color: "#3b82f6",
			icon: CheckCircle2,
		},
	]

	return (
		<div className="space-y-6">
			{/* Controles */}
			<div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
				<Select value={period} onValueChange={setPeriod}>
					<SelectTrigger className="w-full sm:w-32">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="7">7 dias</SelectItem>
						<SelectItem value="30">30 dias</SelectItem>
						<SelectItem value="90">90 dias</SelectItem>
						<SelectItem value="365">1 ano</SelectItem>
					</SelectContent>
				</Select>

				<Button variant="outline" size="icon" onClick={fetchAnalysis}>
					<RefreshCw className="size-4" />
				</Button>
			</div>

			{/* Cards de Resumo */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
								<Zap className="size-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
							</div>
							<div>
								<p className="text-lg sm:text-2xl font-bold">{Math.round(analysis.totals.calories).toLocaleString()}</p>
								<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Calorias Totais</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
								<Activity className="size-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
							</div>
							<div>
								<p className="text-lg sm:text-2xl font-bold">{Math.round(analysis.totals.proteins)}g</p>
								<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Proteínas</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
								<TrendingUp className="size-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
							</div>
							<div>
								<p className="text-lg sm:text-2xl font-bold">{Math.round(analysis.totals.carbohydrates)}g</p>
								<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Carboidratos</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
								<AlertTriangle className="size-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
							</div>
							<div>
								<p className="text-lg sm:text-2xl font-bold">{Math.round(analysis.totals.sodium)}mg</p>
								<p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Sódio</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Distribuição de Macronutrientes */}
				<Card>
					<CardHeader>
						<CardTitle>Distribuição de Macronutrientes</CardTitle>
						<CardDescription>Proporção dos nutrientes principais</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={macronutrientData}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={120}
									paddingAngle={5}
									dataKey="value"
								>
									<Cell key="macronutrient-carbs" fill="#f97316" />
									<Cell key="macronutrient-proteins" fill="#22c55e" />
									<Cell key="macronutrient-fats" fill="#eab308" />
								</Pie>
								<Tooltip formatter={(value: number) => `${Math.round(value)}g`} />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Indicadores de Qualidade */}
				<Card>
					<CardHeader>
						<CardTitle>Indicadores de Qualidade</CardTitle>
						<CardDescription>Percentual de produtos por categoria</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{qualityData.map((item) => {
							const IconComponent = item.icon
							return (
								<div key={item.name} className="space-y-2">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<IconComponent className="size-4" style={{ color: item.color }} />
											<span className="text-sm font-medium">{item.name}</span>
										</div>
										<span className="text-sm text-gray-600">{Math.round(item.percentage)}%</span>
									</div>
									<Progress
										value={item.percentage}
										className="h-2"
										style={{
											// @ts-expect-error
											"--progress-background": item.color,
										}}
									/>
								</div>
							)
						})}
					</CardContent>
				</Card>
			</div>

			{/* Análise por Categoria */}
			{analysis.categoryAnalysis.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Análise por Categoria</CardTitle>
						<CardDescription>Score de saúde e consumo calórico por categoria</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{analysis.categoryAnalysis.map((category) => (
								<div
									key={category.name}
									className={`p-4 rounded-lg border ${getHealthScoreColor(category.healthScore)}`}
								>
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-2">
											<span className="text-lg">{category.icon}</span>
											<h4 className="font-medium">{category.name}</h4>
										</div>
										<div className="flex items-center gap-1">
											{getHealthScoreIcon(category.healthScore)}
											<span className="text-sm font-bold">{Math.round(category.healthScore)}</span>
										</div>
									</div>

									<div className="space-y-1 text-xs">
										<p>
											<strong>{category.count}</strong> produtos
										</p>
										<p>
											<strong>{Math.round(category.totalCalories)}</strong> kcal totais
										</p>
										<p>
											<strong>{Math.round(category.avgCalories)}</strong> kcal em média
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Produtos Mais e Menos Saudáveis */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Produtos Mais Saudáveis */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-green-600">
							<CheckCircle2 className="size-5" />
							Produtos Mais Saudáveis
						</CardTitle>
						<CardDescription>Top 5 produtos com melhor score nutricional</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{analysis.healthiestProducts.map((item, index) => (
							<div
								key={item.id}
								className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
							>
								<div className="flex items-center gap-3">
									<div className="size-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
										{index + 1}
									</div>
									<div>
										<p className="font-medium">{item.product.name}</p>
										<p className="text-xs text-gray-600">
											{item.product.brand?.name} • {item.product.category?.name}
										</p>
									</div>
								</div>
								<Badge variant="secondary" className="bg-green-100 text-green-800">
									{Math.round(item.healthScore)}
								</Badge>
							</div>
						))}
					</CardContent>
				</Card>

				{/* Produtos Menos Saudáveis */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-red-600">
							<AlertTriangle className="size-5" />
							Produtos Menos Saudáveis
						</CardTitle>
						<CardDescription>Top 5 produtos que precisam de atenção</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{analysis.leastHealthyProducts.map((item, index) => (
							<div
								key={item.id}
								className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
							>
								<div className="flex items-center gap-3">
									<div className="size-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
										{index + 1}
									</div>
									<div>
										<p className="font-medium">{item.product.name}</p>
										<p className="text-xs text-gray-600">
											{item.product.brand?.name} • {item.product.category?.name}
										</p>
									</div>
								</div>
								<Badge variant="secondary" className="bg-red-100 text-red-800">
									{Math.round(item.healthScore)}
								</Badge>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* Top Alérgenos */}
			{analysis.topAllergens.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Shield className="size-5 text-orange-500" />
							Alérgenos Mais Comuns
						</CardTitle>
						<CardDescription>Alérgenos presentes nos produtos consumidos</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{analysis.topAllergens.map((allergen) => (
								<Badge key={allergen.allergen} variant="secondary" className="bg-orange-100 text-orange-800">
									{allergen.allergen} ({allergen.count})
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
