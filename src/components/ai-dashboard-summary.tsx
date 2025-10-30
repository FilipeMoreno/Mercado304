"use client"

import { Sparkles, Lightbulb } from "lucide-react"
import { AiAnalysisCard } from "@/components/shared/ai-analysis-card"
import { useDashboardAISummaryQuery } from "@/hooks/use-react-query"

export function AiDashboardSummary() {
	const { data, isLoading, error } = useDashboardAISummaryQuery()

	// Se há erro, mostra mensagem de erro
	const summary = error
		? "Não foi possível carregar os insights no momento."
		: data?.summary || null

	// Se não há summary e não está loading, mostra o estado vazio
	if (!summary && !isLoading) {
		return (
			<AiAnalysisCard
				title="Insights Inteligentes"
				description="Continue registrando suas compras para receber insights semanais personalizados da nossa IA"
				icon={Lightbulb}
				loading={false}
			>
				Analisamos seus padrões de consumo para oferecer dicas valiosas.
			</AiAnalysisCard>
		)
	}

	return (
		<AiAnalysisCard
			title="Insight da Semana"
			description="Análise personalizada dos seus padrões de compra"
			icon={Sparkles}
			loading={isLoading}
		>
			{summary}
		</AiAnalysisCard>
	)
}