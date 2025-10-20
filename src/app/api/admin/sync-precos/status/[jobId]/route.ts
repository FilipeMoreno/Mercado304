// src/app/api/admin/sync-precos/status/[jobId]/route.ts
// Consulta status de um job de sincronização

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, props: { params: Promise<{ jobId: string }> }) {
    const params = await props.params;
    try {
		const job = await prisma.syncJob.findUnique({
			where: { id: params.jobId },
		})

		if (!job) {
			return NextResponse.json({ error: "Job não encontrado" }, { status: 404 })
		}

		return NextResponse.json(job)
	} catch (error) {
		console.error("Erro ao buscar status do job:", error)
		return NextResponse.json({ error: "Erro ao buscar status" }, { status: 500 })
	}
}

