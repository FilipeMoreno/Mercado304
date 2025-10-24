// render/src/handlers/CleanupHandler.ts
// Handler para jobs de limpeza

import type { Job } from "bullmq"
import type { CleanupJobData, JobResult } from "../types/jobs"
import { BaseHandler } from "./BaseHandler"

export class CleanupHandler extends BaseHandler<CleanupJobData> {
	async handle(job: Job<CleanupJobData>): Promise<JobResult> {
		try {
			const { cleanupType, olderThan, maxAge } = job.data

			await this.updateProgress(job, {
				percentage: 10,
				stage: "INIT",
				message: `Iniciando limpeza de ${cleanupType}`,
			})

			await this.logInfo(job, `Executando limpeza`, { cleanupType, olderThan, maxAge })

			let cleanedItems = 0
			let freedSpace = 0

			// Simular processo de limpeza baseado no tipo
			switch (cleanupType) {
				case "logs":
					await this.updateProgress(job, {
						percentage: 30,
						stage: "CLEANING",
						message: "Limpando logs antigos",
					})
					cleanedItems = 150
					freedSpace = 25 // MB
					break

				case "temp-files":
					await this.updateProgress(job, {
						percentage: 50,
						stage: "CLEANING",
						message: "Removendo arquivos temporários",
					})
					cleanedItems = 45
					freedSpace = 12 // MB
					break

				case "old-data":
					await this.updateProgress(job, {
						percentage: 70,
						stage: "CLEANING",
						message: "Removendo dados antigos",
					})
					cleanedItems = 320
					freedSpace = 8 // MB
					break

				case "cache":
					await this.updateProgress(job, {
						percentage: 90,
						stage: "CLEANING",
						message: "Limpando cache",
					})
					cleanedItems = 89
					freedSpace = 15 // MB
					break
			}

			await this.updateProgress(job, {
				percentage: 100,
				stage: "COMPLETED",
				message: "Limpeza concluída com sucesso",
			})

			const cleanupInfo = {
				type: cleanupType,
				cleanedItems,
				freedSpaceMB: freedSpace,
				cleanedAt: new Date().toISOString(),
				olderThan,
				maxAge,
			}

			return this.createSuccessResult(`Limpeza de ${cleanupType} concluída com sucesso`, cleanupInfo)
		} catch (error) {
			await this.logError(job, error as Error, "Erro durante limpeza")
			return this.createErrorResult("Erro durante limpeza", [
				error instanceof Error ? error.message : "Erro desconhecido",
			])
		}
	}
}
