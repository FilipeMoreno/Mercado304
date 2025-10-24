// render/src/handlers/HandlerFactory.ts
// Factory para criar handlers baseado no tipo de job

import type { PrismaClient } from "@prisma/client"
import type { JobData, JobType } from "../types/jobs"
import { BackupHandler } from "./BackupHandler"
import type { BaseHandler } from "./BaseHandler"
import { CleanupHandler } from "./CleanupHandler"
import { DataExportHandler } from "./DataExportHandler"
import { EmailSendHandler } from "./EmailSendHandler"
import { PriceSyncHandler } from "./PriceSyncHandler"
import { ReportGenerationHandler } from "./ReportGenerationHandler"

export class HandlerFactory {
	private static handlers: Map<JobType, new (prisma: PrismaClient) => BaseHandler<JobData>> = new Map([
		["price-sync", PriceSyncHandler],
		["backup", BackupHandler],
		["email-send", EmailSendHandler],
		["data-export", DataExportHandler],
		["cleanup", CleanupHandler],
		["report-generation", ReportGenerationHandler],
	])

	static createHandler(jobType: JobType, prisma: PrismaClient): BaseHandler<JobData> | null {
		const HandlerClass = HandlerFactory.handlers.get(jobType)

		if (!HandlerClass) {
			console.error(`Handler não encontrado para o tipo de job: ${jobType}`)
			return null
		}

		return new HandlerClass(prisma)
	}

	static getSupportedJobTypes(): JobType[] {
		return Array.from(HandlerFactory.handlers.keys())
	}

	static isJobTypeSupported(jobType: string): jobType is JobType {
		return HandlerFactory.handlers.has(jobType as JobType)
	}
}
