import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function DELETE(_request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const userId = session.user.id

		// Usar transação para garantir que tudo seja deletado ou nada seja
		await prisma.$transaction(async (tx) => {
			// Delete authentication-related data only
			// This application doesn't appear to have user-specific data yet

			// 1. Accounts (OAuth connections)
			await tx.account.deleteMany({
				where: { userId: userId },
			})

			// 2. Sessions
			await tx.session.deleteMany({
				where: { userId: userId },
			})

			// 3. Verification tokens
			if (session.user?.email) {
				await tx.verification.deleteMany({
					where: { identifier: session.user.email },
				})
			}

			// 4. Finally, delete the user
			await tx.user.delete({
				where: { id: userId },
			})
		})

		return NextResponse.json({
			message: "Conta excluída com sucesso",
		})
	} catch (error) {
		console.error("Error deleting account:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
