import { PrismaClient } from "@prisma/client"
import { Queue } from "bullmq"

const prisma = new PrismaClient()

const redisConnection = {
	url: process.env.REDIS_URL,
	maxRetriesPerRequest: null,
	enableReadyCheck: false,
}

export async function healthCheck() {
	const timestamp = new Date().toISOString()

	try {
		// Test DB
		await prisma.$queryRaw`SELECT 1`

		let redisStatus = "not_configured"

		if (process.env.REDIS_URL) {
			try {
				const testQueue = new Queue("health-check", {
					connection: redisConnection,
				})

				await testQueue.getWaiting()
				await testQueue.close()

				redisStatus = "connected"
			} catch (err: any) {
				redisStatus = `error: ${err.message}`
			}
		}

		return {
			status: "healthy",
			timestamp,
			services: {
				database: "connected",
				redis: redisStatus,
			},
		}
	} catch (error: any) {
		return {
			status: "unhealthy",
			timestamp,
			services: {
				database: "disconnected",
				redis: process.env.REDIS_URL ? "configured_but_error" : "not_configured",
				error: error.message,
			},
		}
	}
}
