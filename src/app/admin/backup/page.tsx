"use client"

import { AlertCircle, CheckCircle, Clock, Database, Download, Loader2, Plus, RefreshCw, RotateCcw, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { BackupProgressCard } from "@/components/admin/BackupProgressCard"
import { RestoreBackupDialog } from "@/components/admin/RestoreBackupDialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Backup {
	key: string
	fileName: string
	size: number
	sizeFormatted: string
	lastModified: string
}

export default function BackupPage() {
	const [backups, setBackups] = useState<Backup[]>([])
	const [loading, setLoading] = useState(true)
	const [creating, setCreating] = useState(false)
	const [deleting, setDeleting] = useState<string | null>(null)
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
	const [selectedBackup, setSelectedBackup] = useState<{ key: string; fileName: string } | null>(null)

	const loadBackups = useCallback(async () => {
		try {
			const response = await fetch("/api/admin/backup/list")
			const data = await response.json()

			if (data.success) {
				setBackups(data.backups || [])
				console.log(`[Backup List] ${data.backups?.length || 0} backups carregados`)
			} else {
				console.error("[Backup List] Erro:", data.error, data.details)
				toast.error(data.error || "Erro ao carregar backups")

				// Mostrar detalhes do erro se disponível
				if (data.details) {
					console.error("[Backup List] Detalhes:", data.details)
				}
			}
		} catch (error) {
			console.error("Erro ao carregar backups:", error)
			toast.error("Erro ao carregar lista de backups. Verifique as credenciais do R2.")
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadBackups()
	}, [loadBackups])

	const createBackup = async () => {
		setCreating(true)
		try {
			const response = await fetch("/api/admin/backup/create?manual=true", {
				method: "POST",
			})

			const data = await response.json()

			if (data.success) {
				toast.success("Backup criado com sucesso!")
				// Não chamar loadBackups aqui, será chamado pelo onComplete do BackupProgressCard
			} else {
				console.error("[Backup Create] Erro:", data.error, data.details)
				toast.error(data.error || "Erro ao criar backup")
				if (data.details) {
					console.error("[Backup Create] Detalhes:", data.details)
				}
				setCreating(false) // Resetar apenas em caso de erro
			}
		} catch (error) {
			console.error("Erro ao criar backup:", error)
			toast.error("Erro ao criar backup. Verifique as credenciais do R2.")
			setCreating(false)
		}
	}

	const handleBackupComplete = () => {
		setCreating(false)
		loadBackups()
	}

	const deleteBackup = async (key: string, fileName: string) => {
		if (!confirm(`Tem certeza que deseja deletar o backup "${fileName}"?`)) {
			return
		}

		setDeleting(key)
		try {
			const response = await fetch(`/api/admin/backup/delete?key=${encodeURIComponent(key)}`, {
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

	const downloadBackup = (key: string, fileName: string) => {
		const url = `/api/admin/backup/download?key=${encodeURIComponent(key)}`
		const link = document.createElement("a")
		link.href = url
		link.download = fileName
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
		toast.success("Download iniciado!")
	}

	const openRestoreDialog = (key: string, fileName: string) => {
		setSelectedBackup({ key, fileName })
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
				<p className="text-muted-foreground mt-2">
					Gerencie backups automáticos e manuais armazenados no Cloudflare R2
				</p>
			</div>

			{/* Informações sobre o Backup Automático */}
			<Alert className="mb-6">
				<Clock className="h-4 w-4" />
				<AlertTitle>Backup Automático Configurado</AlertTitle>
				<AlertDescription>
					O sistema cria backups automáticos <strong>todos os dias às 3h da manhã (horário do servidor)</strong>.
					<br />
					Você também pode criar backups manuais a qualquer momento clicando no botão abaixo.
				</AlertDescription>
			</Alert>

			{/* Card de Progresso do Backup */}
			<BackupProgressCard isCreating={creating} onComplete={handleBackupComplete} />

			{/* Ações */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Ações</CardTitle>
					<CardDescription>Crie novos backups ou atualize a lista</CardDescription>
				</CardHeader>
				<CardContent>
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
									Criar Backup Manual
								</>
							)}
						</Button>
						<Button variant="outline" onClick={loadBackups} disabled={loading || creating} size="lg">
							<RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							Atualizar Lista
						</Button>
					</div>
					{creating && (
						<p className="text-sm text-muted-foreground mt-3">
							⚠️ Aguarde a conclusão do backup antes de sair desta página.
						</p>
					)}
				</CardContent>
			</Card>

			{/* Estatísticas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
						<div className="text-2xl font-bold">
							{backups.reduce((acc, b) => acc + b.size, 0) / 1024 / 1024 > 0
								? `${(backups.reduce((acc, b) => acc + b.size, 0) / 1024 / 1024).toFixed(2)} MB`
								: "0 MB"}
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
							: 'Crie seu primeiro backup clicando no botão "Criar Backup Manual" acima. Caso já tenha criado backups, verifique se as credenciais do Cloudflare R2 estão configuradas corretamente nas variáveis de ambiente.'}
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
										</CardDescription>
									</div>
									<Badge variant="outline" className="ml-4">
										{backup.sizeFormatted}
									</Badge>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex gap-2 flex-wrap">
									<Button variant="outline" size="sm" onClick={() => downloadBackup(backup.key, backup.fileName)}>
										<Download className="h-4 w-4 mr-2" />
										Baixar
									</Button>
									<Button
										variant="default"
										size="sm"
										onClick={() => openRestoreDialog(backup.key, backup.fileName)}
										className="bg-orange-600 hover:bg-orange-700 text-white"
									>
										<RotateCcw className="h-4 w-4 mr-2" />
										Restaurar
									</Button>
									<Button
										variant="outline"
										size="sm"
										onClick={() => deleteBackup(backup.key, backup.fileName)}
										disabled={deleting === backup.key}
										className="text-red-600 hover:text-red-700"
									>
										{deleting === backup.key ? (
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
						• Os backups são armazenados de forma segura no <strong>Cloudflare R2</strong>
					</p>
					<p>
						• Backups automáticos são criados <strong>diariamente às 3h da manhã</strong>
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
