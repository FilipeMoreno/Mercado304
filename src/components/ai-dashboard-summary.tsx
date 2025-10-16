"use client"

import { Sparkles, Lightbulb } from "lucide-react"
import { useEffect, useState } from "react"
import { AiAnalysisCard } from "@/components/shared/ai-analysis-card"

export function AiDashboardSummary() {
	const [summary, setSummary] = useState<string | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchSummary() {
			setLoading(true)
			try {
				const response = await fetch("/api/dashboard/ai-summary")
				if (response.ok) {
					const data = await response.json()
					setSummary(data.summary)
				}
			} catch (error) {
				console.error("Erro ao buscar resumo da IA:", error)
				setSummary("Não foi possível carregar os insights no momento.")
			} finally {
				setLoading(false)
			}
		}
		fetchSummary()
	}, [])

	// Se não há summary e não está loading, mostra o estado vazio
	if (!summary && !loading) {
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
			loading={loading}
		>
			{summary}
		</AiAnalysisCard>
	)
}