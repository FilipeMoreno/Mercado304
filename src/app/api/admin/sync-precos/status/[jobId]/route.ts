// src/app/api/admin/sync-precos/status/[jobId]/route.ts
// Consulta status de um job de sincronização da tabela SyncJob

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: { jobId: string } }) {
	try {
		const { jobId } = params
		if (!jobId) {
			return NextResponse.json({ error: "Job ID é obrigatório" }, { status: 400 })
		}

		const syncJob = await prisma.syncJob.findUnique({
			where: { id: jobId },
		})

		if (!syncJob) {
			return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
		}

		return NextResponse.json({
			id: syncJob.id,
			status: syncJob.status,
			progresso: syncJob.progresso,
			mercadosProcessados: syncJob.mercadosProcessados,
			produtosProcessados: syncJob.produtosProcessados,
			precosRegistrados: syncJob.precosRegistrados,
			erros: syncJob.erros,
			logs: syncJob.logs,
			detalhes: syncJob.detalhes,
			startedAt: syncJob.startedAt,
			completedAt: syncJob.completedAt,
			createdAt: syncJob.createdAt,
			updatedAt: syncJob.updatedAt,
		})
	} catch (error) {
		console.error("Erro ao buscar status do job:", error)
		return NextResponse.json({ 
			error: "Erro ao buscar status",
			details: error instanceof Error ? error.message : "Erro desconhecido"
		}, { status: 500 })
	}
}

