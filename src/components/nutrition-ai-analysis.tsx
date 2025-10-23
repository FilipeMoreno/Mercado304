"use client"

import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { AiAnalysisCard } from "@/components/shared/ai-analysis-card"
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

	// Só renderiza se houver análise ou se ainda estiver carregando
	if (!analysis && !loading) {
		return null
	}

	return (
		<AiAnalysisCard
			title="Análise Nutricional do Zé"
			description="Análise inteligente sobre o produto e suas informações nutricionais"
			icon={Sparkles}
			loading={loading}
		>
			{analysis && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: analysis }} />}
		</AiAnalysisCard>
	)
}
