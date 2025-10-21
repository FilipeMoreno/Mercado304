import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

/**
 * Verifica se o usuário tem uma conta com senha (não é apenas OAuth)
 */
export async function GET(_request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		// Buscar conta com senha (Better Auth usa "credential" para contas de email/senha)
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "credential",
			},
			select: {
				id: true,
				password: true,
			},
		})

		const hasPassword = !!account?.password

		return NextResponse.json({ hasPassword })
	} catch (error) {
		console.error("Error checking password:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
