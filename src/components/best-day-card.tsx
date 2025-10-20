"use client"

import { BarChart3, Calendar, Clock, DollarSign, Lightbulb, Search, Target, TrendingDown } from "lucide-react"
import React, { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function BestDayCard({ className }: { className?: string }) {
	const [productName, setProductName] = useState("")
	const [recommendation, setRecommendation] = useState<any>(null)
	const [analysis, setAnalysis] = useState<any>(null)
	const [insights, setInsights] = useState<any[]>([])
	const [loading, setLoading] = useState(false)

	const searchBestDay = async () => {
		if (!productName.trim()) {
			toast.error("Digite o nome do produto")
			return
		}

		setLoading(true)
		try {
			const response = await fetch("/api/prices/best-day", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productName: productName.trim() }),
			})

			const data = await response.json()

			if (data.success) {
				setRecommendation(data.recommendation)
				setAnalysis(data.analysis)
				setInsights(data.insights || [])
			} else {
				toast.error(data.message || "Erro ao buscar melhor dia")
				setRecommendation(null)
				setAnalysis(null)
				setInsights([])
			}
		} catch (error) {
			toast.error("Erro ao conectar com o servidor")
			setRecommendation(null)
			setAnalysis(null)
			setInsights([])
		} finally {
			setLoading(false)
		}
	}

	const getConfidenceColor = (confidence: string) => {
		switch (confidence) {
			case "Alta":
				return "bg-green-500"
			case "Média":
				return "bg-yellow-500"
			default:
				return "bg-gray-500"
		}
	}

	const getDayOfWeekName = (dayNumber: number) => {
		const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"]
		return days[dayNumber]
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Calendar className="size-5" />
					Melhor Dia para Comprar
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Formulário de busca */}
				<div className="flex gap-2">
					<Input
						value={productName}
						onChange={(e) => setProductName(e.target.value)}
						placeholder="Digite o nome do produto"
						onKeyPress={(e) => e.key === "Enter" && searchBestDay()}
					/>
					<Button onClick={searchBestDay} disabled={loading}>
						{loading ? (
							<div className="animate-spin rounded-full size-4 border-b-2 border-white"></div>
						) : (
							<Search className="size-4" />
						)}
					</Button>
				</div>

				{/* Recomendação */}
				{recommendation && (
					<div className="space-y-4">
						{/* Card principal da recomendação */}
						<div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Target className="size-5 text-blue-600" />
									<span className="font-semibold text-blue-800">Melhor dia:</span>
									<span className="text-xl font-bold text-blue-900">{recommendation.bestDay}</span>
								</div>
								<Badge className={getConfidenceColor(recommendation.confidence)}>
									{recommendation.confidence} confiança
								</Badge>
							</div>

							<p className="text-sm text-blue-700 mb-3">{recommendation.reason}</p>

							{recommendation.savings > 0 && (
								<div className="flex items-center gap-4 text-sm">
									<div className="flex items-center gap-1">
										<TrendingDown className="size-4 text-green-600" />
										<span className="font-medium text-green-600">Economia: R$ {recommendation.savings.toFixed(2)}</span>
									</div>
									{recommendation.savingsPercentage > 0 && (
										<Badge variant="outline" className="text-green-600 border-green-200">
											-{recommendation.savingsPercentage.toFixed(1)}%
										</Badge>
									)}
								</div>
							)}
						</div>

						{/* Análise por dia da semana */}
						{analysis?.dayStats && analysis.dayStats.length > 1 && (
							<div className="space-y-3">
								<h4 className="font-medium text-sm flex items-center gap-2">
									<BarChart3 className="size-4" />
									Análise por Dia da Semana
								</h4>
								<div className="space-y-2">
									{analysis.dayStats
										.sort((a: any, b: any) => a.avgPrice - b.avgPrice)
										.map((stat: any, index: number) => {
											const isBest = index === 0
											const isWorst = index === analysis.dayStats.length - 1

											return (
												<div
													key={stat.day}
													className={`flex items-center justify-between p-2 rounded-lg ${
														isBest
															? "bg-green-50 border border-green-200"
															: isWorst
																? "bg-red-50 border border-red-200"
																: "bg-gray-50"
													}`}
												>
													<div className="flex items-center gap-2">
														<span className="font-medium text-sm w-16">{stat.name}</span>
														{isBest && <Badge className="bg-green-500 text-xs">Melhor</Badge>}
														{isWorst && (
															<Badge variant="destructive" className="text-xs">
																Mais caro
															</Badge>
														)}
													</div>
													<div className="text-right">
														<div className="font-semibold text-sm">R$ {stat.avgPrice.toFixed(2)}</div>
														<div className="text-xs text-muted-foreground">{stat.count} observações</div>
													</div>
												</div>
											)
										})}
								</div>
							</div>
						)}

						{/* Melhores meses */}
						{analysis?.monthlyStats && analysis.monthlyStats.length > 1 && (
							<div className="space-y-3">
								<h4 className="font-medium text-sm">Melhores Meses</h4>
								<div className="grid grid-cols-1 gap-2">
									{analysis.monthlyStats.map((month: any, index: number) => (
										<div key={month.month} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
											<div className="flex items-center gap-2">
												<span className="text-sm">#{index + 1}</span>
												<span className="font-medium text-sm">{month.name}</span>
											</div>
											<div className="text-right">
												<div className="font-semibold text-sm">R$ {month.avgPrice.toFixed(2)}</div>
												<div className="text-xs text-muted-foreground">{month.count} dados</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Estatísticas gerais */}
						{analysis && (
							<div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/30">
								<div className="text-center">
									<p className="text-lg font-bold">{analysis.dataPoints}</p>
									<p className="text-xs text-muted-foreground">Dados totais</p>
								</div>
								<div className="text-center">
									<p className="text-lg font-bold">R$ {analysis.priceRange.min.toFixed(2)}</p>
									<p className="text-xs text-muted-foreground">Menor preço</p>
								</div>
								<div className="text-center">
									<p className="text-lg font-bold">R$ {analysis.priceRange.max.toFixed(2)}</p>
									<p className="text-xs text-muted-foreground">Maior preço</p>
								</div>
							</div>
						)}

						{/* Insights */}
						{insights.length > 0 && (
							<div className="space-y-3">
								<h4 className="font-medium text-sm flex items-center gap-2">
									<Lightbulb className="size-4" />
									Insights
								</h4>
								<div className="space-y-2">
									{insights.map((insight: string, index: number) => (
										<div
											key={index}
											className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200"
										>
											<div className="h-2 w-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
											<p className="text-sm text-blue-700">{insight}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Fonte dos dados */}
						{analysis && (
							<div className="text-xs text-muted-foreground border-t pt-3">
								Análise baseada em {analysis.priceRecords} registros de preços e {analysis.purchases} compras dos
								últimos 6 meses
							</div>
						)}
					</div>
				)}

				{/* Estado vazio */}
				{!recommendation && !loading && (
					<div className="text-center py-6 text-muted-foreground">
						<Clock className="size-8 mx-auto mb-2" />
						<p className="text-sm">Digite um produto para descobrir o melhor dia para comprá-lo</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
