"use client"

import {
	AlertCircle,
	CheckCircle,
	Clock,
	Database,
	Download,
	Loader2,
	Plus,
	RefreshCw,
	RotateCcw,
	Trash2,
} from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { RestoreBackupDialog } from "@/components/admin/RestoreBackupDialog"
import { ServerStatusBanner } from "@/components/admin/ServerStatusBanner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"

interface Backup {
	key: string
	fileName: string
	size: number
	lastModified: string
	backupType: string
	compressed: boolean
	generatedAt: string
}

interface BackupJob {
	id: string
	status: string
	progresso: number
	startedAt: string | null
	completedAt: string | null
	logs: string[]
	detalhes: Record<string, unknown> | null
	erros: string[]
}


export default function BackupPage() {
	const [backups, setBackups] = useState<Backup[]>([])
	const [loading, setLoading] = useState(true)
	const [creating, setCreating] = useState(false)
	const [deleting, setDeleting] = useState<string | null>(null)
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
	const [selectedBackup, setSelectedBackup] = useState<{ key: string; fileName: string } | null>(null)

	// Estados para integração com servidor de background
	const [currentJob, setCurrentJob] = useState<BackupJob | null>(null)
	const [compressBackup, setCompressBackup] = useState(true)
	const [encryptBackup, setEncryptBackup] = useState(true)
	const [backupType, setBackupType] = useState<"full" | "incremental">("full")
	const [autoRefresh, setAutoRefresh] = useState(true)
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

	// IDs únicos para elementos
	const backupTypeId = useId()
	const compressId = useId()
	const encryptId = useId()
	const autoRefreshId = useId()

	// URL do servidor de background
	const serverUrl = process.env.NEXT_PUBLIC_BACKGROUND_WORKER_SERVER || "http://localhost:3100"

	// Função para carregar backups do servidor de background
	const loadBackups = useCallback(async () => {
		try {
			const response = await fetch(`${serverUrl}/api/backup/list`)
			const data = await response.json()

			if (data.success) {
				setBackups(data.backups || [])
			} else {
				console.error("[Backup List] Erro:", data.error, data.details)
				toast.error(data.error || "Erro ao carregar backups")
			}
		} catch (error) {
			console.error("Erro ao carregar backups:", error)
			toast.error("Erro ao carregar lista de backups. Verifique se o servidor de background está rodando.")
		} finally {
			setLoading(false)
		}
	}, [serverUrl])

	// Função para buscar status do job de backup
	const fetchJobStatus = useCallback(
		async (jobId: string) => {
			try {
				const response = await fetch(`${serverUrl}/api/backup/status/${jobId}`)
				const data = await response.json()

				if (data.success) {
					setCurrentJob(data.job)
					setLastUpdate(new Date())

					// Se o job terminou, parar de buscar status
					if (data.job.status === "completed" || data.job.status === "failed" || data.job.status === "cancelled") {
						setCreating(false)
						loadBackups() // Recarregar lista de backups
					}
				}
			} catch (error) {
				console.error("Erro ao buscar status do job:", error)
			}
		},
		[loadBackups, serverUrl],
	)

	// Função para criar backup via servidor de background
	const createBackup = async () => {
		if (creating) {
			toast.error("Já existe um backup em andamento!")
			return
		}

		setCreating(true)
		try {
			const response = await fetch(`${serverUrl}/api/backup/start`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					backupType,
					compress: compressBackup,
					encrypt: encryptBackup,
					description: `Backup ${backupType} manual - ${new Date().toLocaleString("pt-BR")}`,
				}),
			})

			const data = await response.json()

			if (data.success) {
				toast.success("Backup iniciado com sucesso!")
				setCurrentJob({
					id: data.jobId,
					status: "running",
					progresso: 0,
					startedAt: new Date().toISOString(),
					completedAt: null,
					logs: [],
					detalhes: null,
					erros: [],
				})
			} else {
				console.error("[Backup Start] Erro:", data.error, data.details)
				toast.error(data.error || "Erro ao iniciar backup")
				setCreating(false)
			}
		} catch (error) {
			console.error("Erro ao iniciar backup:", error)
			toast.error("Erro ao iniciar backup. Verifique se o servidor de background está rodando.")
			setCreating(false)
		}
	}

	// useEffect para carregar dados iniciais
	useEffect(() => {
		loadBackups()
	}, [loadBackups])

	// useEffect para auto-refresh do status do job
	useEffect(() => {
		if (
			!autoRefresh ||
			!currentJob ||
			currentJob.status === "completed" ||
			currentJob.status === "failed" ||
			currentJob.status === "cancelled"
		) {
			return
		}

		const interval = setInterval(() => {
			fetchJobStatus(currentJob.id)
		}, 2000) // Atualizar a cada 2 segundos

		return () => clearInterval(interval)
	}, [autoRefresh, currentJob, fetchJobStatus])


	const deleteBackup = async (fileName: string) => {
		if (!confirm(`Tem certeza que deseja deletar o backup "${fileName}"?`)) {
			return
		}

		setDeleting(fileName)
		try {
			const response = await fetch(`${serverUrl}/api/backup/${fileName}`, {
				method: "DELETE",
			})

			const data = await response.json()

			if (data.success) {
				toast.success("Backup deletado com sucesso!")
				loadBackups()
			} else {
				toast.error(data.error || "Erro ao deletar backup")
			}
		} catch (error) {
			console.error("Erro ao deletar backup:", error)
			toast.error("Erro ao deletar backup")
		} finally {
			setDeleting(null)
		}
	}

	const downloadBackup = async (fileName: string) => {
		try {
			const response = await fetch(`${serverUrl}/api/backup/download/${fileName}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ expiresIn: 3600 }), // 1 hora
			})

			const data = await response.json()

			if (data.success && data.downloadUrl) {
				const link = document.createElement("a")
				link.href = data.downloadUrl
				link.download = fileName
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				toast.success("Download iniciado!")
			} else {
				toast.error(data.error || "Erro ao gerar URL de download")
			}
		} catch (error) {
			console.error("Erro ao baixar backup:", error)
			toast.error("Erro ao baixar backup")
		}
	}

	const openRestoreDialog = (fileName: string) => {
		setSelectedBackup({ key: `backups/${fileName}`, fileName })
		setRestoreDialogOpen(true)
	}

	const handleRestoreSuccess = () => {
		setRestoreDialogOpen(false)
		setSelectedBackup(null)
	}

	const formatDate = (isoString: string) => {
		const date = new Date(isoString)
		return date.toLocaleString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		})
	}

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 Bytes"
		const k = 1024
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case "completed":
				return "Concluído"
			case "failed":
				return "Falhou"
			case "running":
				return "Em execução"
			case "cancelled":
				return "Cancelado"
			default:
				return status
		}
	}

	if (loading) {
		return (
			<div className="container mx-auto py-8 px-4">
				<div className="flex items-center justify-center h-64">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold flex items-center gap-2">
					<Database className="h-8 w-8" />
					Backups do Banco de Dados
				</h1>
				<p className="text-muted-foreground mt-2">Gerencie backups automáticos e manuais via servidor de background</p>
			</div>

			{/* Status do Servidor de Background */}
			<ServerStatusBanner />

			{/* Status do Job de Backup Atual */}
			{currentJob && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Database className="h-5 w-5" />
							Status do Backup
							<Badge
								variant={
									currentJob.status === "completed"
										? "default"
										: currentJob.status === "failed"
											? "destructive"
											: "secondary"
								}
							>
								{getStatusText(currentJob.status)}
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div>
								<div className="flex justify-between text-sm mb-1">
									<span>Progresso</span>
									<span>{currentJob.progresso}%</span>
								</div>
								<Progress value={currentJob.progresso} className="w-full" />
							</div>

							{currentJob.logs && currentJob.logs.length > 0 && (
								<div>
									<h4 className="text-sm font-medium mb-2">Logs:</h4>
									<div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
										{currentJob.logs.slice(-5).map((log, index) => (
											<div key={`log-${currentJob.id}-${index}`} className="text-xs text-gray-600 mb-1">
												{log}
											</div>
										))}
									</div>
								</div>
							)}

							{currentJob.erros && currentJob.erros.length > 0 && (
								<div>
									<h4 className="text-sm font-medium mb-2 text-red-600">Erros:</h4>
									<div className="bg-red-50 p-3 rounded-md">
										{currentJob.erros.map((error, index) => (
											<div key={`error-${currentJob.id}-${index}`} className="text-xs text-red-600 mb-1">
												{error}
											</div>
										))}
									</div>
								</div>
							)}

							<div className="flex items-center gap-4 text-sm text-gray-600">
								{currentJob.startedAt && <span>Iniciado: {formatDate(currentJob.startedAt)}</span>}
								{currentJob.completedAt && <span>Concluído: {formatDate(currentJob.completedAt)}</span>}
								<span>Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}</span>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Configurações e Ações */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Configurações e Ações</CardTitle>
					<CardDescription>Configure e execute backups</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{/* Configurações */}
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="space-y-2">
								<Label htmlFor={backupTypeId}>Tipo de Backup</Label>
								<select
									id={backupTypeId}
									value={backupType}
									onChange={(e) => setBackupType(e.target.value as "full" | "incremental")}
									className="w-full p-2 border rounded-md"
									disabled={creating}
								>
									<option value="full">Completo</option>
									<option value="incremental">Incremental</option>
								</select>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id={compressId}
									checked={compressBackup}
									onCheckedChange={setCompressBackup}
									disabled={creating}
								/>
								<Label htmlFor={compressId}>Comprimir backup</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Switch
									id={encryptId}
									checked={encryptBackup}
									onCheckedChange={setEncryptBackup}
									disabled={creating}
								/>
								<Label htmlFor={encryptId}>Criptografar backup</Label>
							</div>

							<div className="flex items-center space-x-2">
								<Switch id={autoRefreshId} checked={autoRefresh} onCheckedChange={setAutoRefresh} />
								<Label htmlFor={autoRefreshId}>Auto-atualizar status</Label>
							</div>
						</div>

						{/* Botões de Ação */}
						<div className="flex gap-4">
							<Button onClick={createBackup} disabled={creating} size="lg">
								{creating ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Criando Backup...
									</>
								) : (
									<>
										<Plus className="mr-2 h-4 w-4" />
										Criar Backup
									</>
								)}
							</Button>
							<Button variant="outline" onClick={loadBackups} disabled={loading} size="lg">
								<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
								Atualizar Lista
							</Button>
						</div>

						{creating && (
							<p className="text-sm text-muted-foreground">
								⚠️ Aguarde a conclusão do backup antes de sair desta página.
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Estatísticas */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">Total de Backups</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{backups.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">Último Backup</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-semibold">
							{backups.length > 0 ? formatDate(backups[0].lastModified) : "Nenhum"}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">Espaço Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{formatBytes(backups.reduce((acc, b) => acc + b.size, 0))}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">Backups Comprimidos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{backups.filter((b) => b.compressed).length} / {backups.length}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Lista de Backups */}
			{backups.length === 0 && !loading ? (
				<Alert>
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Nenhum backup encontrado</AlertTitle>
					<AlertDescription>
						{creating
							? "Aguarde enquanto o primeiro backup está sendo criado..."
							: 'Crie seu primeiro backup clicando no botão "Criar Backup" acima. Verifique se o servidor de background está rodando.'}
					</AlertDescription>
				</Alert>
			) : backups.length === 0 ? null : (
				<div className="space-y-4">
					<h2 className="text-xl font-semibold">Backups Disponíveis</h2>
					{backups.map((backup) => (
						<Card key={backup.key}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<CardTitle className="text-lg flex items-center gap-2">
											<Database className="h-5 w-5 text-blue-600" />
											{backup.fileName}
										</CardTitle>
										<CardDescription className="mt-2 space-y-1">
											<div className="flex items-center gap-2">
												<Clock className="h-3 w-3" />
												{formatDate(backup.lastModified)}
											</div>
											<div className="flex items-center gap-4 text-xs">
												<Badge variant="outline" className="text-xs">
													{backup.backupType}
												</Badge>
												{backup.compressed && (
													<Badge variant="secondary" className="text-xs">
														Comprimido
													</Badge>
												)}
											</div>
										</CardDescription>
									</div>
									<Badge variant="outline" className="ml-4">
										{formatBytes(backup.size)}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex gap-2 flex-wrap">
									<Button
										variant="outline"
										size="sm"
										onClick={() => downloadBackup(backup.fileName)}
									>
										<Download className="h-4 w-4 mr-2" />
										Baixar
									</Button>
									<Button
										variant="default"
										size="sm"
										onClick={() => openRestoreDialog(backup.fileName)}
										className="bg-orange-600 hover:bg-orange-700 text-white"
									>
										<RotateCcw className="h-4 w-4 mr-2" />
										Restaurar
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => deleteBackup(backup.fileName)}
										disabled={deleting === backup.fileName}
										className="text-red-600 hover:text-red-700"
									>
										{deleting === backup.fileName ? (
											<>
												<Loader2 className="h-4 w-4 mr-2 animate-spin" />
												Deletando...
											</>
										) : (
											<>
												<Trash2 className="h-4 w-4 mr-2" />
												Deletar
											</>
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{/* Informações Importantes */}
			<Alert className="mt-6">
				<CheckCircle className="h-4 w-4" />
				<AlertTitle>Informações Importantes</AlertTitle>
				<AlertDescription className="space-y-2">
					<p>
						• Os backups são processados pelo <strong>servidor de background</strong> e armazenados no{" "}
						<strong>Cloudflare R2</strong>
					</p>
					<p>
						• Backups podem ser <strong>comprimidos</strong> para economizar espaço (redução de ~65%)
					</p>
					<p>
						• Backups podem ser <strong>criptografados</strong> para máxima segurança na nuvem
					</p>
					<p>
						• <strong>Checksum SHA-256</strong> garante integridade dos arquivos
					</p>
					<p>
						• Para restaurar um backup, clique no botão <strong>"Restaurar"</strong> e confirme com a senha
					</p>
					<p>
						• <strong>⚠️ ATENÇÃO:</strong> Restaurar um backup irá <strong>APAGAR TODOS OS DADOS ATUAIS</strong>
					</p>
					<p>
						• Recomendamos manter pelo menos os <strong>últimos 7 backups</strong> (uma semana)
					</p>
					<p>
						• O servidor de background deve estar <strong>online</strong> para executar operações
					</p>
				</AlertDescription>
			</Alert>

			{/* Diálogo de Restauração */}
			{selectedBackup && (
				<RestoreBackupDialog
					isOpen={restoreDialogOpen}
					onClose={() => setRestoreDialogOpen(false)}
					backupKey={selectedBackup.key}
					backupFileName={selectedBackup.fileName}
					onRestoreSuccess={handleRestoreSuccess}
				/>
			)}
		</div>
	)
}
