import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Verifica se o usuário tem 2FA por email habilitado
 * Usado na página de 2FA durante o login
 */
export async function GET(_request: NextRequest) {
	try {
		// Na página de 2FA, pode haver uma sessão parcial
		// Vamos tentar buscar o usuário pela sessão ou cookie
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({
				enabled: false,
				reason: "no_session",
			})
		}

		// Busca configuração do usuário

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				email: true,
				twoFactorEmailEnabled: true,
				twoFactorEnabled: true,
			},
		})

		const result = {
			enabled: user?.twoFactorEmailEnabled || false,
			totpEnabled: user?.twoFactorEnabled || false,
			userId: user?.id,
		}

		return NextResponse.json(result)
	} catch (error: any) {
		console.error("[CheckEmail2FA] ===== ERRO =====")
		console.error("[CheckEmail2FA] Error:", error)
		console.error("[CheckEmail2FA] Error message:", error.message)
		console.error("[CheckEmail2FA] Error stack:", error.stack)
		// Em caso de erro, retorna false para não quebrar a página
		return NextResponse.json({
			enabled: false,
			reason: "error",
			error: error.message,
		})
	}
}
