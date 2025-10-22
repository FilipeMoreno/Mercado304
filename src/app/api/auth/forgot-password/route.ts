import { type NextRequest, NextResponse } from "next/server"
import { sendPasswordResetEmail } from "@/lib/email"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json()

		if (!email) {
			return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
		}

		// Busca usuário pelo email
		const user = await prisma.user.findUnique({
			where: { email },
			select: {
				id: true,
				email: true,
				name: true,
			},
		})

		// Por segurança, sempre retorna sucesso mesmo se o email não existir
		// Isso evita que atacantes descubram quais emails estão cadastrados
		if (!user) {
			return NextResponse.json({
				success: true,
				message: "Se o email existir, você receberá um link de recuperação",
			})
		}

		// Gera token de reset
		const resetToken = Buffer.from(`${user.id}-${Date.now()}-${Math.random()}`).toString("base64url")

		const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

		// Cria registro de verificação
		await prisma.verification.create({
			data: {
				id: resetToken,
				identifier: user.email,
				value: resetToken,
				expiresAt,
			},
		})

		// URL de reset
		const resetUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`

		// Envia email
		const userForEmail: { email: string; name?: string } = {
			email: user.email,
		}
		
		if (user.name) {
			userForEmail.name = user.name
		}
		
		await sendPasswordResetEmail({
			user: userForEmail,
			url: resetUrl,
		})

		return NextResponse.json({
			success: true,
			message: "Email de recuperação enviado com sucesso",
		})
	} catch (error: any) {
		console.error("[ForgotPassword] Erro:", error)
		return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 })
	}
}
