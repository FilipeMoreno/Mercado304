import { NextResponse } from "next/server"
import { resetPrismaQueryCounter } from "@/lib/prisma"

export async function POST() {
	try {
		resetPrismaQueryCounter()
		return NextResponse.json({ success: true, message: "Contador resetado com sucesso" })
	} catch (error) {
		console.error("Erro ao resetar contador:", error)
		return NextResponse.json({ error: "Erro ao resetar contador" }, { status: 500 })
	}
}

