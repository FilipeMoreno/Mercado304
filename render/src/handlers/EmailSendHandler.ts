// render/src/handlers/EmailSendHandler.ts
// Handler para jobs de envio de email

import type { Job } from "bullmq"
import type { EmailSendJobData, JobResult } from "../types/jobs"
import { BaseHandler } from "./BaseHandler"

export class EmailSendHandler extends BaseHandler<EmailSendJobData> {
	async handle(job: Job<EmailSendJobData>): Promise<JobResult> {
		try {
			const { to, subject, template, data, priority } = job.data

			await this.updateProgress(job, {
				percentage: 10,
				stage: "INIT",
				message: "Preparando envio de email",
			})

			await this.logInfo(job, `Enviando email para ${Array.isArray(to) ? to.join(", ") : to}`, {
				subject,
				template,
				priority,
			})

			// Simular processo de envio de email
			const emailSteps = [
				{ percentage: 30, stage: "PREPARING", message: "Preparando template de email" },
				{ percentage: 50, stage: "RENDERING", message: "Renderizando conteúdo do email" },
				{ percentage: 70, stage: "SENDING", message: "Enviando email" },
				{ percentage: 90, stage: "VERIFYING", message: "Verificando entrega" },
				{ percentage: 100, stage: "COMPLETED", message: "Email enviado com sucesso" },
			]

			for (const step of emailSteps) {
				await this.updateProgress(job, step)

				// Simular tempo de processamento
				await new Promise((resolve) => setTimeout(resolve, 500))
			}

			const emailInfo = {
				to: Array.isArray(to) ? to : [to],
				subject,
				template,
				priority: priority || "normal",
				sentAt: new Date().toISOString(),
				messageId: `msg_${Date.now()}`,
			}

			return this.createSuccessResult("Email enviado com sucesso", emailInfo)
		} catch (error) {
			await this.logError(job, error as Error, "Erro durante envio de email")
			return this.createErrorResult("Erro durante envio de email", [
				error instanceof Error ? error.message : "Erro desconhecido",
			])
		}
	}
}
