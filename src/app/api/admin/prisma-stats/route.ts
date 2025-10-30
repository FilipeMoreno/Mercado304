import { NextResponse } from "next/server"
import { getPrismaQueryStats } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
	try {
		const stats = getPrismaQueryStats()
		return NextResponse.json(stats)
	} catch (error) {
		console.error("Erro ao buscar estatísticas do Prisma:", error)
		return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
	}
}

