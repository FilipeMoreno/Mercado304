import bcrypt from "bcryptjs"
import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const { currentPassword, newPassword } = await request.json()

		if (!currentPassword || !newPassword) {
			return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 })
		}

		// Buscar usuário com senha
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				password: true,
				image: true,
			},
		})

		if (!user) {
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
		}

		// Verificar se é conta Google (sem senha local)
		if (!user.password && user.image) {
			return NextResponse.json({ error: "Contas Google não podem alterar senha aqui" }, { status: 400 })
		}

		if (!user.password) {
			return NextResponse.json({ error: "Senha atual não encontrada" }, { status: 400 })
		}

		// Verificar senha atual
		const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
		if (!isCurrentPasswordValid) {
			return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 })
		}

		// Validar nova senha
		const passwordRequirements = [
			{
				regex: /.{8,}/,
				message: "Nova senha deve ter pelo menos 8 caracteres",
			},
			{
				regex: /[A-Z]/,
				message: "Nova senha deve ter pelo menos uma letra maiúscula",
			},
			{
				regex: /[a-z]/,
				message: "Nova senha deve ter pelo menos uma letra minúscula",
			},
			{ regex: /\d/, message: "Nova senha deve ter pelo menos um número" },
			{
				regex: /[^A-Za-z0-9]/,
				message: "Nova senha deve ter pelo menos um caractere especial",
			},
		]

		for (const requirement of passwordRequirements) {
			if (!requirement.regex.test(newPassword)) {
				return NextResponse.json({ error: requirement.message }, { status: 400 })
			}
		}

		// Hash da nova senha
		const hashedNewPassword = await bcrypt.hash(newPassword, 12)

		// Atualizar senha
		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				password: hashedNewPassword,
			},
		})

		return NextResponse.json({
			message: "Senha alterada com sucesso",
		})
	} catch (error) {
		console.error("Error changing password:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
