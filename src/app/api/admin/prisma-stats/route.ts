import { NextResponse } from "next/server"
import { getPrismaQueryStats } from "@/lib/prisma"

export async function GET() {
	try {
		const stats = getPrismaQueryStats()
        return NextResponse.json(stats, {
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0",
            },
        })
	} catch (error) {
		console.error("Erro ao buscar estatísticas do Prisma:", error)
		return NextResponse.json({ error: "Erro ao buscar estatísticas" }, { status: 500 })
	}
}

