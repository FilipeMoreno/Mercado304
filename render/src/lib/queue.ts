// render/src/lib/queue.ts
// Configuração de filas BullMQ para o servidor de background

import { Queue } from "bullmq"

// Configuração de conexão com Redis (Upstash) usando REDIS_URL
const connection = {
	url: process.env.REDIS_URL || "redis://localhost:6379",
	// Configurações para conexão Redis
	connectTimeout: 10000, // 10 segundos
	commandTimeout: 5000, // 5 segundos
	retryDelayOnFailover: 100,
	lazyConnect: true, // Conectar apenas quando necessário
	keepAlive: 30000, // 30 segundos
	family: 4, // Forçar IPv4
}

// Configuração padrão para todos os jobs
const defaultJobOptions = {
	removeOnComplete: 10, // Manter apenas os últimos 10 jobs completos
	removeOnFail: 5, // Manter apenas os últimos 5 jobs falhados
	attempts: 3, // Tentar até 3 vezes em caso de falha
	backoff: {
		type: "exponential" as const,
		delay: 2000, // Delay inicial de 2 segundos
	},
}

// Filas disponíveis
export const queues = {
	"price-sync": new Queue("price-sync", { connection, defaultJobOptions }),
	"backup": new Queue("backup", { connection, defaultJobOptions }),
	"email-send": new Queue("email-send", { connection, defaultJobOptions }),
	"data-export": new Queue("data-export", { connection, defaultJobOptions }),
	"cleanup": new Queue("cleanup", { connection, defaultJobOptions }),
	"report-generation": new Queue("report-generation", { connection, defaultJobOptions }),
}

// Função genérica para adicionar jobs
export async function addJob(
	queueName: keyof typeof queues,
	jobName: string,
	data: unknown,
	options?: unknown,
) {
	const queue = queues[queueName]
	if (!queue) {
		throw new Error(`Fila ${queueName} não encontrada`)
	}

	return await queue.add(jobName, data, {
		priority: 1, // Prioridade alta
		...(options as Record<string, unknown>),
	})
}

// Função para obter status de um job
export async function getJobStatus(queueName: keyof typeof queues, jobId: string) {
	const queue = queues[queueName]
	if (!queue) {
		throw new Error(`Fila ${queueName} não encontrada`)
	}

	const job = await queue.getJob(jobId)

	if (!job) {
		return null
	}

	const state = await job.getState()
	const progress = job.progress

	return {
		id: job.id,
		name: job.name,
		data: job.data,
		state,
		progress,
		returnValue: job.returnvalue,
		failedReason: job.failedReason,
		processedOn: job.processedOn,
		finishedOn: job.finishedOn,
		createdAt: job.timestamp,
	}
}

// Função para cancelar um job
export async function cancelJob(queueName: keyof typeof queues, jobId: string) {
	const queue = queues[queueName]
	if (!queue) {
		throw new Error(`Fila ${queueName} não encontrada`)
	}

	const job = await queue.getJob(jobId)

	if (!job) {
		return false
	}

	await job.remove()
	return true
}

// Funções específicas para cada tipo de job (para compatibilidade)

// Sincronização de preços
export async function addPriceSyncJob(data: { marketId?: string; forceUpdate?: boolean }) {
	return await addJob("price-sync", "start-full-sync", { type: "price-sync", ...data })
}

// Backup
export async function addBackupJob(data: {
	backupType: "full" | "incremental"
	tables?: string[]
	compress?: boolean
	encrypt?: boolean
	description?: string
}) {
	return await addJob("backup", "start-backup", { type: "backup", ...data })
}

// Envio de email
export async function addEmailSendJob(data: {
	to: string | string[]
	subject: string
	template: string
	data: Record<string, unknown>
	priority?: "low" | "normal" | "high"
}) {
	return await addJob("email-send", "send-email", { type: "email-send", ...data })
}

// Exportação de dados
export async function addDataExportJob(data: {
	format: "csv" | "xlsx" | "json"
	tables: string[]
	filters?: Record<string, unknown>
	dateRange?: { start: Date; end: Date }
}) {
	return await addJob("data-export", "export-data", { type: "data-export", ...data })
}

// Limpeza
export async function addCleanupJob(data: {
	cleanupType: "logs" | "temp-files" | "old-data" | "cache"
	olderThan?: Date
	maxAge?: number
}) {
	return await addJob("cleanup", "start-cleanup", { type: "cleanup", ...data })
}

// Geração de relatórios
export async function addReportGenerationJob(data: {
	reportType: "monthly" | "yearly" | "custom"
	period: { start: Date; end: Date }
	format: "pdf" | "xlsx" | "csv"
	includeCharts?: boolean
}) {
	return await addJob("report-generation", "generate-report", { type: "report-generation", ...data })
}

// Função para obter status de job de sincronização (compatibilidade)
export async function getPriceSyncJobStatus(jobId: string) {
	return await getJobStatus("price-sync", jobId)
}

// Função para cancelar job de sincronização (compatibilidade)
export async function cancelPriceSyncJob(jobId: string) {
	return await cancelJob("price-sync", jobId)
}
