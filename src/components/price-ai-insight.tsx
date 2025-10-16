"use client"

import { Sparkles } from "lucide-react"
import { AiAnalysisCard } from "@/components/shared/ai-analysis-card"

interface PriceAiInsightProps {
	analysis: string | null
	loading: boolean
}

export function PriceAiInsight({ analysis, loading }: PriceAiInsightProps) {
	if (!analysis && !loading) return null

	return (
		<AiAnalysisCard
			title="Análise de Preço do Zé"
			description="Insights inteligentes sobre o preço atual"
			icon={Sparkles}
			loading={loading}
			className="mt-4"
		>
			{analysis}
		</AiAnalysisCard>
	)
}