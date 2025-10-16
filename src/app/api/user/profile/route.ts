import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const { name } = await request.json()

		if (!name) {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
		}

		// Nota: Email NÃO pode ser alterado por questões de segurança
		// Se precisar alterar email, o usuário deve criar uma nova conta

		const updatedUser = await prisma.user.update({
			where: { id: session.user.id },
			data: {
				name, // Apenas nome pode ser alterado
				// email não é atualizado
			},
			select: {
				id: true,
				name: true,
				email: true,
				image: true,
			},
		})

		return NextResponse.json({
			message: "Perfil atualizado com sucesso",
			user: updatedUser,
		})
	} catch (error) {
		console.error("Error updating profile:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
