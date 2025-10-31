import "dotenv/config" // Carrega .env automaticamente - primeiro de tudo!
import type { Server } from "node:http"
import { PrismaClient } from "@prisma/client"
import { type ConnectionOptions, Queue, Worker } from "bullmq"
import { HandlerFactory } from "./src/handlers/HandlerFactory"
import app from "./src/server"
import { cleanupOldStagingDatabases } from "./src/lib/staging-db"

const { REDIS_URL, DATABASE_URL, PORT = "3100", NODE_ENV = "development" } = process.env

function validateEnv() {
	const missing: string[] = []

	if (!REDIS_URL) missing.push("REDIS_URL")
	if (!DATABASE_URL) missing.push("DATABASE_URL")

	if (missing.length) {
		console.error(`❌ Variáveis de ambiente faltando: ${missing.join(", ")}`)
		process.exit(1)
	}
}

validateEnv()

const prisma = new PrismaClient()
const workers: Worker[] = []
let httpServer: Server | null = null

const REDIS_CONNECTION: ConnectionOptions = {
	url: REDIS_URL,
	connectTimeout: 20000, // permitir conexão via TLS
	maxRetriesPerRequest: null, // recomendado pela própria Upstash
	enableReadyCheck: false, // reduz erros falsos de "desconectado"
	keepAlive: 60000,
}

const WORKER_CONFIG = {
	connection: REDIS_CONNECTION,
	concurrency: 4, // Aumentado para melhor throughput
	removeOnComplete: { count: 20 },
	removeOnFail: { count: 10 },
}

async function recoverPendingJobs() {
	console.log("🔄 Verificando jobs pendentes para retomada...")

	try {
		// Buscar jobs que estavam rodando quando o servidor caiu
		const runningJobs = await prisma.syncJob.findMany({
			where: {
				status: "running",
			},
			orderBy: {
				updatedAt: "desc",
			},
		})

		if (runningJobs.length > 0) {
			console.log(`📋 Encontrados ${runningJobs.length} jobs que estavam rodando:`)

			for (const job of runningJobs) {
				console.log(`  - Job ${job.id} (${job.tipo}) - Iniciado em ${job.startedAt}`)

				// Verificar se o job foi iniciado recentemente (menos de 1 hora)
				const jobAge = Date.now() - new Date(job.startedAt || job.createdAt).getTime()
				const oneHour = 60 * 60 * 1000

				if (jobAge < oneHour) {
					console.log(`  ⚠️ Job ${job.id} foi interrompido recentemente (${Math.round(jobAge / 1000 / 60)}min atrás)`)

					// Marcar como falhou com motivo de interrupção do servidor
					await prisma.syncJob.update({
						where: { id: job.id },
						data: {
							status: "failed",
							erros: [...(Array.isArray(job.erros) ? job.erros : []), "Job interrompido devido à queda do servidor"],
							completedAt: new Date(),
							updatedAt: new Date(),
							logs: [
								...(Array.isArray(job.logs) ? job.logs : []),
								`[${new Date().toISOString()}] ❌ Job interrompido devido à queda do servidor (${Math.round(jobAge / 1000 / 60)}min atrás)`,
							],
						},
					})
				} else {
					console.log(
						`  ⏰ Job ${job.id} é muito antigo (${Math.round(jobAge / 1000 / 60 / 60)}h atrás) - marcando como falhado`,
					)

					// Jobs muito antigos são marcados como falhados
					await prisma.syncJob.update({
						where: { id: job.id },
						data: {
							status: "failed",
							erros: [
								...(Array.isArray(job.erros) ? job.erros : []),
								"Job interrompido devido à queda do servidor (muito antigo)",
							],
							completedAt: new Date(),
							updatedAt: new Date(),
							logs: [
								...(Array.isArray(job.logs) ? job.logs : []),
								`[${new Date().toISOString()}] ❌ Job interrompido devido à queda do servidor (${Math.round(jobAge / 1000 / 60 / 60)}h atrás)`,
							],
						},
					})
				}
			}

			console.log("✅ Jobs interrompidos marcados como falhados")
		} else {
			console.log("✅ Nenhum job pendente encontrado")
		}
	} catch (error) {
		console.error("❌ Erro ao verificar jobs pendentes:", error)
	}
}

async function cleanupOrphanedJobs() {
	console.log("🧹 Limpando jobs órfãos no BullMQ...")

	try {
		const jobTypes = HandlerFactory.getSupportedJobTypes()

		for (const jobType of jobTypes) {
			const queue = new Queue(jobType, { connection: REDIS_CONNECTION })

			// Buscar jobs ativos (que podem estar "presos")
			const activeJobs = await queue.getActive()
			const waitingJobs = await queue.getWaiting()

			console.log(`[${jobType}] Jobs ativos: ${activeJobs.length}, aguardando: ${waitingJobs.length}`)

			// Se há jobs ativos, verificar se eles têm correspondência na tabela SyncJob
			if (activeJobs.length > 0) {
				for (const activeJob of activeJobs) {
					// Verificar se o job ainda existe na tabela SyncJob
					const syncJob = await prisma.syncJob.findFirst({
						where: {
							// Assumindo que o jobId do BullMQ está relacionado ao ID da SyncJob
							// ou que há alguma forma de relacionar
							status: { in: ["running", "pending"] },
						},
						orderBy: { createdAt: "desc" },
					})

					// Se não há correspondência, o job pode estar órfão
					if (!syncJob) {
						console.log(`[${jobType}] Removendo job órfão: ${activeJob.id}`)
						await activeJob.remove()
					}
				}
			}

			await queue.close()
		}

		console.log("✅ Limpeza de jobs órfãos concluída")
	} catch (error) {
		console.error("❌ Erro ao limpar jobs órfãos:", error)
	}
}

async function bootstrapWorkers() {
	// Primeiro, verificar e recuperar jobs pendentes
	await recoverPendingJobs()

	// Limpar jobs órfãos no BullMQ
	await cleanupOrphanedJobs()

	const jobTypes = HandlerFactory.getSupportedJobTypes()

	if (!jobTypes.length) {
		console.warn("⚠️ Nenhum job encontrado no HandlerFactory.")
		return
	}

	console.log(`🔧 Inicializando filas: ${jobTypes.join(", ")}`)

	for (const jobType of jobTypes) {
		const worker = new Worker(
			jobType,
			async (job) => {
				const handler = HandlerFactory.createHandler(jobType, prisma)
				if (!handler) throw new Error(`Handler ausente: ${jobType}`)

				try {
					console.log(`[${jobType}] ▶️ Job #${job.id}`)
					return await handler.handle(job)
				} catch (err: unknown) {
					const errorMessage = err instanceof Error ? err.message : String(err)
					console.error(`[${jobType}] ❌ Falha no Job #${job.id}:`, errorMessage)
					throw err
				}
			},
			WORKER_CONFIG,
		)

		worker.on("ready", () => console.log(`[${jobType}] ✅ Worker pronto`))
		worker.on("failed", (job, err) => console.error(`[${jobType}] Job #${job?.id} falhou: ${err.message}`))
		worker.on("error", (err) => console.error(`[${jobType}] 🚨 Erro geral: ${err.message}`))

		workers.push(worker)
	}

	console.log("🎯 Workers totalmente iniciados!")
}

async function gracefulShutdown(signal: string) {
	console.log(`\n🛑 Recebido ${signal}: desligando com segurança...`)

	const timeout = setTimeout(() => {
		console.warn("⚠️ Shutdown demorando muito. Forçando saída.")
		process.exit(1)
	}, 15000)

	try {
		if (httpServer) {
			console.log(" - Fechando servidor HTTP...")
			await new Promise((resolve) => httpServer?.close(resolve))
		}

		console.log(" - Encerrando Workers...")
		await Promise.allSettled(workers.map((w) => w.close()))

		console.log(" - Desconectando banco...")
		await prisma.$disconnect()

		console.log("✅ Finalizado com sucesso!")
	} catch (err) {
		console.error("❌ Erro no shutdown:", err)
	} finally {
		clearTimeout(timeout)
		process.exit(0)
	}
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

async function main() {
	console.log("🚀 Mercado304 Worker iniciado")
	console.log(`📡 Redis: ${REDIS_URL?.replace(/\/\/.*@/, "//***:***@")}`)
	console.log(`🌎 Ambiente: ${NODE_ENV}`)

	await bootstrapWorkers()

	// 🧹 PERSISTENT STAGING: Limpeza automática de stagings antigos (a cada 6 horas)
	const cleanupInterval = 6 * 60 * 60 * 1000 // 6 horas
	setInterval(() => {
		try {
			console.log("🧹 Executando limpeza automática de staging databases...")
			cleanupOldStagingDatabases(2) // Deletar stagings com mais de 2 dias
		} catch (error) {
			console.error("❌ Erro na limpeza automática:", error)
		}
	}, cleanupInterval)

	// Executar limpeza na inicialização também
	setTimeout(() => {
		try {
			cleanupOldStagingDatabases(2)
		} catch (error) {
			console.error("❌ Erro na limpeza inicial:", error)
		}
	}, 5000) // 5 segundos após inicialização

	httpServer = app.listen(Number(PORT), () => console.log(`📊 Health check ON — Porta ${PORT}`))
}

main().catch((err) => {
	console.error("❌ Erro crítico ao iniciar:", err)
	process.exit(1)
})
