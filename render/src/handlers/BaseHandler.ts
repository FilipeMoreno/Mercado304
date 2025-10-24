// render/src/handlers/BaseHandler.ts
// Classe base para todos os handlers de jobs

import type { PrismaClient } from "@prisma/client"
import type { Job } from "bullmq"
import type { JobData, JobProgress, JobResult } from "../types/jobs"

export abstract class BaseHandler<T extends JobData> {
	protected prisma: PrismaClient

	constructor(prisma: PrismaClient) {
		this.prisma = prisma
	}

	abstract handle(job: Job<T>): Promise<JobResult>

	protected async updateProgress(job: Job<T>, progress: JobProgress): Promise<void> {
		await job.updateProgress(progress.percentage)
		console.log(`[${job.name}] ${progress.stage}: ${progress.message} (${progress.percentage}%)`)
	}

	protected async logInfo(job: Job<T>, message: string, data?: unknown): Promise<void> {
		console.log(`[${job.name}] ${message}`, data ? JSON.stringify(data, null, 2) : "")
	}

	protected async logError(job: Job<T>, error: Error, context?: string): Promise<void> {
		console.error(`[${job.name}] ${context ? `${context}: ` : ""}${error.message}`, error.stack)
	}

	protected createSuccessResult(message: string, data?: unknown, metadata?: Record<string, unknown>): JobResult {
		return {
			success: true,
			message,
			data,
			metadata,
		}
	}

	protected createErrorResult(message: string, errors: string[], data?: unknown): JobResult {
		return {
			success: false,
			message,
			errors,
			data,
		}
	}
}
