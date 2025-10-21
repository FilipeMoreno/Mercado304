"use client"

import { Wand2 } from "lucide-react"
import { useEffect, useState } from "react"
import { AiAnalysisCard } from "@/components/shared/ai-analysis-card"

interface NutritionAiAnalysisProps {
	productId: string
	productName: string
}

export function NutritionAiAnalysis({ productId, productName }: NutritionAiAnalysisProps) {
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

	if (!analysis && !loading) {
		return null // Não renderiza nada se não houver análise
	}

	return (
		<AiAnalysisCard
			title="Análise Nutricional do Zé"
			description="Informações e recomendações nutricionais"
			icon={Wand2}
			loading={loading}
		>
			{analysis}
		</AiAnalysisCard>
	)
}
