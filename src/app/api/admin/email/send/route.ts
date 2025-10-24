// src/app/api/admin/email/send/route.ts
// Inicia job de envio de email

import { NextResponse } from "next/server"
import { addEmailSendJob } from "@/lib/queue"

export async function POST(request: Request) {
	try {
		const body = await request.json().catch(() => ({}))
		
		// Adiciona o job à fila
		const job = await addEmailSendJob(body)

		// Responde IMEDIATAMENTE
		return NextResponse.json({
			message: 'Email enfileirado para envio.',
			jobId: job.id,
			status: 'enqueued',
		})
	} catch (error) {
		console.error("Erro ao enfileirar email:", error)
		return NextResponse.json({ 
			error: "Erro ao enfileirar email",
			details: error instanceof Error ? error.message : "Erro desconhecido"
		}, { status: 500 })
	}
}
