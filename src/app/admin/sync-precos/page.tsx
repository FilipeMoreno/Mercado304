"use client"

import {
	AlertCircle,
	Ban,
	Bug,
	CheckCircle,
	Cloud,
	Database,
	FileText,
	History,
	Loader2,
	Pause,
	Play,
	RefreshCw,
	Rocket,
	Upload,
	XCircle,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useEffectEvent, useId, useRef, useState } from "react"
import { toast } from "sonner"
import { ServerStatusBanner } from "@/components/admin/ServerStatusBanner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"

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
		estimativaSegundos?: number
		produtosProcessadosAtual?: number
		produtosTotal?: number
		quantidadeProdutosNaoEncontrados?: number
		batchAtual?: number
		totalBatches?: number
		produtosPorBatch?: number
		mercados?: {
			mercado: string
			mercadoId: string
			itens: {
				produto: string
				preco: number
				data: string
			}[]
		}[]
		produtosNaoEncontrados?: {
			id: string
			nome: string
			barcode: string
		}[]
		estatisticas?: {
			produtosTotal: number
			produtosEncontrados: number
			produtosNaoEncontrados: number
			precosRegistrados: number
			tempoTotalSegundos: number
		}
		// 🚀 NOVOS CAMPOS - Progresso Detalhado
		currentPhase?: "collecting" | "importing" | "backing_up" | "cleanup" | "completed"
		parallelWorkers?: number
		stagingStats?: {
			totalRecords: number
			uniqueProducts: number
			uniqueMarkets: number
			avgPrice: number
		}
		importProgress?: {
			imported: number
			skipped: number
			errors: number
			workersActive: number
		}
		backupProgress?: {
			status: "pending" | "compressing" | "uploading" | "completed" | "skipped"
			originalSize?: number
			compressedSize?: number
			compressionRatio?: number
			url?: string
		}
		persistentStaging?: {
			enabled: boolean
			retentionDays?: number
			willDeleteAt?: string
		}
	}
	startedAt?: string
	completedAt?: string
	createdAt: string
	_logsInfo?: {
		totalLogs: number
		filteredLogs: number
		debugMode: boolean
		limit: number
	}
}

export default function AdminSyncPrecosPage() {
	const searchParams = useSearchParams()
	const jobIdFromUrl = searchParams.get("jobId")
	const debugSwitchId = useId()

	const [currentJob, setCurrentJob] = useState<SyncJob | null>(null)
	const [polling, setPolling] = useState(false)
	const [loading, setLoading] = useState(true)
	const [autoRefresh, setAutoRefresh] = useState(true)
	const [expandedMercado, setExpandedMercado] = useState<string | null>(null)
	const [showProdutosNaoEncontrados, setShowProdutosNaoEncontrados] = useState(false)
	const [debugMode, setDebugMode] = useState(false)
	const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
	const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>("agora")
	const [showCancelDialog, setShowCancelDialog] = useState(false)
	const [_serverHealth, setServerHealth] = useState<{
		status: string
		timestamp: string
		services: {
			database: string
			redis: string
		}
	} | null>(null)
	const [_serverInfo, setServerInfo] = useState<{
		message: string
		status: string
		timestamp: string
		version: string
	} | null>(null)
	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const updateTimerRef = useRef<NodeJS.Timeout | null>(null)

	// useEffectEvent - funções estáveis para usar em effects sem causar re-renders
	const fetchLatestJob = useEffectEvent(async () => {
		try {
			setLoading(true)
			const response = await fetch(`/api/admin/sync-precos/latest?debug=${debugMode}&limit=2000`)
			if (response.ok) {
				const data = await response.json()
				if (data.job) {
					setCurrentJob(data.job)
					setLastUpdateTime(new Date()) // Marcar hora da atualização

					if (data.job._logsInfo) {
					}
				} else {
					setCurrentJob(null)
				}
			}
		} catch (error) {
			console.error("Erro ao buscar último job:", error)
		} finally {
			setLoading(false)
		}
	})

	const fetchJobStatus = useEffectEvent(async (jobId: string) => {
		try {
			setPolling(true)
			setLoading(true)
			const response = await fetch(`/api/admin/sync-precos/status/${jobId}?debug=${debugMode}&limit=2000`)
			if (response.ok) {
				const job = await response.json()
				setCurrentJob(job)
				setLastUpdateTime(new Date()) // Marcar hora da atualização
				if (job._logsInfo) {
				}
			}
		} catch (error) {
			console.error("Erro ao buscar status:", error)
		} finally {
			setPolling(false)
			setLoading(false)
		}
	})

	const fetchServerHealth = useEffectEvent(async () => {
		const serverUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL

		// Se não houver servidor externo configurado, não tente buscar para evitar erros de CORS/conn
		if (!serverUrl) {
			setServerInfo(null)
			setServerHealth(null)
			return
		}

		try {
			const base = serverUrl.replace(/\/$/, "")

			// Buscar informações do servidor (endpoint raiz)
			try {
				const serverResponse = await fetch(`${base}/`, { cache: "no-store" })
				if (serverResponse.ok) {
					const serverData = await serverResponse.json()
					setServerInfo(serverData)
				} else {
					setServerInfo(null)
				}
			} catch {
				setServerInfo(null)
			}

			// Buscar status de saúde
			try {
				const healthResponse = await fetch(`${base}/health`, { cache: "no-store" })
				if (healthResponse.ok) {
					const health = await healthResponse.json()
					setServerHealth(health)
				} else {
					setServerHealth({
						status: "unhealthy",
						timestamp: new Date().toISOString(),
						services: { database: "unknown", redis: "unknown" },
					})
				}
			} catch {
				setServerHealth({
					status: "unhealthy",
					timestamp: new Date().toISOString(),
					services: { database: "disconnected", redis: "disconnected" },
				})
			}
		} catch {
			// Silenciar erros para evitar "Failed to fetch" no console do usuário
			setServerInfo(null)
			setServerHealth({
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				services: { database: "disconnected", redis: "disconnected" },
			})
		}
	})

	// Buscar job ao carregar (se tiver jobId na URL, busca ele, senão busca o último)
	useEffect(() => {
		const loadInitialJob = async () => {
			if (jobIdFromUrl) {
				await fetchJobStatus(jobIdFromUrl)
			} else {
				await fetchLatestJob()
			}
		}

		loadInitialJob()
	}, [jobIdFromUrl])

	// Buscar status de saúde do servidor ao carregar e periodicamente
	useEffect(() => {
		// Buscar imediatamente
		fetchServerHealth()

		// Buscar a cada 30 segundos
		const healthInterval = setInterval(fetchServerHealth, 30000)

		return () => clearInterval(healthInterval)
	}, [])

	// Atualizar contador de tempo desde última atualização
	useEffect(() => {
		if (!lastUpdateTime) return

		const updateTimer = () => {
			const now = new Date()
			const diffMs = now.getTime() - lastUpdateTime.getTime()
			const diffSeconds = Math.floor(diffMs / 1000)

			if (diffSeconds < 5) {
				setTimeSinceUpdate("agora")
			} else if (diffSeconds < 60) {
				setTimeSinceUpdate(`há ${diffSeconds}s`)
			} else {
				const minutes = Math.floor(diffSeconds / 60)
				const seconds = diffSeconds % 60
				setTimeSinceUpdate(`há ${minutes}m ${seconds}s`)
			}
		}

		// Atualizar imediatamente
		updateTimer()

		// Atualizar a cada segundo
		updateTimerRef.current = setInterval(updateTimer, 1000)

		return () => {
			if (updateTimerRef.current) {
				clearInterval(updateTimerRef.current)
			}
		}
	}, [lastUpdateTime])

	// Polling quando tem job rodando (requisições a cada 2s)
	useEffect(() => {
		if (!autoRefresh || !currentJob) return
		if (currentJob.status !== "pending" && currentJob.status !== "running") return

		intervalRef.current = setInterval(() => {
			fetchJobStatus(currentJob.id)
		}, 2000) // Requisições ao servidor a cada 2 segundos

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current)
			}
		}
	}, [currentJob?.id, currentJob?.status, autoRefresh, currentJob])

	const handleStartSync = async () => {
		// Verificar se já existe uma sync em andamento
		if (isRunning) {
			toast.error("Já existe uma sincronização em andamento!")
			return
		}

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

			const _data = await response.json()
			toast.success("Sincronização iniciada em background!")

			// Buscar o último job da tabela SyncJob (não o ID do BullMQ)
			setTimeout(() => fetchLatestJob(), 1000)
		} catch (error) {
			console.error("Erro ao iniciar sincronização:", error)
			toast.error(error instanceof Error ? error.message : "Erro ao iniciar sincronização")
		}
	}

	const handleCancelSync = async () => {
		if (!currentJob) return

		// Abrir dialog de confirmação
		setShowCancelDialog(true)
	}

	const confirmCancelSync = async () => {
		if (!currentJob) return

		try {
			const response = await fetch(`/api/admin/sync-precos/cancel/${currentJob.id}`, {
				method: "POST",
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || "Erro ao cancelar sincronização")
			}

			const data = await response.json()
			toast.success("Sincronização cancelada!")

			// Atualizar status do job
			setCurrentJob(data.job)

			// Fechar dialog
			setShowCancelDialog(false)
		} catch (error) {
			console.error("Erro ao cancelar sincronização:", error)
			toast.error(error instanceof Error ? error.message : "Erro ao cancelar sincronização")
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
			case "cancelled":
				return (
					<Badge variant="outline" className="border-orange-600 text-orange-600">
						<Ban className="h-3 w-3 mr-1" />
						Cancelado
					</Badge>
				)
			default:
				return <Badge variant="outline">{status}</Badge>
		}
	}

	const isRunning = currentJob?.status === "pending" || currentJob?.status === "running"
	const canStart = !currentJob || (currentJob.status !== "pending" && currentJob.status !== "running")

	// Formatar tempo estimado
	const formatarTempoEstimado = (segundos: number) => {
		if (segundos < 60) return `${segundos}s`
		const minutos = Math.floor(segundos / 60)
		const segs = segundos % 60
		return `${minutos}m ${segs}s`
	}

	// Formatar preço
	const formatarPreco = (valor: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(valor)
	}

	// Formatar bytes
	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 Bytes"
		const k = 1024
		const sizes = ["Bytes", "KB", "MB", "GB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
	}

	// Obter badge da fase atual
	const getPhaseBadge = (phase?: string) => {
		switch (phase) {
			case "collecting":
				return (
					<Badge variant="default" className="bg-blue-600">
						📦 Coletando Preços
					</Badge>
				)
			case "importing":
				return (
					<Badge variant="default" className="bg-purple-600">
						<Rocket className="h-3 w-3 mr-1" />
						Importação Paralela
					</Badge>
				)
			case "backing_up":
				return (
					<Badge variant="default" className="bg-orange-600">
						<Cloud className="h-3 w-3 mr-1" />
						Backup & Finalização
					</Badge>
				)
			case "completed":
				return (
					<Badge variant="default" className="bg-green-600">
						<CheckCircle className="h-3 w-3 mr-1" />
						Concluído
					</Badge>
				)
			default:
				return null
		}
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			{/* Banner de Status do Servidor */}
			<ServerStatusBanner />

			<div className="mb-8">
				<div className="flex items-center justify-between mb-4">
					<div className="flex-1">
						<div className="flex items-center gap-4 mb-2">
							<h1 className="text-3xl font-bold">Sincronização de Preços - Nota Paraná</h1>
							<Link href="/admin/sync-precos/historico">
								<Button variant="outline" size="sm">
									<History className="h-4 w-4 mr-2" />
									Histórico
								</Button>
							</Link>
						</div>
						<p className="text-muted-foreground">
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

				{/* Switch de Debug Mode */}
				<div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
					<Bug className="h-5 w-5 text-muted-foreground" />
					<div className="flex-1">
						<Label htmlFor={debugSwitchId} className="text-sm font-medium cursor-pointer">
							Modo Debug
						</Label>
						<p className="text-xs text-muted-foreground">Exibe logs detalhados do servidor, API e processamento</p>
					</div>
					<Switch
						id={debugSwitchId}
						checked={debugMode}
						onCheckedChange={(checked) => {
							setDebugMode(checked)
							// Recarregar dados com novo modo de debug
							if (currentJob) {
								fetchJobStatus(currentJob.id)
							} else {
								fetchLatestJob()
							}
						}}
					/>
				</div>
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
							<Button onClick={handleStartSync} disabled={!canStart || loading} size="lg" className="w-full">
								{loading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Carregando...
									</>
								) : isRunning ? (
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
								<>
									<Button onClick={handleCancelSync} variant="destructive" size="lg" className="w-full">
										<Ban className="mr-2 h-4 w-4" />
										Cancelar Sincronização
									</Button>

									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setAutoRefresh(!autoRefresh)}
											className="flex-1"
											title={
												autoRefresh
													? "Pausar atualização automática da página"
													: "Retomar atualização automática da página"
											}
										>
											{autoRefresh ? (
												<>
													<Pause className="mr-2 h-3 w-3" />
													Pausar Auto-Refresh
												</>
											) : (
												<>
													<Play className="mr-2 h-3 w-3" />
													Retomar Auto-Refresh
												</>
											)}
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => currentJob && fetchJobStatus(currentJob.id)}
											disabled={polling}
											title="Atualizar status manualmente"
										>
											<RefreshCw className={`h-3 w-3 ${polling ? "animate-spin" : ""}`} />
										</Button>
									</div>
								</>
							)}

							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>🚀 Sistema Otimizado</AlertTitle>
								<AlertDescription className="text-xs">
									<strong>Staging Database:</strong> Coleta ultra-rápida em SQLite local
									<br />
									<strong>Importação Paralela:</strong> 4 workers simultâneos (2-4x mais rápido)
									<br />
									<strong>Backup Automático:</strong> Salvamento comprimido no Cloudflare R2
									<br />
									<strong>Persistent Staging:</strong> Arquivo mantido por 2 dias para recovery
									<br />
									<br />
									<strong>Botões:</strong> "Cancelar" para interromper, "Pausar Auto-Refresh" para parar atualizações.
								</AlertDescription>
							</Alert>
						</CardContent>
					</Card>

					{currentJob && (
						<Card>
							<CardHeader>
								<CardTitle>Como Funciona 🚀</CardTitle>
								<CardDescription>Processo otimizado com staging database</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3 text-sm">
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
											1
										</div>
										<div>
											<p className="font-medium">Busca mercados e produtos</p>
											<p className="text-xs text-muted-foreground">Razão social e códigos de barras</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
											2
										</div>
										<div>
											<p className="font-medium">📦 Coleta rápida no staging</p>
											<p className="text-xs text-muted-foreground">SQLite local para máxima velocidade</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
											3
										</div>
										<div>
											<p className="font-medium">🚀 Importação paralela</p>
											<p className="text-xs text-muted-foreground">4 workers simultâneos no PostgreSQL</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
											4
										</div>
										<div>
											<p className="font-medium">☁️ Backup automático</p>
											<p className="text-xs text-muted-foreground">Compressão e envio para R2</p>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs">
											5
										</div>
										<div>
											<p className="font-medium">💾 Persistent staging</p>
											<p className="text-xs text-muted-foreground">Mantido por 2 dias para recovery</p>
										</div>
									</div>
								</div>

								<Alert className="mt-4 bg-purple-50 border-purple-200">
									<Rocket className="h-4 w-4 text-purple-600" />
									<AlertDescription className="text-xs text-purple-700">
										<strong>2-4x mais rápido</strong> que o método tradicional graças à importação paralela!
									</AlertDescription>
								</Alert>
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
								<CardContent className="space-y-3">
									<Progress value={currentJob.progresso} className="w-full h-4" />

									{/* Informações do progresso */}
									<div className="grid grid-cols-2 gap-4 text-sm">
										{currentJob.detalhes?.produtosProcessadosAtual && currentJob.detalhes?.produtosTotal && (
											<div>
												<span className="text-muted-foreground">Produtos processados:</span>
												<span className="ml-2 font-medium">
													{currentJob.detalhes.produtosProcessadosAtual} / {currentJob.detalhes.produtosTotal}
												</span>
											</div>
										)}

										{currentJob.detalhes?.batchAtual && currentJob.detalhes?.totalBatches && (
											<div>
												<span className="text-muted-foreground">Batch paralelo:</span>
												<span className="ml-2 font-medium text-purple-600">
													{currentJob.detalhes.batchAtual} / {currentJob.detalhes.totalBatches}
													{currentJob.detalhes.produtosPorBatch && (
														<span className="text-xs text-muted-foreground ml-1">
															({currentJob.detalhes.produtosPorBatch} por vez)
														</span>
													)}
												</span>
											</div>
										)}

										{isRunning &&
											currentJob.detalhes?.estimativaSegundos !== undefined &&
											currentJob.detalhes.estimativaSegundos > 0 && (
												<div>
													<span className="text-muted-foreground">Tempo estimado:</span>
													<span className="ml-2 font-medium text-blue-600">
														~{formatarTempoEstimado(currentJob.detalhes.estimativaSegundos)}
													</span>
												</div>
											)}

										{currentJob.detalhes?.estatisticas?.tempoTotalSegundos && (
											<div>
												<span className="text-muted-foreground">Tempo total:</span>
												<span className="ml-2 font-medium">
													{formatarTempoEstimado(currentJob.detalhes.estatisticas.tempoTotalSegundos)}
												</span>
											</div>
										)}
									</div>

									{isRunning && (
										<p className="text-xs text-muted-foreground text-center">
											Atualização automática a cada 2 segundos • Última atualização: {timeSinceUpdate}
										</p>
									)}
								</CardContent>
							</Card>

							{/* 🚀 NOVO: Fase Atual Destacada */}
							{currentJob.detalhes?.currentPhase && (
								<Card className="border-2 border-primary">
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle>Fase Atual</CardTitle>
											{getPhaseBadge(currentJob.detalhes.currentPhase)}
										</div>
									</CardHeader>
									<CardContent>
										{/* Durante Coleta */}
										{currentJob.detalhes.currentPhase === "collecting" && currentJob.detalhes.stagingStats && (
											<div className="space-y-4">
												<Alert className="bg-blue-50 border-blue-200">
													<Database className="h-4 w-4 text-blue-600" />
													<AlertTitle className="text-blue-900">Staging Database Ativo</AlertTitle>
													<AlertDescription className="text-blue-700 text-sm">
														Coletando preços em banco local SQLite para máxima velocidade. Importação para PostgreSQL
														será feita após a coleta.
													</AlertDescription>
												</Alert>

												<div className="grid grid-cols-2 gap-4">
													<div className="bg-blue-50 p-4 rounded-lg text-center">
														<div className="text-3xl font-bold text-blue-600">
															{currentJob.detalhes.stagingStats.totalRecords.toLocaleString()}
														</div>
														<div className="text-sm text-muted-foreground">Preços Coletados</div>
													</div>
													<div className="bg-purple-50 p-4 rounded-lg text-center">
														<div className="text-3xl font-bold text-purple-600">
															{currentJob.detalhes.stagingStats.uniqueProducts.toLocaleString()}
														</div>
														<div className="text-sm text-muted-foreground">Produtos Únicos</div>
													</div>
													<div className="bg-green-50 p-4 rounded-lg text-center">
														<div className="text-3xl font-bold text-green-600">
															{currentJob.detalhes.stagingStats.uniqueMarkets}
														</div>
														<div className="text-sm text-muted-foreground">Mercados</div>
													</div>
													<div className="bg-orange-50 p-4 rounded-lg text-center">
														<div className="text-3xl font-bold text-orange-600">
															{formatarPreco(currentJob.detalhes.stagingStats.avgPrice)}
														</div>
														<div className="text-sm text-muted-foreground">Preço Médio</div>
													</div>
												</div>
											</div>
										)}

										{/* Durante Importação */}
										{currentJob.detalhes.currentPhase === "importing" && (
											<div className="space-y-4">
												{/* DESTAQUE: Workers Paralelos */}
												{currentJob.detalhes.parallelWorkers && (
													<Alert className="bg-purple-50 border-purple-200">
														<Rocket className="h-5 w-5 text-purple-600" />
														<AlertTitle className="text-purple-900">🚀 Importação Paralela Ativa</AlertTitle>
														<AlertDescription className="text-purple-700">
															<strong>{currentJob.detalhes.parallelWorkers} workers</strong> processando simultaneamente
															para importação <strong>{currentJob.detalhes.parallelWorkers}x mais rápida</strong>!
														</AlertDescription>
													</Alert>
												)}

												{/* Progresso da Importação */}
												{currentJob.detalhes.importProgress && (
													<div className="space-y-3">
														<div className="flex justify-between text-sm">
															<span className="text-muted-foreground">Registros importados...</span>
															<span className="font-medium">
																{currentJob.detalhes.importProgress.imported.toLocaleString()} /{" "}
																{currentJob.detalhes.stagingStats?.totalRecords.toLocaleString() || "..."}
															</span>
														</div>
														<Progress
															value={
																currentJob.detalhes.stagingStats
																	? (currentJob.detalhes.importProgress.imported /
																			currentJob.detalhes.stagingStats.totalRecords) *
																		100
																	: 0
															}
															className="h-2"
														/>

														<div className="grid grid-cols-3 gap-2">
															<div className="bg-green-50 p-3 rounded text-center">
																<div className="text-2xl font-bold text-green-700">
																	{currentJob.detalhes.importProgress.imported.toLocaleString()}
																</div>
																<div className="text-xs text-green-600">Importados</div>
															</div>
															<div className="bg-yellow-50 p-3 rounded text-center">
																<div className="text-2xl font-bold text-yellow-700">
																	{currentJob.detalhes.importProgress.skipped.toLocaleString()}
																</div>
																<div className="text-xs text-yellow-600">Duplicados</div>
															</div>
															<div className="bg-blue-50 p-3 rounded text-center">
																<div className="text-2xl font-bold text-blue-700">
																	{currentJob.detalhes.importProgress.workersActive}
																</div>
																<div className="text-xs text-blue-600">Workers Ativos</div>
															</div>
														</div>
													</div>
												)}
											</div>
										)}

										{/* Durante Backup */}
										{currentJob.detalhes.currentPhase === "backing_up" && (
											<div className="space-y-4">
												{/* Status do Backup */}
												{currentJob.detalhes.backupProgress && (
													<Alert
														className={
															currentJob.detalhes.backupProgress.status === "completed"
																? "bg-green-50 border-green-200"
																: currentJob.detalhes.backupProgress.status === "skipped"
																	? "bg-gray-50 border-gray-200"
																	: "bg-orange-50 border-orange-200"
														}
													>
														{currentJob.detalhes.backupProgress.status === "completed" ? (
															<CheckCircle className="h-4 w-4 text-green-600" />
														) : currentJob.detalhes.backupProgress.status === "skipped" ? (
															<AlertCircle className="h-4 w-4 text-gray-600" />
														) : (
															<Upload className="h-4 w-4 text-orange-600 animate-pulse" />
														)}
														<AlertTitle
															className={
																currentJob.detalhes.backupProgress.status === "completed"
																	? "text-green-900"
																	: currentJob.detalhes.backupProgress.status === "skipped"
																		? "text-gray-900"
																		: "text-orange-900"
															}
														>
															{currentJob.detalhes.backupProgress.status === "completed" && "✅ Backup Concluído"}
															{currentJob.detalhes.backupProgress.status === "compressing" && "Comprimindo arquivo..."}
															{currentJob.detalhes.backupProgress.status === "uploading" &&
																"Enviando para Cloudflare R2..."}
															{currentJob.detalhes.backupProgress.status === "pending" && "Preparando backup..."}
															{currentJob.detalhes.backupProgress.status === "skipped" && "Backup R2 não configurado"}
														</AlertTitle>
														<AlertDescription
															className={
																currentJob.detalhes.backupProgress.status === "completed"
																	? "text-green-700"
																	: currentJob.detalhes.backupProgress.status === "skipped"
																		? "text-gray-700"
																		: "text-orange-700"
															}
														>
															{currentJob.detalhes.backupProgress.status === "completed" &&
																"Arquivo salvo com sucesso no Cloudflare R2"}
															{currentJob.detalhes.backupProgress.status === "skipped" &&
																"Configure R2_ACCOUNT_ID e R2_ACCESS_KEY_ID para habilitar backups"}
															{currentJob.detalhes.backupProgress.status !== "completed" &&
																currentJob.detalhes.backupProgress.status !== "skipped" &&
																"Aguarde..."}
														</AlertDescription>
													</Alert>
												)}

												{/* Compressão */}
												{currentJob.detalhes.backupProgress?.compressionRatio !== undefined && (
													<div className="bg-blue-50 p-4 rounded border border-blue-200">
														<h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
															<Database className="h-4 w-4" />
															Compressão
														</h4>
														<div className="flex justify-between items-center">
															<span className="text-sm text-blue-700">Tamanho:</span>
															<span className="font-bold text-blue-900">
																{formatBytes(currentJob.detalhes.backupProgress.originalSize || 0)} →{" "}
																{formatBytes(currentJob.detalhes.backupProgress.compressedSize || 0)}
															</span>
														</div>
														<div className="text-xs text-blue-600 mt-1 text-right">
															{((1 - currentJob.detalhes.backupProgress.compressionRatio) * 100).toFixed(0)}% de redução
														</div>
													</div>
												)}

												{/* Persistent Staging */}
												{currentJob.detalhes.persistentStaging?.enabled && (
													<Alert className="bg-indigo-50 border-indigo-200">
														<Database className="h-4 w-4 text-indigo-600" />
														<AlertTitle className="text-indigo-900">Arquivo Mantido para Recovery</AlertTitle>
														<AlertDescription className="text-indigo-700">
															O arquivo ficará disponível por{" "}
															<strong>{currentJob.detalhes.persistentStaging.retentionDays} dias</strong>
															<br />
															Será deletado em:{" "}
															{currentJob.detalhes.persistentStaging.willDeleteAt &&
																new Date(currentJob.detalhes.persistentStaging.willDeleteAt).toLocaleString("pt-BR")}
														</AlertDescription>
													</Alert>
												)}
											</div>
										)}

										{/* Fase Concluída */}
										{currentJob.detalhes.currentPhase === "completed" && currentJob.detalhes.importProgress && (
											<div className="space-y-4">
												<Alert className="bg-green-50 border-green-200">
													<CheckCircle className="h-4 w-4 text-green-600" />
													<AlertTitle className="text-green-900">🎉 Sincronização Concluída!</AlertTitle>
													<AlertDescription className="text-green-700">
														Todos os preços foram coletados e importados com sucesso.
													</AlertDescription>
												</Alert>

												<div className="grid grid-cols-3 gap-4">
													<div className="text-center">
														<div className="text-3xl font-bold text-green-600">
															{currentJob.detalhes.importProgress.imported.toLocaleString()}
														</div>
														<div className="text-sm text-muted-foreground">Preços Importados</div>
													</div>
													<div className="text-center">
														<div className="text-3xl font-bold text-yellow-600">
															{currentJob.detalhes.importProgress.skipped.toLocaleString()}
														</div>
														<div className="text-sm text-muted-foreground">Duplicados</div>
													</div>
													<div className="text-center">
														<div className="text-3xl font-bold text-red-600">
															{currentJob.detalhes.importProgress.errors}
														</div>
														<div className="text-sm text-muted-foreground">Erros</div>
													</div>
												</div>
											</div>
										)}
									</CardContent>
								</Card>
							)}

							{/* Estatísticas */}
							<Card>
								<CardHeader>
									<CardTitle>Estatísticas</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
										<div className="text-center p-4 bg-blue-50 rounded-lg">
											<div className="text-3xl font-bold text-blue-600">{currentJob.mercadosProcessados}</div>
											<div className="text-sm text-muted-foreground">Mercados</div>
										</div>
										<div className="text-center p-4 bg-purple-50 rounded-lg">
											<div className="text-3xl font-bold text-purple-600">{currentJob.produtosProcessados}</div>
											<div className="text-sm text-muted-foreground">Produtos Total</div>
										</div>
										<div className="text-center p-4 bg-green-50 rounded-lg">
											<div className="text-3xl font-bold text-green-600">{currentJob.precosRegistrados}</div>
											<div className="text-sm text-muted-foreground">Preços Registrados</div>
										</div>
										<div className="text-center p-4 bg-orange-50 rounded-lg">
											<div className="text-3xl font-bold text-orange-600">
												{currentJob.detalhes?.quantidadeProdutosNaoEncontrados ||
													currentJob.detalhes?.estatisticas?.produtosNaoEncontrados ||
													(Array.isArray(currentJob.detalhes?.produtosNaoEncontrados)
														? currentJob.detalhes.produtosNaoEncontrados.length
														: 0)}
											</div>
											<div className="text-sm text-muted-foreground">Não Encontrados</div>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Detalhes por mercado com itens */}
							{currentJob.detalhes?.mercados &&
								Array.isArray(currentJob.detalhes.mercados) &&
								currentJob.detalhes.mercados.length > 0 && (
									<Card>
										<CardHeader>
											<CardTitle>Detalhes por Mercado</CardTitle>
											<CardDescription>Clique para expandir e ver todos os itens registrados</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												{currentJob.detalhes.mercados.map((mercado) => (
													<div key={mercado.mercadoId} className="border rounded-lg overflow-hidden">
														{/* Header do mercado */}
														<button
															type="button"
															onClick={() =>
																setExpandedMercado(expandedMercado === mercado.mercadoId ? null : mercado.mercadoId)
															}
															className="w-full flex justify-between items-center p-4 bg-accent hover:bg-accent/80 transition-colors"
														>
															<span className="font-medium">{mercado.mercado}</span>
															<div className="flex gap-4 items-center text-sm">
																<span className="text-muted-foreground">{mercado.itens?.length || 0} itens</span>
																<Badge variant="default" className="bg-green-600">
																	{mercado.itens?.length || 0} preços
																</Badge>
																<span className="text-lg">{expandedMercado === mercado.mercadoId ? "▼" : "▶"}</span>
															</div>
														</button>

														{/* Lista de itens expandida */}
														{expandedMercado === mercado.mercadoId && (
															<div className="p-4 bg-background border-t">
																<ScrollArea className="h-[300px]">
																	<div className="space-y-2">
																		{mercado.itens && mercado.itens.length > 0 ? (
																			mercado.itens.map((item, idx) => (
																				<div
																					key={`${item.produto}-${idx}`}
																					className="flex justify-between items-center p-3 bg-muted/50 rounded text-sm"
																				>
																					<div className="flex-1">
																						<div className="font-medium">{item.produto}</div>
																						<div className="text-xs text-muted-foreground">
																							{new Date(item.data).toLocaleString("pt-BR")}
																						</div>
																					</div>
																					<div className="text-lg font-bold text-green-600">
																						{formatarPreco(item.preco)}
																					</div>
																				</div>
																			))
																		) : (
																			<div className="text-center text-muted-foreground py-4">
																				Nenhum item encontrado para este mercado
																			</div>
																		)}
																	</div>
																</ScrollArea>
															</div>
														)}
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								)}

							{/* Produtos não encontrados */}
							{((Array.isArray(currentJob.detalhes?.produtosNaoEncontrados) &&
								currentJob.detalhes.produtosNaoEncontrados.length > 0) ||
								(currentJob.detalhes?.estatisticas?.produtosNaoEncontrados &&
									currentJob.detalhes.estatisticas.produtosNaoEncontrados > 0)) && (
								<Card className="border-orange-200 bg-orange-50/30">
									<CardHeader>
										<CardTitle className="flex items-center justify-between">
											<span className="flex items-center gap-2">
												<AlertCircle className="h-5 w-5 text-orange-600" />
												Produtos Não Encontrados
											</span>
											<Badge variant="outline" className="border-orange-600 text-orange-600">
												{currentJob.detalhes?.estatisticas?.produtosNaoEncontrados ||
													(Array.isArray(currentJob.detalhes?.produtosNaoEncontrados)
														? currentJob.detalhes.produtosNaoEncontrados.length
														: 0)}
											</Badge>
										</CardTitle>
										<CardDescription>
											Produtos com código de barras que não foram encontrados na API do Nota Paraná
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Button
											variant="outline"
											onClick={() => setShowProdutosNaoEncontrados(!showProdutosNaoEncontrados)}
											className="w-full mb-3"
										>
											{showProdutosNaoEncontrados ? "Ocultar Lista" : "Ver Lista Completa"}
										</Button>

										{showProdutosNaoEncontrados && Array.isArray(currentJob.detalhes?.produtosNaoEncontrados) && (
											<ScrollArea className="h-[300px] border rounded p-4">
												<div className="space-y-2">
													{currentJob.detalhes.produtosNaoEncontrados.map((produto) => (
														<div
															key={produto.id}
															className="flex justify-between items-center p-3 bg-background rounded text-sm"
														>
															<div>
																<div className="font-medium">{produto.nome}</div>
																<div className="text-xs text-muted-foreground">EAN: {produto.barcode}</div>
															</div>
															<Badge variant="outline" className="text-orange-600">
																Não encontrado
															</Badge>
														</div>
													))}
												</div>
											</ScrollArea>
										)}

										{!showProdutosNaoEncontrados && (
											<Alert>
												<AlertDescription className="text-sm">
													💡 Esses produtos podem não estar cadastrados nos estabelecimentos próximos ou o código de
													barras pode estar incorreto.
												</AlertDescription>
											</Alert>
										)}
									</CardContent>
								</Card>
							)}

							{/* Logs */}
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<FileText className="h-5 w-5" />
											<CardTitle>{debugMode ? "Logs Detalhados (Debug)" : "Logs de Execução"}</CardTitle>
											<Badge variant="outline">
												{Array.isArray(currentJob.logs) ? currentJob.logs.length : 0}
												{currentJob._logsInfo && (
													<span className="text-xs text-muted-foreground ml-1">
														/ {currentJob._logsInfo.totalLogs} total
													</span>
												)}
											</Badge>
										</div>
										<div className="flex items-center gap-2">
											<Button variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)} className="text-xs">
												<Bug className="h-3 w-3 mr-1" />
												{debugMode ? "Modo Normal" : "Modo Debug"}
											</Button>
										</div>
									</div>
									<CardDescription>
										{debugMode
											? "Modo debug ativo: exibindo logs do servidor, API e processamento detalhado"
											: "Logs essenciais filtrados (ative debug para mais detalhes)"}
										{currentJob._logsInfo && (
											<span className="block text-xs text-muted-foreground mt-1">
												Exibindo {currentJob._logsInfo.filteredLogs} de {currentJob._logsInfo.totalLogs} logs
												{currentJob._logsInfo.totalLogs > currentJob._logsInfo.limit &&
													` (limitado a ${currentJob._logsInfo.limit})`}
											</span>
										)}
									</CardDescription>
								</CardHeader>
								<CardContent>
									{/* Estatísticas de logs no modo debug */}
									{debugMode && currentJob._logsInfo && (
										<div className="mb-4 p-3 bg-muted/50 rounded-lg border">
											<h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
												<Bug className="h-4 w-4" />
												Estatísticas de Logs
											</h4>
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
												<div>
													<span className="text-muted-foreground">Total de logs:</span>
													<span className="ml-1 font-mono font-semibold">{currentJob._logsInfo.totalLogs}</span>
												</div>
												<div>
													<span className="text-muted-foreground">Exibindo:</span>
													<span className="ml-1 font-mono font-semibold text-blue-600">
														{currentJob._logsInfo.filteredLogs}
													</span>
												</div>
												<div>
													<span className="text-muted-foreground">Filtrados:</span>
													<span className="ml-1 font-mono font-semibold text-orange-600">
														{currentJob._logsInfo.totalLogs - currentJob._logsInfo.filteredLogs}
													</span>
												</div>
												<div>
													<span className="text-muted-foreground">Limite:</span>
													<span className="ml-1 font-mono font-semibold">{currentJob._logsInfo.limit}</span>
												</div>
											</div>
										</div>
									)}

									<ScrollArea className="h-[300px] w-full rounded border p-4">
										<div className="space-y-1 font-mono text-xs whitespace-pre-wrap break-all">
											{Array.isArray(currentJob.logs) && currentJob.logs.length > 0 ? (
												currentJob.logs.map((log, index) => {
													// Colorir baseado no tipo de log
													let colorClass = "text-muted-foreground"
													let icon = ""

													if (log.includes("✓")) {
														colorClass = "text-green-600"
														icon = "✓"
													} else if (log.includes("Erro") || log.includes("erro")) {
														colorClass = "text-red-600"
														icon = "✗"
													} else if (log.includes("[DEBUG]")) {
														colorClass = "text-blue-500"
														icon = "🐛"
													} else if (log.includes("[API]")) {
														colorClass = "text-purple-500"
														icon = "🌐"
													} else if (log.includes("[SERVER]")) {
														colorClass = "text-orange-500"
														icon = "🖥️"
													} else if (log.includes("[BATCH]")) {
														colorClass = "text-cyan-500"
														icon = "📦"
													} else if (log.includes("[PARSING]")) {
														colorClass = "text-pink-500"
														icon = "🔍"
													} else if (log.includes("⚠")) {
														colorClass = "text-orange-600"
														icon = "⚠"
													} else if (log.includes("Iniciando") || log.includes("iniciando")) {
														colorClass = "text-blue-600"
														icon = "🚀"
													} else if (log.includes("Concluído") || log.includes("concluído")) {
														colorClass = "text-green-600"
														icon = "✅"
													}

													// No modo debug, adicionar informações extras
													const showDebugInfo =
														debugMode && (log.includes("[DEBUG]") || log.includes("[API]") || log.includes("[SERVER]"))

													return (
														<div
															key={`log-${currentJob.id}-${index}`}
															className={`${colorClass} ${showDebugInfo ? "bg-muted/30 p-2 rounded border-l-2 border-current" : ""}`}
														>
															{debugMode && (
																<div className="flex items-center gap-2 mb-1">
																	<span className="text-xs opacity-70">#{index + 1}</span>
																	{icon && <span className="text-sm">{icon}</span>}
																	<span className="text-xs opacity-70">
																		{new Date().toLocaleTimeString("pt-BR", {
																			hour12: false,
																			hour: "2-digit",
																			minute: "2-digit",
																			second: "2-digit",
																		})}
																	</span>
																</div>
															)}
															<div className={debugMode ? "ml-4" : ""}>{log}</div>
															{showDebugInfo && (
																<div className="text-xs opacity-60 mt-1 ml-4">
																	{log.includes("[DEBUG]") && "🔧 Informação técnica detalhada"}
																	{log.includes("[API]") && "🌐 Comunicação com API externa"}
																	{log.includes("[SERVER]") && "🖥️ Processamento interno do servidor"}
																	{log.includes("[BATCH]") && "📦 Processamento em lotes"}
																	{log.includes("[PARSING]") && "🔍 Análise e processamento de dados"}
																</div>
															)}
														</div>
													)
												})
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
												<span className="ml-2 font-mono">{new Date(currentJob.startedAt).toLocaleString("pt-BR")}</span>
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

			{/* Dialog de Confirmação de Cancelamento */}
			<Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<Ban className="h-5 w-5 text-destructive" />
							Cancelar Sincronização
						</DialogTitle>
						<DialogDescription>
							Tem certeza que deseja cancelar a sincronização em andamento?
							<br />
							<br />
							<span className="text-sm text-muted-foreground">
								Esta ação irá interromper o processamento atual e não poderá ser desfeita.
							</span>
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-col sm:flex-row gap-2">
						<Button variant="outline" onClick={() => setShowCancelDialog(false)} className="w-full sm:w-auto">
							Manter Executando
						</Button>
						<Button variant="destructive" onClick={confirmCancelSync} className="w-full sm:w-auto">
							<Ban className="h-4 w-4 mr-2" />
							Sim, Cancelar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
