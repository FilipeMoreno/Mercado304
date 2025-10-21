import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * ENDPOINT DE DEBUG - Marca email como NÃO verificado
 * USE APENAS PARA TESTES
 */
export async function POST(_request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Força emailVerified como false
		await prisma.user.update({
			where: { id: session.user.id },
			data: { emailVerified: false },
		})

		console.log(`[DEBUG] Email marked as UN-verified for user ${session.user.id}`)

		return NextResponse.json({
			success: true,
			message: "Email marcado como NÃO verificado. Faça logout e login novamente para ver o efeito.",
		})
	} catch (error: any) {
		console.error("[ForceUnverified] Error:", error)
		return NextResponse.json({ error: error.message || "Erro" }, { status: 500 })
	}
}
