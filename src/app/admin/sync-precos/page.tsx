"use client"

import {
	AlertCircle,
	Ban,
	Bug,
	CheckCircle,
	FileText,
	History,
	Loader2,
	Pause,
	Play,
	RefreshCw,
	XCircle,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
	}
	startedAt?: string
	completedAt?: string
	createdAt: string
}

export default function AdminSyncPrecosPage() {
	const searchParams = useSearchParams()
	const jobIdFromUrl = searchParams.get("jobId")

	const [currentJob, setCurrentJob] = useState<SyncJob | null>(null)
	const [polling, setPolling] = useState(false)
	const [autoRefresh, setAutoRefresh] = useState(true)
	const [expandedMercado, setExpandedMercado] = useState<string | null>(null)
	const [showProdutosNaoEncontrados, setShowProdutosNaoEncontrados] = useState(false)
	const [debugMode, setDebugMode] = useState(false)
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

	// Buscar job ao carregar (se tiver jobId na URL, busca ele, senão busca o último)
	useEffect(() => {
		if (jobIdFromUrl) {
			fetchJobStatus(jobIdFromUrl)
		} else {
			fetchLatestJob()
		}
	}, [jobIdFromUrl, fetchLatestJob, fetchJobStatus])

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

	const handleCancelSync = async () => {
		if (!currentJob) return

		// Confirmar cancelamento
		if (!confirm("Tem certeza que deseja cancelar a sincronização em andamento?")) {
			return
		}

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

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
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
						<Label htmlFor="debug-mode" className="text-sm font-medium cursor-pointer">
							Modo Debug
						</Label>
						<p className="text-xs text-muted-foreground">Exibe logs detalhados do servidor, API e processamento</p>
					</div>
					<Switch id="debug-mode" checked={debugMode} onCheckedChange={setDebugMode} />
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
								<>
									<Button onClick={handleCancelSync} variant="destructive" size="lg" className="w-full">
										<Ban className="mr-2 h-4 w-4" />
										Cancelar Sincronização
									</Button>

									<div className="flex items-center gap-2">
										<Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)} className="flex-1">
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
								</>
							)}

							<Alert>
								<AlertCircle className="h-4 w-4" />
								<AlertTitle>🚀 Processamento Paralelo</AlertTitle>
								<AlertDescription className="text-xs">
									A sincronização processa múltiplos produtos simultaneamente (5 por vez) para maior velocidade. Você
									pode navegar pelo app enquanto isso acontece.
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
											Atualização automática a cada 10 segundos • Última atualização: agora
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
																<span className="text-muted-foreground">{mercado.itens.length} itens</span>
																<Badge variant="default" className="bg-green-600">
																	{mercado.itens.length} preços
																</Badge>
																<span className="text-lg">{expandedMercado === mercado.mercadoId ? "▼" : "▶"}</span>
															</div>
														</button>

														{/* Lista de itens expandida */}
														{expandedMercado === mercado.mercadoId && (
															<div className="p-4 bg-background border-t">
																<ScrollArea className="h-[300px]">
																	<div className="space-y-2">
																		{mercado.itens.map((item, idx) => (
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
																		))}
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
									<CardTitle className="flex items-center gap-2">
										<FileText className="h-5 w-5" />
										{debugMode ? "Logs Detalhados (Debug)" : "Logs de Execução"}
										<Badge variant="outline" className="ml-auto">
											{Array.isArray(currentJob.logs) ? currentJob.logs.length : 0} entradas
										</Badge>
									</CardTitle>
									{debugMode && (
										<CardDescription>
											Modo debug ativo: exibindo logs do servidor, API e processamento detalhado
										</CardDescription>
									)}
								</CardHeader>
								<CardContent>
									<ScrollArea className="h-[300px] w-full rounded border p-4">
										<div className="space-y-1 font-mono text-xs">
											{Array.isArray(currentJob.logs) && currentJob.logs.length > 0 ? (
												currentJob.logs
													.filter((log) => {
														// No modo normal, ocultar logs de debug
														if (!debugMode) {
															return !log.includes("[DEBUG]") && !log.includes("[API]") && !log.includes("[SERVER]")
														}
														return true
													})
													.map((log, index) => {
														// Colorir baseado no tipo de log
														let colorClass = "text-muted-foreground"
														if (log.includes("✓")) colorClass = "text-green-600"
														else if (log.includes("Erro") || log.includes("erro")) colorClass = "text-red-600"
														else if (log.includes("[DEBUG]")) colorClass = "text-blue-500"
														else if (log.includes("[API]")) colorClass = "text-purple-500"
														else if (log.includes("[SERVER]")) colorClass = "text-orange-500"
														else if (log.includes("⚠")) colorClass = "text-orange-600"

														return (
															<div key={`${log}-${index}`} className={colorClass}>
																{log}
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
		</div>
	)
}
