"use client"

import { AlertCircle, ArrowLeft, Ban, CheckCircle, Clock, Loader2, XCircle } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface SyncJob {
	id: string
	status: string
	tipo: string
	progresso: number
	mercadosProcessados: number
	produtosProcessados: number
	precosRegistrados: number
	startedAt?: string
	completedAt?: string
	createdAt: string
	detalhes?: {
		estatisticas?: {
			produtosTotal: number
			produtosEncontrados: number
			produtosNaoEncontrados: number
			precosRegistrados: number
			tempoTotalSegundos: number
		}
	}
}

interface HistoryResponse {
	jobs: SyncJob[]
	total: number
	limit: number
	offset: number
}

export default function SyncHistoricoPage() {
	const [data, setData] = useState<HistoryResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [page, setPage] = useState(0)
	const limit = 20

	const fetchHistory = useCallback(async (pageNum: number) => {
		setLoading(true)
		try {
			const offset = pageNum * limit
			const response = await fetch(`/api/admin/sync-precos/history?limit=${limit}&offset=${offset}`)
			if (response.ok) {
				const historyData = await response.json()
				setData(historyData)
			}
		} catch (error) {
			console.error("Erro ao buscar histórico:", error)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchHistory(page)
	}, [page, fetchHistory])

	const getStatusBadge = (status: string) => {
		switch (status) {
			case "pending":
				return (
					<Badge variant="secondary">
						<Clock className="h-3 w-3 mr-1" />
						Aguardando
					</Badge>
				)
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

	const formatarTempo = (segundos: number) => {
		if (segundos < 60) return `${segundos}s`
		const minutos = Math.floor(segundos / 60)
		const segs = segundos % 60
		return `${minutos}m ${segs}s`
	}

	const formatarData = (data: string) => {
		return new Date(data).toLocaleString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		})
	}

	const totalPages = data ? Math.ceil(data.total / limit) : 0

	return (
		<div className="container mx-auto py-8 px-4 max-w-7xl">
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<Link href="/admin/sync-precos">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold">Histórico de Sincronizações</h1>
						<p className="text-muted-foreground mt-2">Visualize todas as sincronizações de preços realizadas</p>
					</div>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Sincronizações Realizadas</CardTitle>
					<CardDescription>{data ? `${data.total} sincronizações no total` : "Carregando..."}</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="space-y-2">
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>
					) : data && data.jobs.length > 0 ? (
						<>
							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Status</TableHead>
											<TableHead>Data/Hora</TableHead>
											<TableHead className="text-right">Produtos</TableHead>
											<TableHead className="text-right">Preços</TableHead>
											<TableHead className="text-right">Não Encontrados</TableHead>
											<TableHead className="text-right">Tempo</TableHead>
											<TableHead className="text-right">Ações</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.jobs.map((job) => (
											<TableRow key={job.id}>
												<TableCell>{getStatusBadge(job.status)}</TableCell>
												<TableCell className="font-mono text-sm">{formatarData(job.createdAt)}</TableCell>
												<TableCell className="text-right">
													<div className="font-medium">{job.produtosProcessados}</div>
													{job.detalhes?.estatisticas && (
														<div className="text-xs text-muted-foreground">
															{job.detalhes.estatisticas.produtosEncontrados} encontrados
														</div>
													)}
												</TableCell>
												<TableCell className="text-right">
													<div className="font-medium text-green-600">{job.precosRegistrados}</div>
												</TableCell>
												<TableCell className="text-right">
													<div className="font-medium text-orange-600">
														{job.detalhes?.estatisticas?.produtosNaoEncontrados || 0}
													</div>
												</TableCell>
												<TableCell className="text-right">
													{job.detalhes?.estatisticas?.tempoTotalSegundos ? (
														<div className="font-mono text-sm">
															{formatarTempo(job.detalhes.estatisticas.tempoTotalSegundos)}
														</div>
													) : job.status === "running" ? (
														<Badge variant="secondary" className="text-xs">
															Em andamento
														</Badge>
													) : (
														<span className="text-muted-foreground">-</span>
													)}
												</TableCell>
												<TableCell className="text-right">
													<Link href={`/admin/sync-precos?jobId=${job.id}`}>
														<Button variant="ghost" size="sm">
															Ver detalhes
														</Button>
													</Link>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>

							{/* Paginação */}
							{totalPages > 1 && (
								<div className="flex items-center justify-between mt-4">
									<div className="text-sm text-muted-foreground">
										Página {page + 1} de {totalPages}
									</div>
									<div className="flex gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage(Math.max(0, page - 1))}
											disabled={page === 0}
										>
											Anterior
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
											disabled={page >= totalPages - 1}
										>
											Próxima
										</Button>
									</div>
								</div>
							)}
						</>
					) : (
						<div className="text-center py-12">
							<AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-lg font-semibold mb-2">Nenhuma sincronização encontrada</h3>
							<p className="text-muted-foreground mb-4">Ainda não há sincronizações realizadas no sistema.</p>
							<Link href="/admin/sync-precos">
								<Button>Iniciar primeira sincronização</Button>
							</Link>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
