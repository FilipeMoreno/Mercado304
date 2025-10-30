// src/app/api/admin/sync-precos/cancel/[jobId]/route.ts
// Cancela um job de sincronização em execução

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
	try {
		const resolvedParams = await params
		const job = await prisma.syncJob.findUnique({
			where: { id: resolvedParams.jobId },
		})

		if (!job) {
			return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
		}

		// Só pode cancelar jobs que estão pending ou running
		if (job.status !== "pending" && job.status !== "running") {
			return NextResponse.json(
				{ error: "Job não pode ser cancelado (já concluído ou falhou)" },
				{ status: 400 },
			)
		}

		// Tentar cancelar o job no BullMQ (se existir)
		// Nota: O jobId da tabela SyncJob é diferente do jobId do BullMQ
		// Por isso vamos apenas marcar como cancelado na tabela
		// O worker deve verificar periodicamente se o job foi cancelado

		// Atualizar status para cancelled
		const updatedJob = await prisma.syncJob.update({
			where: { id: resolvedParams.jobId },
			data: {
				status: "cancelled",
				completedAt: new Date(),
				logs: [...((job.logs as string[]) || []), `[${new Date().toISOString()}] Sincronização cancelada pelo usuário`],
			},
		})

		return NextResponse.json({
			success: true,
			message: "Sincronização cancelada com sucesso",
			job: updatedJob,
		})
	} catch (error) {
		console.error("Erro ao cancelar job:", error)
		return NextResponse.json({ error: "Erro ao cancelar sincronização" }, { status: 500 })
	}
}

