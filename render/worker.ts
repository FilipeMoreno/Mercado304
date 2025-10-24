import "dotenv/config" // Carrega .env automaticamente - primeiro de tudo!
import type { Server } from "node:http"
import { PrismaClient } from "@prisma/client"
import { type ConnectionOptions, Worker } from "bullmq"
import { HandlerFactory } from "./src/handlers/HandlerFactory"
import app from "./src/server"

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
};

const WORKER_CONFIG = {
	connection: REDIS_CONNECTION,
	concurrency: 4, // Aumentado para melhor throughput
	removeOnComplete: { count: 20 },
	removeOnFail: { count: 10 },
}

async function bootstrapWorkers() {
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
				} catch (err: any) {
					console.error(`[${jobType}] ❌ Falha no Job #${job.id}:`, err?.message ?? err)
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

	httpServer = app.listen(Number(PORT), () => console.log(`📊 Health check ON — Porta ${PORT}`))
}

main().catch((err) => {
	console.error("❌ Erro crítico ao iniciar:", err)
	process.exit(1)
})
