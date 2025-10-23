// src/app/api/admin/sync-precos/status/[jobId]/route.ts
// Consulta status de um job de sincronização

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { jobId: string } }) {
	try {
		const { searchParams } = new URL(request.url)
		const debugMode = searchParams.get("debug") === "true"
		const limit = parseInt(searchParams.get("limit") || "1000", 10)

		const job = await prisma.syncJob.findUnique({
			where: { id: params.jobId },
		})

		if (!job) {
			return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
		}

		// Filtrar logs baseado no modo debug
		let filteredLogs = job.logs as string[]

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
			...job,
			logs: filteredLogs,
			// Adicionar informações sobre filtragem
			_logsInfo: {
				totalLogs: Array.isArray(job.logs) ? job.logs.length : 0,
				filteredLogs: Array.isArray(filteredLogs) ? filteredLogs.length : 0,
				debugMode,
				limit
			}
		}

		return NextResponse.json(jobWithFilteredLogs)
	} catch (error) {
		console.error("Erro ao buscar status do job:", error)
		return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 })
	}
}

