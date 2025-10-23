"use client"

import { Utensils, Wand2, Package } from "lucide-react"
import { useEffect, useState } from "react"
import { AnvisaNutritionalTable } from "@/components/AnvisaNutritionalTable"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { NutritionalInfo } from "@/types"

interface NutritionAiAnalysisProps {
	productId: string
	productName: string
	nutritionalInfo?: NutritionalInfo | null
}

export function NutritionAiAnalysis({ productId, productName, nutritionalInfo }: NutritionAiAnalysisProps) {
	const [analysis, setAnalysis] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchAnalysis() {
			if (!productId) return
			setLoading(true)
			try {
				const response = await fetch(`/api/products/${productId}/ai-analysis`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ productName: productName }),
				})
				if (response.ok) {
					const data = await response.json()
					setAnalysis(data.analysis)
				} else {
					setAnalysis(null)
				}
			} catch (error) {
				console.error("Erro ao buscar análise da IA:", error)
				setAnalysis(null)
			} finally {
				setLoading(false)
			}
		}
		fetchAnalysis()
	}, [productId, productName])

	if (!analysis && !loading && !nutritionalInfo) {
		return null // Não renderiza nada se não houver análise nem informações nutricionais
	}

	return (
		<Card className="border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
			<Tabs defaultValue="per100">
				<CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-b">
					<CardTitle className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
							<Wand2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
						</div>
						<span className="text-lg">Análise Nutricional do Zé</span>
					</CardTitle>
					<CardDescription className="mt-2">
						Análise detalhada e tabela nutricional do produto
					</CardDescription>
					{nutritionalInfo && (
						<TabsList className="grid w-full grid-cols-4 mt-4">
							<TabsTrigger value="per100">Por 100g</TabsTrigger>
							<TabsTrigger value="perServing">Por Porção</TabsTrigger>
							<TabsTrigger value="complete">Completas</TabsTrigger>
							<TabsTrigger value="table">
								<Utensils className="h-3.5 w-3.5 mr-1.5" />
								Tabela
							</TabsTrigger>
						</TabsList>
					)}
				</CardHeader>

				{nutritionalInfo && (
					<>
						<TabsContent value="per100">
							<CardContent className="pt-6">
								{loading ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
									</div>
								) : analysis ? (
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<div dangerouslySetInnerHTML={{ __html: analysis }} />
									</div>
								) : (
									<p className="text-sm text-gray-500 text-center py-4">
										Análise nutricional não disponível
									</p>
								)}
							</CardContent>
						</TabsContent>

						<TabsContent value="perServing">
							<CardContent className="pt-6">
								{loading ? (
									<div className="flex items-center justify-center py-8">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
									</div>
								) : analysis ? (
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<div dangerouslySetInnerHTML={{ __html: analysis }} />
									</div>
								) : (
									<p className="text-sm text-gray-500 text-center py-4">
										Análise nutricional não disponível
									</p>
								)}
							</CardContent>
						</TabsContent>

						<TabsContent value="complete">
							<CardContent className="pt-6">
								<div className="space-y-8">
									{/* Macronutrientes */}
									<div>
										{nutritionalInfo.calories || nutritionalInfo.carbohydrates || nutritionalInfo.proteins || nutritionalInfo.totalFat ? (
											<div className="flex items-center gap-2 mb-4">
												<div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
												<h4 className="font-semibold text-gray-900 dark:text-gray-100">Macronutrientes</h4>
											</div>
										) : null}
										<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
											{nutritionalInfo.calories && (
												<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-300">
													<div className="relative z-10">
														<p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Valor Energético</p>
														<p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
															{nutritionalInfo.calories.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kcal
														</p>
													</div>
													<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-blue-200 dark:bg-blue-700 opacity-20"></div>
												</div>
											)}
											{nutritionalInfo.carbohydrates && (
												<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 p-4 border border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-300">
													<div className="relative z-10">
														<p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">Carboidratos</p>
														<p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
															{nutritionalInfo.carbohydrates.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}g
														</p>
													</div>
													<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-orange-200 dark:bg-orange-700 opacity-20"></div>
												</div>
											)}
											{nutritionalInfo.proteins && (
												<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 border border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-300">
													<div className="relative z-10">
														<p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Proteínas</p>
														<p className="text-2xl font-bold text-green-900 dark:text-green-100">
															{nutritionalInfo.proteins.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}g
														</p>
													</div>
													<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-green-200 dark:bg-green-700 opacity-20"></div>
												</div>
											)}
											{nutritionalInfo.totalFat && (
												<div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 p-4 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-300">
													<div className="relative z-10">
														<p className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">Gorduras Totais</p>
														<p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
															{nutritionalInfo.totalFat.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 1 })}g
														</p>
													</div>
													<div className="absolute -top-2 -right-2 h-16 w-16 rounded-full bg-yellow-200 dark:bg-yellow-700 opacity-20"></div>
												</div>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</TabsContent>

						<TabsContent value="table">
							<CardContent className="pt-6">
								<AnvisaNutritionalTable nutritionalInfo={nutritionalInfo} />
							</CardContent>
						</TabsContent>
					</>
				)}

				{!nutritionalInfo && (
					<CardContent className="pt-6">
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
							</div>
						) : analysis ? (
							<div className="prose prose-sm dark:prose-invert max-w-none">
								<div dangerouslySetInnerHTML={{ __html: analysis }} />
							</div>
						) : (
							<p className="text-sm text-gray-500 text-center py-4">
								Análise nutricional não disponível
							</p>
						)}
					</CardContent>
				)}
			</Tabs>
		</Card>
	)
}