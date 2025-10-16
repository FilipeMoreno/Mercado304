import bcrypt from "bcryptjs"
import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"
import { getRequestInfo } from "@/lib/auth-logger"
import { sendSecurityAlertEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"

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

		// Buscar conta com senha (Better Auth armazena senhas na tabela Account)
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "credential", // Better Auth usa "credential" para contas de email/senha
			},
			select: {
				id: true,
				password: true,
				userId: true,
			},
		})

		if (!account) {
			return NextResponse.json({ error: "Conta não encontrada ou é uma conta social" }, { status: 404 })
		}

		if (!account.password) {
			return NextResponse.json({ error: "Senha atual não encontrada" }, { status: 400 })
		}

		// Verificar senha atual
		const isCurrentPasswordValid = await bcrypt.compare(currentPassword, account.password)
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

		// Atualizar senha na conta
		await prisma.account.update({
			where: { id: account.id },
			data: {
				password: hashedNewPassword,
			},
		})

		// Registra evento de alteração de senha
		const { ipAddress, userAgent } = await getRequestInfo()
		await logSecurityEvent({
			userId: session.user.id,
			eventType: SecurityEventType.PASSWORD_CHANGED,
			ipAddress,
			userAgent,
			metadata: {
				method: "password-update",
			},
		}).catch(err => console.error("Failed to log password change event:", err))

		// Envia email de notificação
		const location = await getLocationFromIP(ipAddress)
		sendSecurityAlertEmail({
			user: {
				email: session.user.email,
				name: session.user.name || undefined,
			},
			action: "Sua senha foi ALTERADA",
			device: userAgent,
			location,
			ipAddress,
			timestamp: new Date().toLocaleString('pt-BR'),
		}).catch(err => console.error("Failed to send security alert:", err))

		return NextResponse.json({
			message: "Senha alterada com sucesso",
		})
	} catch (error) {
		console.error("Error changing password:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
