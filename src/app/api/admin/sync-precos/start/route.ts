// src/app/api/admin/sync-precos/start/route.ts
// Inicia job de sincronização usando fila (BullMQ)

import { NextResponse } from "next/server"
import { addPriceSyncJob } from "@/lib/queue"

export async function POST(request: Request) {
	try {
		// Pega qualquer parâmetro que você precise para o job
		const body = await request.json().catch(() => ({}))
		
		// Adiciona o job à fila
		const job = await addPriceSyncJob(body)

		// Responde IMEDIATAMENTE
		// Nota: O jobId retornado é do BullMQ, mas o handler criará um registro na tabela SyncJob
		// A página de admin deve buscar o último job da tabela SyncJob
		return NextResponse.json({
			message: 'Sincronização de preços iniciada.',
			jobId: job.id, // ID do BullMQ
			status: 'enqueued',
		})
	} catch (error) {
		console.error("Erro ao iniciar sincronização:", error)
		return NextResponse.json({ 
			error: "Erro ao iniciar sincronização",
			details: error instanceof Error ? error.message : "Erro desconhecido"
		}, { status: 500 })
	}
}

