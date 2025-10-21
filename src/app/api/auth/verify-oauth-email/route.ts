import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Marca email como verificado para usuários OAuth
 * (Google já validou o email deles)
 */
export async function POST(_request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Se já está verificado, não faz nada
		if (session.user.emailVerified) {
			return NextResponse.json({ success: true, alreadyVerified: true })
		}

		// Verifica se o usuário tem conta OAuth (Google)
		const oauthAccount = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "google",
			},
		})

		if (!oauthAccount) {
			return NextResponse.json({ error: "Usuário não tem conta OAuth" }, { status: 400 })
		}

		// Marca email como verificado
		await prisma.user.update({
			where: { id: session.user.id },
			data: { emailVerified: true },
		})

		console.log(`[VerifyOAuthEmail] Email marked as verified for OAuth user ${session.user.id}`)

		return NextResponse.json({ success: true })
	} catch (error: any) {
		console.error("[VerifyOAuthEmail] Error:", error)
		return NextResponse.json({ error: error.message || "Erro ao verificar email" }, { status: 500 })
	}
}
