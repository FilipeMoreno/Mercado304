// render/src/handlers/HandlerFactory.ts
// Factory para criar handlers baseado no tipo de job

import type { PrismaClient } from "@prisma/client"
import type { JobType } from "../types/jobs"
import { BackupHandler } from "./BackupHandler"
import type { BaseHandler } from "./BaseHandler"
import { CleanupHandler } from "./CleanupHandler"
import { DataExportHandler } from "./DataExportHandler"
import { EmailSendHandler } from "./EmailSendHandler"
import { PriceSyncHandler } from "./PriceSyncHandler"
import { ReportGenerationHandler } from "./ReportGenerationHandler"

export class HandlerFactory {
	private static handlers: Record<JobType, new (prisma: PrismaClient) => BaseHandler<any>> = {
		"price-sync": PriceSyncHandler,
		"backup": BackupHandler,
		"email-send": EmailSendHandler,
		"data-export": DataExportHandler,
		"cleanup": CleanupHandler,
		"report-generation": ReportGenerationHandler,
	}

	static createHandler(jobType: JobType, prisma: PrismaClient): BaseHandler<any> | null {
		const HandlerClass = HandlerFactory.handlers[jobType]

		if (!HandlerClass) {
			console.error(`Handler não encontrado para o tipo de job: ${jobType}`)
			return null
		}

		return new HandlerClass(prisma)
	}

	static getSupportedJobTypes(): JobType[] {
		return Object.keys(HandlerFactory.handlers) as JobType[]
	}

	static isJobTypeSupported(jobType: string): jobType is JobType {
		return jobType in HandlerFactory.handlers
	}
}
