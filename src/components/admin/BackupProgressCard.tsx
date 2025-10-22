"use client"

import { AlertCircle, CheckCircle, Clock, Database, Loader2, Upload } from "lucide-react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface BackupProgress {
	status: "idle" | "creating" | "uploading" | "completed" | "error"
	progress: number
	currentStep: string
	startTime: number
	elapsedTime?: number
	estimatedTime?: number
	error?: string
	backupInfo?: {
		fileName: string
		size: number
		sizeFormatted: string
	}
}

interface BackupProgressCardProps {
	isCreating: boolean
	onComplete?: () => void
}

export function BackupProgressCard({ isCreating, onComplete }: BackupProgressCardProps) {
	const [progress, setProgress] = useState<BackupProgress | null>(null)

	useEffect(() => {
		if (!isCreating) {
			setProgress(null)
			return
		}

		let interval: NodeJS.Timeout

		// Polling para obter o progresso
		const startPolling = () => {
			interval = setInterval(async () => {
				try {
					const response = await fetch("/api/admin/backup/progress")
					const data = await response.json()

					if (data.success) {
						const newProgress = data.progress
						setProgress(newProgress)

						// Se completou, teve erro, ou voltou para idle, parar o polling
						if (newProgress.status === "completed" || newProgress.status === "error" || newProgress.status === "idle") {
							clearInterval(interval)
							
							if (newProgress.status === "completed" && onComplete) {
								setTimeout(() => {
									onComplete()
									// Reset do progresso após completar
									setTimeout(() => {
										setProgress(null)
									}, 3000) // Esperar 3 segundos antes de resetar completamente
								}, 2000) // Esperar 2 segundos antes de chamar onComplete
							}
							
							// Se voltou para idle ou erro, resetar após um tempo
							if (newProgress.status === "idle" || newProgress.status === "error") {
								setTimeout(() => {
									setProgress(null)
								}, newProgress.status === "error" ? 5000 : 1000) // 5s para erro, 1s para idle
							}
						}
					}
				} catch (error) {
					console.error("Erro ao obter progresso:", error)
					// Em caso de erro de rede, parar o polling após algumas tentativas
					clearInterval(interval)
					setTimeout(() => {
						setProgress(null)
					}, 2000)
				}
			}, 300) // Atualizar a cada 300ms para mais responsividade
		}

		startPolling()

		return () => {
			if (interval) {
				clearInterval(interval)
			}
		}
	}, [isCreating, onComplete])

	if (!progress || progress.status === "idle") {
		return null
	}

	const formatTime = (ms: number) => {
		const seconds = Math.floor(ms / 1000)
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60

		if (minutes > 0) {
			return `${minutes}m ${remainingSeconds}s`
		}
		return `${seconds}s`
	}

	const getStatusIcon = () => {
		switch (progress.status) {
			case "creating":
				return <Database className="size-5 text-blue-600 animate-pulse" />
			case "uploading":
				return <Upload className="size-5 text-purple-600 animate-pulse" />
			case "completed":
				return <CheckCircle className="size-5 text-green-600" />
			case "error":
				return <AlertCircle className="size-5 text-red-600" />
			default:
				return <Loader2 className="size-5 animate-spin text-blue-600" />
		}
	}

	const getStatusColor = () => {
		switch (progress.status) {
			case "completed":
				return "text-green-600"
			case "error":
				return "text-red-600"
			case "uploading":
				return "text-purple-600"
			default:
				return "text-blue-600"
		}
	}

	const getProgressColor = () => {
		switch (progress.status) {
			case "completed":
				return "bg-green-600"
			case "error":
				return "bg-red-600"
			case "uploading":
				return "bg-purple-600"
			default:
				return "bg-blue-600"
		}
	}

	if (progress.status === "error") {
		return (
			<Alert variant="destructive" className="mb-6">
				<AlertCircle className="size-4" />
				<AlertTitle>Erro ao criar backup</AlertTitle>
				<AlertDescription>{progress.error || "Ocorreu um erro desconhecido ao criar o backup."}</AlertDescription>
			</Alert>
		)
	}

	return (
		<Card className="mb-6 border-2 border-blue-200 shadow-lg">
			<CardHeader>
				<div className="flex items-center gap-3">
					{getStatusIcon()}
					<div className="flex-1">
						<CardTitle className={`text-lg ${getStatusColor()}`}>
							{progress.status === "completed" ? "Backup Concluído!" : "Criando Backup..."}
						</CardTitle>
						<CardDescription className="mt-1">{progress.currentStep}</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Barra de Progresso */}
				<div className="space-y-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Progresso</span>
						<span className="font-medium">{progress.progress}%</span>
					</div>
					<Progress value={progress.progress} className="h-3" />
				</div>

				{/* Informações de Tempo */}
				<div className="grid grid-cols-2 gap-4">
					{progress.elapsedTime !== undefined && (
						<div className="flex items-center gap-2 text-sm">
							<Clock className="size-4 text-muted-foreground" />
							<div>
								<p className="text-muted-foreground">Tempo Percorrido</p>
								<p className="font-medium">{formatTime(progress.elapsedTime)}</p>
							</div>
						</div>
					)}

					{progress.estimatedTime !== undefined && progress.status !== "completed" && (
						<div className="flex items-center gap-2 text-sm">
							<Clock className="size-4 text-muted-foreground" />
							<div>
								<p className="text-muted-foreground">Tempo Estimado</p>
								<p className="font-medium">{formatTime(progress.estimatedTime)}</p>
							</div>
						</div>
					)}
				</div>

				{/* Informações do Backup (quando completo) */}
				{progress.status === "completed" && progress.backupInfo && (
					<Alert className="bg-green-50 border-green-200">
						<CheckCircle className="size-4 text-green-600" />
						<AlertTitle className="text-green-800">Backup Criado com Sucesso!</AlertTitle>
						<AlertDescription className="text-green-700">
							<div className="mt-2 space-y-1">
								<p>
									<strong>Arquivo:</strong> {progress.backupInfo.fileName}
								</p>
								<p>
									<strong>Tamanho:</strong> {progress.backupInfo.sizeFormatted}
								</p>
								<p className="text-sm mt-2">O backup foi salvo com sucesso no Cloudflare R2.</p>
							</div>
						</AlertDescription>
					</Alert>
				)}

				{/* Status atual detalhado */}
				{progress.status === "creating" && (
					<div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
						<Loader2 className="size-4 mt-0.5 animate-spin text-blue-600" />
						<div className="text-sm">
							<p className="font-medium text-blue-900">Exportando Dados</p>
							<p className="text-blue-700">Aguarde enquanto os dados do banco de dados são exportados...</p>
						</div>
					</div>
				)}

				{progress.status === "uploading" && (
					<div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
						<Upload className="size-4 mt-0.5 animate-pulse text-purple-600" />
						<div className="text-sm">
							<p className="font-medium text-purple-900">Enviando para Cloud</p>
							<p className="text-purple-700">Fazendo upload do backup para o Cloudflare R2...</p>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
