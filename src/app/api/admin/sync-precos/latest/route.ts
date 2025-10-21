// src/app/api/admin/sync-precos/latest/route.ts
// Busca o último job de sincronização

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
	try {
		const latestJob = await prisma.syncJob.findFirst({
			orderBy: {
				createdAt: "desc",
			},
		})

		if (!latestJob) {
			return NextResponse.json({ job: null })
		}

		return NextResponse.json({ job: latestJob })
	} catch (error) {
		console.error("Erro ao buscar último job:", error)
		return NextResponse.json({ error: "Erro ao buscar último job" }, { status: 500 })
	}
}
