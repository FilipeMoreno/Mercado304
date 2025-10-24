// src/app/api/admin/backup/start/route.ts
// Inicia job de backup

import { NextResponse } from "next/server"
import { addBackupJob } from "@/lib/queue"

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}))
		
		// Adiciona o job à fila
		const job = await addBackupJob(body)

		// Responde IMEDIATAMENTE
		return NextResponse.json({
			message: 'Backup iniciado.',
			jobId: job.id,
			status: 'enqueued',
		})
	} catch (error) {
		console.error("Erro ao iniciar backup:", error)
		return NextResponse.json({ 
			error: "Erro ao iniciar backup",
			details: error instanceof Error ? error.message : "Erro desconhecido"
		}, { status: 500 })
	}
}
