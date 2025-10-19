"use client"

import { AlertTriangle, Apple, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface NutritionSummary {
	totalProducts: number
	totalCalories: number
	averageHealthScore: number
	qualityIndicators: {
		highSodiumPercentage: number
		highSugarPercentage: number
		highFiberPercentage: number
		highProteinPercentage: number
	}
	topCategory?: {
		name: string
		icon: string
		healthScore: number
	}
}

export function NutritionSummaryCard() {
	const [summary, setSummary] = useState<NutritionSummary | null>(null)
	const [loading, setLoading] = useState(true)

	const fetchNutritionSummary = useCallback(async () => {
		try {
			const response = await fetch("/api/nutrition/analysis?period=30")
			if (response.ok) {
				const data = await response.json()

				// Calcular score médio de saúde
				const avgHealthScore =
					data.categoryAnalysis.length > 0
						? data.categoryAnalysis.reduce((sum: number, cat: any) => sum + cat.healthScore, 0) /
							data.categoryAnalysis.length
						: 0

				// Encontrar melhor categoria
				const topCategory =
					data.categoryAnalysis.length > 0
						? data.categoryAnalysis.reduce((best: any, current: any) =>
								current.healthScore > best.healthScore ? current : best,
							)
						: null

				setSummary({
					totalProducts: data.summary.totalProducts,
					totalCalories: data.totals.calories,
					averageHealthScore: avgHealthScore,
					qualityIndicators: data.summary.qualityIndicators,
					topCategory,
				})
			}
		} catch (error) {
			console.error("Erro ao buscar resumo nutricional:", error)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchNutritionSummary()
	}, [fetchNutritionSummary])

	const getHealthScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600"
		if (score >= 60) return "text-yellow-600"
		return "text-red-600"
	}

	const getHealthScoreIcon = (score: number) => {
		if (score >= 80) return <CheckCircle2 className="h-4 w-4 text-green-600" />
		if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
		return <AlertTriangle className="h-4 w-4 text-red-600" />
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Apple className="h-5 w-5 text-green-600" />
						Análise Nutricional
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!summary || summary.totalProducts === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Apple className="h-5 w-5 text-green-600" />
						Análise Nutricional
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="text-center py-4">
						<Apple className="h-12 w-12 mx-auto text-gray-400 mb-2" />
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
							Nenhum produto com informações nutricionais encontrado
						</p>
						<Link href="/produtos">
							<Button variant="outline" size="sm">
								Adicionar Produtos
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="flex items-center gap-2">
						<Apple className="h-5 w-5 text-green-600" />
						Análise Nutricional
					</CardTitle>
					<Link href="/nutricao">
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<ArrowRight className="h-4 w-4" />
						</Button>
					</Link>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Estatísticas Principais */}
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1">
						<p className="text-2xl font-bold">{summary.totalProducts}</p>
						<p className="text-xs text-gray-600 dark:text-gray-400">Produtos Analisados</p>
					</div>
					<div className="space-y-1">
						<p className="text-2xl font-bold">{Math.round(summary.totalCalories).toLocaleString()}</p>
						<p className="text-xs text-gray-600 dark:text-gray-400">Calorias Totais</p>
					</div>
				</div>

				{/* Score de Saúde Médio */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<span className="text-sm font-medium">Score de Saúde Médio</span>
						<div className="flex items-center gap-1">
							{getHealthScoreIcon(summary.averageHealthScore)}
							<span className={`text-sm font-bold ${getHealthScoreColor(summary.averageHealthScore)}`}>
								{Math.round(summary.averageHealthScore)}
							</span>
						</div>
					</div>
					<Progress value={summary.averageHealthScore} className="h-2" />
				</div>

				{/* Indicadores Rápidos */}
				<div className="space-y-2">
					<h4 className="text-sm font-medium">Indicadores de Qualidade</h4>
					<div className="space-y-1">
						<div className="flex items-center justify-between text-xs">
							<span>Rica em Fibras</span>
							<Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-300 text-xs">
								{Math.round(summary.qualityIndicators.highFiberPercentage)}%
							</Badge>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span>Rica em Proteínas</span>
							<Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs">
								{Math.round(summary.qualityIndicators.highProteinPercentage)}%
							</Badge>
						</div>
						<div className="flex items-center justify-between text-xs">
							<span>Alto Sódio</span>
							<Badge variant="secondary" className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-xs">
								{Math.round(summary.qualityIndicators.highSodiumPercentage)}%
							</Badge>
						</div>
					</div>
				</div>

				{/* Melhor Categoria */}
				{summary.topCategory && (
					<div className="pt-2 border-t">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<span className="text-lg">{summary.topCategory.icon}</span>
								<div>
									<p className="text-sm font-medium">Categoria Mais Saudável</p>
									<p className="text-xs text-gray-600 dark:text-gray-400">{summary.topCategory.name}</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								{getHealthScoreIcon(summary.topCategory.healthScore)}
								<span className={`text-sm font-bold ${getHealthScoreColor(summary.topCategory.healthScore)}`}>
									{Math.round(summary.topCategory.healthScore)}
								</span>
							</div>
						</div>
					</div>
				)}

				{/* Botão para Ver Mais */}
				<Link href="/nutricao">
					<Button variant="outline" className="w-full" size="sm">
						<TrendingUp className="mr-2 h-4 w-4" />
						Ver Análise Completa
					</Button>
				</Link>
			</CardContent>
		</Card>
	)
}
