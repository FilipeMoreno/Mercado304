import { PrismaClient } from "@prisma/client"
import { withAccelerate } from "@prisma/extension-accelerate"

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
}

// Contador de queries do Prisma
interface QueryCounter {
	count: number
	queries: Array<{
		model: string
		action: string
		timestamp: number
		duration?: number
	}>
}

// Armazenar contador globalmente (apenas no servidor)
const queryCounter: QueryCounter = {
	count: 0,
	queries: [],
}

// Função para incrementar contador
export function incrementPrismaQueryCounter(model: string, action: string, duration?: number) {
	queryCounter.count++
	queryCounter.queries.push({
		model,
		action,
		timestamp: Date.now(),
		duration,
	})

	// Manter apenas últimas 100 queries para não consumir muita memória
	if (queryCounter.queries.length > 100) {
		queryCounter.queries.shift()
	}
}

// Função para obter estatísticas
export function getPrismaQueryStats() {
	return {
		totalQueries: queryCounter.count,
		recentQueries: queryCounter.queries.slice(-20), // Últimas 20 queries
		queriesByModel: queryCounter.queries.reduce((acc, query) => {
			acc[query.model] = (acc[query.model] || 0) + 1
			return acc
		}, {} as Record<string, number>),
		queriesByAction: queryCounter.queries.reduce((acc, query) => {
			acc[query.action] = (acc[query.action] || 0) + 1
			return acc
		}, {} as Record<string, number>),
		averageDuration: queryCounter.queries.filter(q => q.duration !== undefined).reduce((acc, query, _, arr) => {
			return arr.length > 0 ? acc + (query.duration! / arr.length) : acc
		}, 0),
	}
}

// Função para resetar contador
export function resetPrismaQueryCounter() {
	queryCounter.count = 0
	queryCounter.queries = []
}

const prismaClientSingleton = () => {
	const client = new PrismaClient({
		// Apenas logar erros em produção
		log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
	})

	return client.$extends(
		withAccelerate()
	).$extends({
		query: {
			async $allOperations({ operation, model, args, query }: any) {
				const start = Date.now()
				const result = await query(args)
				const duration = Date.now() - start

				// Incrementar contador
				incrementPrismaQueryCounter(model || 'unknown', operation, duration)

				return result
			},
		},
	})
}

const prismaBase = globalForPrisma.prisma ?? prismaClientSingleton()

export const prisma = prismaBase as unknown as PrismaClient

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prismaBase as any
}
