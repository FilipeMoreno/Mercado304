// src/app/api/admin/sync-precos/history/route.ts
// Retorna histórico de sincronizações

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const limit = parseInt(searchParams.get("limit") || "50", 10)
		const offset = parseInt(searchParams.get("offset") || "0", 10)

		console.log(`[Sync History] Buscando histórico: limit=${limit}, offset=${offset}`)

		const [jobs, total] = await Promise.all([
			prisma.syncJob.findMany({
				orderBy: {
					createdAt: "desc",
				},
				take: limit,
				skip: offset,
			}),
			prisma.syncJob.count(),
		])

		console.log(`[Sync History] Encontrados: ${jobs.length} jobs de ${total} total`)
		
		if (jobs.length > 0) {
			console.log(`[Sync History] Primeiro job:`, {
				id: jobs[0].id,
				status: jobs[0].status,
				tipo: jobs[0].tipo,
				createdAt: jobs[0].createdAt,
			})
		}

		return NextResponse.json({
			jobs,
			total,
			limit,
			offset,
		})
	} catch (error) {
		console.error("[Sync History] Erro ao buscar histórico:", error)
		if (error instanceof Error) {
			console.error("[Sync History] Mensagem:", error.message)
			console.error("[Sync History] Stack:", error.stack)
		}
		return NextResponse.json(
			{ 
				error: "Erro ao buscar histórico",
				details: error instanceof Error ? error.message : "Erro desconhecido"
			}, 
			{ status: 500 }
		)
	}
}

