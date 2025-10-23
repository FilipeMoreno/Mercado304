// src/app/api/admin/sync-precos/latest/route.ts
// Busca o último job de sincronização

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const debugMode = searchParams.get("debug") === "true"
		const limit = parseInt(searchParams.get("limit") || "1000", 10)

		const latestJob = await prisma.syncJob.findFirst({
			orderBy: {
				createdAt: "desc",
			},
		})

		if (!latestJob) {
			return NextResponse.json({ job: null })
		}

		// Filtrar logs baseado no modo debug
		let filteredLogs = latestJob.logs as string[]

		if (!debugMode && Array.isArray(filteredLogs)) {
			// No modo normal, oculta logs com prefixos de debug
			filteredLogs = filteredLogs.filter((log) => {
				const logLower = log.toLowerCase()
				return !logLower.includes("[debug]") &&
					!logLower.includes("[api]") &&
					!logLower.includes("[server]") &&
					!logLower.includes("[batch]") &&
					!logLower.includes("[parsing]")
			})
		}

		// Aplicar limite de logs
		if (Array.isArray(filteredLogs)) {
			filteredLogs = filteredLogs.slice(-limit) // Pegar os últimos N logs
		}

		// Retornar job com logs filtrados
		const jobWithFilteredLogs = {
			...latestJob,
			logs: filteredLogs,
			// Adicionar informações sobre filtragem
			_logsInfo: {
				totalLogs: Array.isArray(latestJob.logs) ? latestJob.logs.length : 0,
				filteredLogs: Array.isArray(filteredLogs) ? filteredLogs.length : 0,
				debugMode,
				limit
			}
		}

		return NextResponse.json({ job: jobWithFilteredLogs })
	} catch (error) {
		console.error("Erro ao buscar último job:", error)
		return NextResponse.json({ error: "Erro ao buscar último job" }, { status: 500 })
	}
}

