"use client"

import { CalendarDays, Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useProductBestDayToBuyQuery, useProductBestDayAiAnalysisQuery } from "@/hooks/use-react-query"
import { AiAnalysisCard } from "@/components/shared/ai-analysis-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BestDayAnalysis {
	dayOfWeek: number
	averagePrice: number
	purchaseCount: number
}

interface BestDayToBuyCardProps {
	productId: string
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function BestDayToBuyCard({ productId }: BestDayToBuyCardProps) {
	const [shouldFetchAi, setShouldFetchAi] = useState(false)

	// Fetch best day data using React Query
	const { data, isLoading: loading, isError } = useProductBestDayToBuyQuery(productId)

	// Fetch AI analysis only when data is available
	const { data: aiAnalysisData, isLoading: loadingAi } = useProductBestDayAiAnalysisQuery(productId, shouldFetchAi)

	// Enable AI analysis fetch when we have data
	useEffect(() => {
		if (data && !data.message && Array.isArray(data) && data.length > 0) {
			setShouldFetchAi(true)
		}
	}, [data])

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CalendarDays className="h-5 w-5" />
						Análise por Dia da Semana
					</CardTitle>
					<CardDescription>Melhor dia para comprar este produto</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-64 animate-pulse rounded-lg bg-gray-200" />
				</CardContent>
			</Card>
		)
	}

	if (!data || data.message || !Array.isArray(data) || data.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CalendarDays className="h-5 w-5" />
						Análise por Dia da Semana
					</CardTitle>
					<CardDescription>Melhor dia para comprar este produto</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-12 text-center">
						<div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
							<CalendarDays className="h-8 w-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum dado disponível</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
							Não há dados suficientes para analisar o melhor dia da semana para comprar este produto. Faça algumas
							compras em diferentes dias para ver a análise.
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	const formattedData = data.map((d) => ({
		name: dayNames[d.dayOfWeek],
		"Preço Médio": d.averagePrice,
		Compras: d.purchaseCount,
	}))

	const bestDay = data.reduce((prev, curr) => (prev.averagePrice < curr.averagePrice ? prev : curr))

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<CalendarDays className="h-5 w-5" />
					Análise por Dia da Semana
				</CardTitle>
				<CardDescription>Melhor dia para comprar este produto</CardDescription>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={formattedData}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="name" />
						<YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
						<YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
						<Tooltip />
						<Bar yAxisId="left" dataKey="Preço Médio" fill="#8884d8" />
					</BarChart>
				</ResponsiveContainer>
				<div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
					<p className="text-sm font-medium text-green-800">
						Com base em {bestDay.purchaseCount} compras, o melhor dia para comprar este produto é
						<span className="font-bold ml-1">{dayNames[bestDay.dayOfWeek]}</span>, com preço médio de
						<span className="font-bold ml-1">R$ {bestDay.averagePrice.toFixed(2)}</span>.
					</p>
				</div>

				{/* Card de Análise do Zé padronizado */}
				<AiAnalysisCard
					title="Análise do Zé"
					description="Insights sobre o melhor dia para comprar"
					icon={Sparkles}
					loading={loadingAi}
					className="mt-4"
				>
					{aiAnalysisData?.analysis}
				</AiAnalysisCard>
			</CardContent>
		</Card>
	)
}
