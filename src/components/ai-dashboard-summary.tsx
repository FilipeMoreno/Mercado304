"use client"

import { Sparkles, Lightbulb } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

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

	return (
		<Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-cyan-950/20">
			{/* Background decoration */}
			<div className="absolute inset-0 opacity-5">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]" />
			</div>
			<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-200/20 to-cyan-200/20 rounded-full blur-xl" />
			<div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/20 to-violet-200/20 rounded-full blur-lg" />

			<CardContent className="relative p-6">
				{loading ? (
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-200/20">
							<Sparkles className="h-6 w-6 text-violet-600 animate-pulse" />
						</div>
						<div className="flex-1 space-y-3">
							<div className="h-5 bg-gradient-to-r from-violet-200 to-cyan-200 rounded animate-pulse" style={{ width: '60%' }} />
							<div className="space-y-2">
								<div className="h-3 bg-gradient-to-r from-violet-100 to-cyan-100 rounded animate-pulse" style={{ width: '100%' }} />
								<div className="h-3 bg-gradient-to-r from-violet-100 to-cyan-100 rounded animate-pulse" style={{ width: '80%' }} />
								<div className="h-3 bg-gradient-to-r from-violet-100 to-cyan-100 rounded animate-pulse" style={{ width: '60%' }} />
							</div>
						</div>
					</div>
				) : summary ? (
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg">
							<Sparkles className="h-6 w-6 text-white" />
						</div>
						<div className="flex-1 space-y-2">
							<h3 className="font-bold text-lg bg-gradient-to-r from-violet-700 to-cyan-700 bg-clip-text text-transparent">
								Insight da Semana
							</h3>
							<p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
								{summary}
							</p>
						</div>
					</div>
				) : (
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-200/20">
							<Lightbulb className="h-6 w-6 text-amber-600" />
						</div>
						<div className="flex-1 space-y-2">
							<h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
								Insights Inteligentes
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
								Continue registrando suas compras para receber insights semanais personalizados da nossa IA. Analisamos seus padrões de consumo para oferecer dicas valiosas.
							</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
