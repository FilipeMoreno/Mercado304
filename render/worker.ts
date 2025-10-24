// render/worker.ts
// Worker genérico para processar múltiplos tipos de jobs

import { PrismaClient } from "@prisma/client"
import { Worker } from "bullmq"
import { HandlerFactory } from "./src/handlers/HandlerFactory"
import type { JobType } from "./src/types/jobs"
import "./src/server" // Inicia o servidor HTTP

const prisma = new PrismaClient()

// Conexão com o Redis/Upstash
const connection = {
	host: process.env.UPSTASH_REDIS_HOST || 'localhost',
	port: parseInt(process.env.UPSTASH_REDIS_PORT || '6379', 10),
	password: process.env.UPSTASH_REDIS_PASSWORD || '',
}

// Verificar se as variáveis de ambiente estão configuradas
if (!process.env.UPSTASH_REDIS_HOST) {
	console.error('❌ UPSTASH_REDIS_HOST não configurado!')
	console.error('Configure as variáveis de ambiente do Redis/Upstash')
	process.exit(1)
}

if (!process.env.UPSTASH_REDIS_PASSWORD) {
	console.error('❌ UPSTASH_REDIS_PASSWORD não configurado!')
	console.error('Configure as variáveis de ambiente do Redis/Upstash')
	process.exit(1)
}

console.log("🚀 Worker genérico iniciando...")
console.log("📡 Conectando ao Redis:", process.env.UPSTASH_REDIS_HOST)

// Lista de filas suportadas
const SUPPORTED_QUEUES = ["price-sync", "backup", "email-send", "data-export", "cleanup", "report-generation"]

// Configuração do worker
const WORKER_CONFIG = {
	connection,
	concurrency: 2, // Processar até 2 jobs simultaneamente
	removeOnComplete: 10, // Manter apenas os últimos 10 jobs completos
	removeOnFail: 5, // Manter apenas os últimos 5 jobs falhados
}

// Criar workers para cada fila
const workers: Worker[] = []

for (const queueName of SUPPORTED_QUEUES) {
	const worker = new Worker(
		queueName,
		async (job) => {
			console.log(`🔄 Processando job ${job.id} - ${job.name} na fila ${queueName}`)

			try {
				// Determinar o tipo de job baseado no nome da fila
				const jobType = queueName as JobType

				// Criar handler apropriado
				const handler = HandlerFactory.createHandler(jobType, prisma)

				if (!handler) {
					throw new Error(`Handler não encontrado para o tipo de job: ${jobType}`)
				}

				// Processar job
				const result = await handler.handle(job as any)

				console.log(`✅ Job ${job.id} concluído com sucesso`)
				return result
			} catch (error) {
				console.error(`❌ Job ${job.id} falhou:`, error)
				throw error // O BullMQ vai tentar rodar de novo (retry)
			}
		},
		WORKER_CONFIG,
	)

	workers.push(worker)

	// Event listeners para cada worker
	worker.on("completed", (job) => {
		console.log(`✅ Job ${job.id} concluído na fila ${queueName}`)
	})

	worker.on("failed", (job, err) => {
		console.error(`❌ Job ${job?.id} falhou na fila ${queueName}:`, err.message)
		console.error('Stack trace:', err.stack)
	})

	worker.on("error", (err) => {
		console.error(`🚨 Erro no worker da fila ${queueName}:`, err.message)
		console.error('Stack trace:', err.stack)
	})

	worker.on("ready", () => {
		console.log(`✅ Worker da fila ${queueName} conectado e pronto`)
	})

	worker.on("closing", () => {
		console.log(`🔄 Worker da fila ${queueName} fechando...`)
	})
}

console.log(`👂 Workers iniciados para ${SUPPORTED_QUEUES.length} filas:`)
SUPPORTED_QUEUES.forEach((queue) => {
	console.log(`   - ${queue}`)
})

console.log("🎯 Workers prontos para processar jobs!")

// Graceful shutdown
const shutdown = async () => {
	console.log("🛑 Iniciando shutdown dos workers...")

	// Fechar todos os workers
	await Promise.all(workers.map((worker) => worker.close()))

	// Desconectar do banco
	await prisma.$disconnect()

	console.log("✅ Shutdown concluído")
	process.exit(0)
}

process.on("SIGINT", shutdown)
process.on("SIGTERM", shutdown)
