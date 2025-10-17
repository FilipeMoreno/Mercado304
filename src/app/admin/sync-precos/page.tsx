"use client"

import { AlertCircle, CheckCircle, FileText, Loader2, Pause, Play, RefreshCw, XCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SyncJob {
	id: string
	status: string
	tipo: string
	progresso: number
	mercadosProcessados: number
	produtosProcessados: number
	precosRegistrados: number
	erros: string[]
	logs: string[]
	detalhes?: {
		mercado: string
		produtos: number
		precos: number
	}[]
	startedAt?: string
	completedAt?: string
	createdAt: string
}

export default function AdminSyncPrecosPage() {
	const [currentJob, setCurrentJob] = useState<SyncJob | null>(null)
	const [polling, setPolling] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(true)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	const fetchLatestJob = useCallback(async () => {
		try {
			const response = await fetch("/api/admin/sync-precos/latest")
			if (response.ok) {
				const data = await response.json()
				if (data.job) {
					setCurrentJob(data.job)
				}
			}
		} catch (error) {
			console.error("Erro ao buscar último job:", error)
		}
	}, [])

	const fetchJobStatus = useCallback(async (jobId: string) => {
		try {
			setPolling(true)
			const response = await fetch(`/api/admin/sync-precos/status/${jobId}`)
			if (response.ok) {
				const job = await response.json()
				setCurrentJob(job)
			}
		} catch (error) {
			console.error("Erro ao buscar status:", error)
		} finally {
			setPolling(false)
		}
	}, [])

	// Buscar último job ao carregar
	useEffect(() => {
		fetchLatestJob()
	}, [fetchLatestJob])

	// Polling quando tem job rodando
	useEffect(() => {
		if (!autoRefresh || !currentJob) return
		if (currentJob.status !== "pending" && currentJob.status !== "running") return

		intervalRef.current = setInterval(() => {
			fetchJobStatus(currentJob.id)
		}, 2000) // Atualiza a cada 2 segundos

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [currentJob, autoRefresh, fetchJobStatus])

	const handleStartSync = async () => {
		try {
			const response = await fetch("/api/admin/sync-precos/start", {
				method: "POST",
			})

			if (!response.ok) {
				const error = await response.json()
				if (response.status === 409) {
					toast.error(error.error)
					if (error.jobId) {
						fetchJobStatus(error.jobId)
					}
					return
				}
				throw new Error(error.error || "Erro ao iniciar sincronização")
			}

			const data = await response.json()
			toast.success("Sincronização iniciada em background!")
			
			// Buscar status do job criado
			setTimeout(() => fetchJobStatus(data.jobId), 1000)
		} catch (error) {
			console.error("Erro ao iniciar sincronização:", error)
			toast.error(error instanceof Error ? error.message : "Erro ao iniciar sincronização")
		}
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return <Badge variant="secondary">Aguardando</Badge>
			case "running":
				return (
					<Badge variant="default" className="bg-blue-600">
						<Loader2 className="h-3 w-3 mr-1 animate-spin" />
						Em execução
					</Badge>
				)
			case "completed":
				return (
					<Badge variant="default" className="bg-green-600">
						<CheckCircle className="h-3 w-3 mr-1" />
						Concluído
					</Badge>
				)
			case "failed":
				return (
					<Badge variant="destructive">
						<XCircle className="h-3 w-3 mr-1" />
						Falhou
					</Badge>
				)
			default:
				return <Badge variant="outline">{status}</Badge>
		}
	}

	const isRunning = currentJob?.status === "pending" || currentJob?.status === "running"
	const canStart = !currentJob || (currentJob.status !== "pending" && currentJob.status !== "running")

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Sincronização de Preços - Nota Paraná</h1>
					<p className="text-muted-foreground mt-2">
						Sincronize automaticamente os preços dos seus produtos com dados do Nota Paraná
					</p>
				</div>
				{currentJob && (
					<div className="flex items-center gap-2">
						{getStatusBadge(currentJob.status)}
						{polling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
					</div>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Coluna da esquerda - Controles */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Controle</CardTitle>
							<CardDescription>Inicie ou monitore a sincronização</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button onClick={handleStartSync} disabled={!canStart} size="lg" className="w-full">
								{isRunning ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Sincronizando...
									</>
								) : (
									<>
										<Play className="mr-2 h-4 w-4" />
										Iniciar Sincronização
									</>
								)}
							</Button>

							{isRunning && (
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={() => setAutoRefresh(!autoRefresh)}
										className="flex-1"
									>
										{autoRefresh ? (
											<>
												<Pause className="mr-2 h-3 w-3" />
												Pausar Atualização
											</>
										) : (
											<>
												<Play className="mr-2 h-3 w-3" />
												Retomar Atualização
											</>
										)}
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => currentJob && fetchJobStatus(currentJob.id)}
										disabled={polling}
									>
										<RefreshCw className={`h-3 w-3 ${polling ? "animate-spin" : ""}`} />
									</Button>
								</div>
							)}

							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>Execução em Background</AlertTitle>
								<AlertDescription className="text-xs">
									Você pode navegar pelo app enquanto a sincronização acontece. Volte aqui a qualquer momento para ver o progresso.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>

					{currentJob && (
						<Card>
							<CardHeader>
								<CardTitle>Como Funciona</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3 text-sm">
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-xs">
											1
										</div>
										<p className="text-muted-foreground">Busca mercados com razão social</p>
									</div>
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-xs">
											2
										</div>
										<p className="text-muted-foreground">Busca produtos com código de barras</p>
									</div>
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-xs">
											3
										</div>
										<p className="text-muted-foreground">Busca preços na API do Nota Paraná</p>
									</div>
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 text-xs">
											4
										</div>
										<p className="text-muted-foreground">Registra preços no banco de dados</p>
									</div>
								</div>
							</CardContent>
						</Card>
					)}
				</div>

				{/* Coluna da direita - Status e Resultados */}
				<div className="lg:col-span-2 space-y-6">
					{currentJob && (
						<>
							{/* Progresso */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center justify-between">
										<span>Progresso</span>
										<span className="text-2xl font-bold text-primary">{currentJob.progresso}%</span>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<Progress value={currentJob.progresso} className="w-full h-4" />
									{isRunning && (
										<p className="text-xs text-muted-foreground mt-2 text-center">
											Atualização automática a cada 2 segundos • Última atualização: agora
										</p>
									)}
								</CardContent>
							</Card>

							{/* Estatísticas */}
							<Card>
								<CardHeader>
									<CardTitle>Estatísticas</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-3 gap-4">
										<div className="text-center p-4 bg-blue-50 rounded-lg">
											<div className="text-3xl font-bold text-blue-600">{currentJob.mercadosProcessados}</div>
											<div className="text-sm text-muted-foreground">Mercados</div>
										</div>
										<div className="text-center p-4 bg-purple-50 rounded-lg">
											<div className="text-3xl font-bold text-purple-600">{currentJob.produtosProcessados}</div>
											<div className="text-sm text-muted-foreground">Produtos</div>
										</div>
										<div className="text-center p-4 bg-green-50 rounded-lg">
											<div className="text-3xl font-bold text-green-600">{currentJob.precosRegistrados}</div>
											<div className="text-sm text-muted-foreground">Preços Registrados</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Detalhes por mercado */}
							{currentJob.detalhes && Array.isArray(currentJob.detalhes) && currentJob.detalhes.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Detalhes por Mercado</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-2">
											{currentJob.detalhes.map((detalhe) => (
												<div
													key={detalhe.mercado}
													className="flex justify-between items-center p-3 bg-accent rounded"
												>
													<span className="font-medium">{detalhe.mercado}</span>
													<div className="flex gap-4 text-sm text-muted-foreground">
														<span>{detalhe.produtos} produtos</span>
														<span className="text-green-600 font-medium">{detalhe.precos} preços</span>
													</div>
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}

							{/* Logs */}
							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<FileText className="h-5 w-5" />
										Logs de Execução
										<Badge variant="outline" className="ml-auto">
											{Array.isArray(currentJob.logs) ? currentJob.logs.length : 0} entradas
										</Badge>
									</CardTitle>
								</CardHeader>
								<CardContent>
									<ScrollArea className="h-[300px] w-full rounded border p-4">
										<div className="space-y-1 font-mono text-xs">
											{Array.isArray(currentJob.logs) && currentJob.logs.length > 0 ? (
												currentJob.logs.map((log) => (
													<div
														key={log}
														className={`${
															log.includes("✓")
																? "text-green-600"
																: log.includes("Erro") || log.includes("erro")
																	? "text-red-600"
																	: "text-muted-foreground"
														}`}
													>
														{log}
													</div>
												))
											) : (
												<div className="text-muted-foreground text-center">Nenhum log ainda</div>
											)}
										</div>
									</ScrollArea>
								</CardContent>
							</Card>

							{/* Erros */}
							{Array.isArray(currentJob.erros) && currentJob.erros.length > 0 && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Erros Encontrados ({currentJob.erros.length})</AlertTitle>
									<AlertDescription>
										<ul className="list-disc list-inside space-y-1 mt-2 text-sm">
											{currentJob.erros.map((erro) => (
												<li key={erro}>{erro}</li>
											))}
										</ul>
									</AlertDescription>
								</Alert>
							)}

							{/* Info do Job */}
							<Card className="bg-muted/50">
								<CardContent className="pt-6">
									<div className="grid grid-cols-2 gap-4 text-sm">
										<div>
											<span className="text-muted-foreground">Job ID:</span>
											<span className="ml-2 font-mono">{currentJob.id}</span>
										</div>
										<div>
											<span className="text-muted-foreground">Tipo:</span>
											<span className="ml-2 font-mono">{currentJob.tipo}</span>
										</div>
										{currentJob.startedAt && (
											<div>
												<span className="text-muted-foreground">Iniciado em:</span>
												<span className="ml-2 font-mono">
													{new Date(currentJob.startedAt).toLocaleString("pt-BR")}
												</span>
											</div>
										)}
										{currentJob.completedAt && (
											<div>
												<span className="text-muted-foreground">Concluído em:</span>
												<span className="ml-2 font-mono">
													{new Date(currentJob.completedAt).toLocaleString("pt-BR")}
												</span>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</>
					)}

					{!currentJob && (
						<Card>
							<CardHeader>
								<CardTitle>Nenhuma Sincronização Executada</CardTitle>
								<CardDescription>Clique no botão ao lado para iniciar a primeira sincronização</CardDescription>
							</CardHeader>
							<CardContent>
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertTitle>Requisitos</AlertTitle>
									<AlertDescription>
										<ul className="list-disc list-inside space-y-1 mt-2 text-sm">
											<li>Mercados devem ter razão social cadastrada</li>
											<li>Produtos devem ter código de barras</li>
											<li>Endereço completo recomendado para múltiplas filiais</li>
										</ul>
									</AlertDescription>
								</Alert>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	)
}
