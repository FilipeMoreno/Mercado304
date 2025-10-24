// src/app/api/admin/sync-precos/status/[jobId]/route.ts
// Consulta status de um job de sincronização via BullMQ

import { NextResponse } from "next/server"
import { getPriceSyncJobStatus } from "@/lib/queue"

export async function GET(_request: Request, { params }: { params: { jobId: string } }) {
	try {
		const { jobId } = params
		if (!jobId) {
			return NextResponse.json({ error: "Job ID é obrigatório" }, { status: 400 })
		}

		const jobStatus = await getPriceSyncJobStatus(jobId)

		if (!jobStatus) {
			return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
		}

		return NextResponse.json({
			jobId: jobStatus.id,
			status: jobStatus.state,
			progress: jobStatus.progress,
			data: jobStatus.data,
			returnValue: jobStatus.returnValue,
			failedReason: jobStatus.failedReason,
			processedOn: jobStatus.processedOn,
			finishedOn: jobStatus.finishedOn,
			createdAt: jobStatus.createdAt,
		})
	} catch (error) {
		console.error("Erro ao buscar status do job:", error)
		return NextResponse.json({ 
			error: "Erro ao buscar status",
			details: error instanceof Error ? error.message : "Erro desconhecido"
		}, { status: 500 })
	}
}

