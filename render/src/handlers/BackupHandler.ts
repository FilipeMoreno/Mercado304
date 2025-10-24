// render/src/handlers/BackupHandler.ts
// Handler para jobs de backup

import type { Job } from "bullmq"
import { createAndUploadBackup } from "../lib/backup-utils"
import type { BackupJobData, JobResult } from "../types/jobs"
import { BaseHandler } from "./BaseHandler"

export class BackupHandler extends BaseHandler<BackupJobData> {
	private syncJobId: string | null = null

	protected async updateProgress(job: Job<BackupJobData>, progress: { percentage: number; stage: string; message: string }): Promise<void> {
		await job.updateProgress(progress.percentage)
		console.log(`[${job.name}] ${progress.stage}: ${progress.message} (${progress.percentage}%)`)

		// Atualizar também na tabela SyncJob se disponível
		if (this.syncJobId) {
			await this.prisma.syncJob.update({
				where: { id: this.syncJobId },
				data: {
					progresso: progress.percentage,
					updatedAt: new Date(),
				},
			})
		}
	}

	protected async logInfo(job: Job<BackupJobData>, message: string, data?: unknown): Promise<void> {
		console.log(`[${job.name}] ${message}`, data ? JSON.stringify(data, null, 2) : "")

		// Atualizar também na tabela SyncJob se disponível
		if (this.syncJobId) {
			const currentJob = await this.prisma.syncJob.findUnique({
				where: { id: this.syncJobId },
			})

			if (currentJob) {
				const newLogs = [...(Array.isArray(currentJob.logs) ? currentJob.logs : []), `[${new Date().toISOString()}] ${message}`]
				
				await this.prisma.syncJob.update({
					where: { id: this.syncJobId },
					data: {
						logs: newLogs,
						updatedAt: new Date(),
					},
				})
			}
		}
	}

	protected async logError(job: Job<BackupJobData>, error: Error, context?: string): Promise<void> {
		const errorMessage = `${context ? `${context}: ` : ""}${error.message}`
		console.error(`[${job.name}] ${errorMessage}`, error.stack)

		// Atualizar também na tabela SyncJob se disponível
		if (this.syncJobId) {
			const currentJob = await this.prisma.syncJob.findUnique({
				where: { id: this.syncJobId },
			})

			if (currentJob) {
				const newErrors = [...(Array.isArray(currentJob.erros) ? currentJob.erros : []), errorMessage]
				
				await this.prisma.syncJob.update({
					where: { id: this.syncJobId },
					data: {
						erros: newErrors,
						updatedAt: new Date(),
					},
				})
			}
		}
	}

	async handle(job: Job<BackupJobData>): Promise<JobResult> {
		try {
			const { backupType, tables, compress, encrypt, description } = job.data

			// Criar registro na tabela SyncJob
			const syncJob = await this.prisma.syncJob.create({
				data: {
					status: "running",
					tipo: "backup",
					progresso: 0,
					startedAt: new Date(),
				},
			})
			this.syncJobId = syncJob.id

			await this.updateProgress(job, {
				percentage: 5,
				stage: "INIT",
				message: `Iniciando backup ${backupType}`,
			})

			await this.logInfo(job, `Iniciando backup ${backupType}`, {
				tables: tables || "all",
				compress: compress || false,
				encrypt: encrypt || false,
				description: description || "Backup automático",
			})

			// Etapa 1: Preparação
			await this.updateProgress(job, {
				percentage: 15,
				stage: "PREPARING",
				message: "Preparando dados para backup",
			})

			await this.logInfo(job, "Verificando conectividade com banco de dados...")

			// Teste de conectividade
			await this.prisma.$queryRaw`SELECT 1`
			await this.logInfo(job, "✓ Conectividade com banco confirmada")

			// Etapa 2: Exportação
			await this.updateProgress(job, {
				percentage: 30,
				stage: "EXPORTING",
				message: "Exportando dados do banco",
			})

			await this.logInfo(job, "Iniciando exportação de dados...")
			const startTime = Date.now()

			// Criar backup real
			const backupResult = await createAndUploadBackup(this.prisma, {
				backupType: backupType || "full",
				compress: compress || true,
				encrypt: encrypt || true,
				description: description || `Backup ${backupType} - ${new Date().toLocaleString("pt-BR")}`,
			})

			if (!backupResult.success) {
				throw new Error(backupResult.error || "Falha ao criar backup")
			}

			const duration = Math.round((Date.now() - startTime) / 1000)
			await this.logInfo(job, `✓ Exportação concluída em ${duration}s`)

			// Etapa 3: Compressão e Criptografia (se aplicável)
			if (compress || encrypt) {
				await this.updateProgress(job, {
					percentage: 60,
					stage: "PROCESSING",
					message: "Processando arquivo (compressão/criptografia)",
				})
				
				if (compress) {
					await this.logInfo(job, "✓ Arquivo comprimido com sucesso")
				}
				if (encrypt) {
					await this.logInfo(job, "✓ Arquivo criptografado com sucesso")
				}
			}

			// Etapa 4: Upload
			await this.updateProgress(job, {
				percentage: 80,
				stage: "UPLOADING",
				message: "Fazendo upload do backup",
			})

			await this.logInfo(job, `Upload para R2: ${backupResult.backupId}`)
			await this.logInfo(job, `URL do backup: ${backupResult.url || "N/A"}`)

			// Etapa 5: Finalização
			await this.updateProgress(job, {
				percentage: 100,
				stage: "COMPLETED",
				message: "Backup concluído com sucesso",
			})

			const stats = backupResult.stats
			const security = backupResult.security
			const sizeFormatted = stats ? formatBytes(stats.size) : "N/A"
			const compressedSizeFormatted = stats?.compressedSize ? formatBytes(stats.compressedSize) : "N/A"
			const encryptedSizeFormatted = stats?.encryptedSize ? formatBytes(stats.encryptedSize) : "N/A"

			await this.logInfo(job, `✓ Backup concluído com sucesso!`, {
				backupId: backupResult.backupId,
				url: backupResult.url,
				stats: {
					tables: stats?.tables || 0,
					records: stats?.records || 0,
					size: sizeFormatted,
					compressedSize: compress ? compressedSizeFormatted : undefined,
					encryptedSize: encrypt ? encryptedSizeFormatted : undefined,
					compressionRatio:
						stats?.compressedSize && stats?.size
							? `${Math.round((1 - stats.compressedSize / stats.size) * 100)}%`
							: undefined,
				},
				security: {
					checksum: security?.checksum,
					encrypted: security?.encrypted,
					algorithm: security?.algorithm,
				},
			})

			const backupInfo = {
				backupId: backupResult.backupId,
				url: backupResult.url,
				type: backupType || "full",
				tables: tables || "all",
				compressed: compress || false,
				encrypted: encrypt || false,
				timestamp: new Date().toISOString(),
				stats: backupResult.stats,
				security: backupResult.security,
				duration: `${duration}s`,
			}

			// Marcar job como concluído na SyncJob
			if (this.syncJobId) {
				await this.prisma.syncJob.update({
					where: { id: this.syncJobId },
					data: {
						status: "completed",
						progresso: 100,
						completedAt: new Date(),
						updatedAt: new Date(),
						detalhes: backupInfo,
					},
				})
			}

			return this.createSuccessResult("Backup concluído com sucesso", backupInfo)
		} catch (error) {
			await this.logError(job, error as Error, "Erro durante backup")
			
			// Marcar job como falhado na SyncJob
			if (this.syncJobId) {
				await this.prisma.syncJob.update({
					where: { id: this.syncJobId },
					data: {
						status: "failed",
						completedAt: new Date(),
						updatedAt: new Date(),
					},
				})
			}
			
			return this.createErrorResult("Erro durante backup", [
				error instanceof Error ? error.message : "Erro desconhecido",
			])
		}
	}
}

/**
 * Formata bytes em formato legível
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 Bytes"

	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
}
