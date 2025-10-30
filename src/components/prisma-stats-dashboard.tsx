"use client"

import { Activity, BarChart3, Database, RefreshCw, Timer, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface PrismaStats {
	totalQueries: number
	recentQueries: Array<{
		model: string
		action: string
		timestamp: number
		duration?: number
	}>
	queriesByModel: Record<string, number>
	queriesByAction: Record<string, number>
	averageDuration: number
}

export function PrismaStatsDashboard() {
	const [stats, setStats] = useState<PrismaStats>({
		totalQueries: 0,
		recentQueries: [],
		queriesByModel: {},
		queriesByAction: {},
		averageDuration: 0,
	})
	const [loading, setLoading] = useState(true)

	const loadStats = async () => {
		try {
			const response = await fetch("/api/admin/prisma-stats")
			if (response.ok) {
				const data = await response.json()
				setStats(data)
			}
		} catch (error) {
			console.error("Erro ao carregar estatísticas:", error)
			toast.error("Erro ao carregar estatísticas")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadStats()
		
		// Atualizar a cada 5 segundos
		const interval = setInterval(loadStats, 5000)
		return () => clearInterval(interval)
	}, [])

	const handleReset = async () => {
		try {
			const response = await fetch("/api/admin/prisma-stats/reset", {
				method: "POST",
			})
			
			if (response.ok) {
				toast.success("Contador resetado com sucesso!")
				loadStats()
			} else {
				toast.error("Erro ao resetar contador")
			}
		} catch (error) {
			console.error("Erro ao resetar:", error)
			toast.error("Erro ao resetar contador")
		}
	}

	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{[1, 2, 3].map((i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-32" />
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	const totalQueries = stats.totalQueries
	const topModel = Object.entries(stats.queriesByModel).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"
	const topAction = Object.entries(stats.queriesByAction).sort(([, a], [, b]) => b - a)[0]?.[0] || "N/A"
	const modelCount = Object.keys(stats.queriesByModel).length

	return (
		<div className="space-y-6">
			{/* Cards de resumo */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Total de Queries</CardTitle>
						<Database className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{totalQueries.toLocaleString()}</div>
						<p className="text-xs text-muted-foreground mt-2">
							Desde o último reset
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Modelos Únicos</CardTitle>
						<BarChart3 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{modelCount}</div>
						<p className="text-xs text-muted-foreground mt-2">
							Modelos consultados
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
						<Timer className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">
							{stats.averageDuration > 0 
								? `${stats.averageDuration.toFixed(2)}ms`
								: "N/A"
							}
						</div>
						<p className="text-xs text-muted-foreground mt-2">
							Por query
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Estatísticas detalhadas */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<TrendingUp className="h-5 w-5" />
							Queries por Modelo
						</CardTitle>
						<CardDescription>Top modelos mais consultados</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Object.entries(stats.queriesByModel)
								.sort(([, a], [, b]) => b - a)
								.slice(0, 10)
								.map(([model, count]) => {
									const percentage = totalQueries > 0 ? (count / totalQueries) * 100 : 0
									return (
										<div key={model} className="space-y-1">
											<div className="flex items-center justify-between text-sm">
												<span className="font-medium">{model}</span>
												<Badge variant="secondary">{count}</Badge>
											</div>
											<Progress value={percentage} className="h-2" />
										</div>
									)
								})}
							{Object.keys(stats.queriesByModel).length === 0 && (
								<p className="text-sm text-muted-foreground text-center py-4">
									Nenhuma query registrada ainda
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Activity className="h-5 w-5" />
							Queries por Ação
						</CardTitle>
						<CardDescription>Tipos de operações realizadas</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Object.entries(stats.queriesByAction)
								.sort(([, a], [, b]) => b - a)
								.slice(0, 10)
								.map(([action, count]) => {
									const percentage = totalQueries > 0 ? (count / totalQueries) * 100 : 0
									return (
										<div key={action} className="space-y-1">
											<div className="flex items-center justify-between text-sm">
												<span className="font-medium">{action}</span>
												<Badge variant="secondary">{count}</Badge>
											</div>
											<Progress value={percentage} className="h-2" />
										</div>
									)
								})}
							{Object.keys(stats.queriesByAction).length === 0 && (
								<p className="text-sm text-muted-foreground text-center py-4">
									Nenhuma ação registrada ainda
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Queries recentes */}
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<RefreshCw className="h-5 w-5" />
							Queries Recentes
						</CardTitle>
						<CardDescription>Últimas 20 queries executadas</CardDescription>
					</div>
					<Button onClick={handleReset} variant="outline" size="sm">
						Resetar Contador
					</Button>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						{stats.recentQueries.slice().reverse().map((query, index) => (
							<div
								key={index}
								className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
							>
								<div className="flex items-center gap-3">
									<Badge variant="outline">{query.model}</Badge>
									<span className="text-sm font-medium">{query.action}</span>
								</div>
								<div className="flex items-center gap-3 text-xs text-muted-foreground">
									{query.duration && <span>{query.duration.toFixed(2)}ms</span>}
									<span>{new Date(query.timestamp).toLocaleTimeString()}</span>
								</div>
							</div>
						))}
						{stats.recentQueries.length === 0 && (
							<p className="text-sm text-muted-foreground text-center py-4">
								Nenhuma query recente registrada
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

// Componente de skeleton para loading
function Skeleton({ className }: { className?: string }) {
	return <div className={`animate-pulse rounded-md bg-muted ${className}`} />
}

