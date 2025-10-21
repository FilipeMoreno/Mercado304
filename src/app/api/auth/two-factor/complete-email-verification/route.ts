import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Valida código 2FA por email
 * Apenas valida - não completa login (o Better Auth faz isso depois)
 */
export async function POST(request: NextRequest) {
	try {
		const { code, email } = await request.json()

		if (!code || !email) {
			return NextResponse.json({ error: "Código e email são obrigatórios" }, { status: 400 })
		}

		// Busca usuário
		const user = await prisma.user.findUnique({
			where: { email },
			select: { id: true, email: true, twoFactorEmailEnabled: true },
		})

		if (!user || !user.twoFactorEmailEnabled) {
			return NextResponse.json({ error: "Configuração inválida" }, { status: 400 })
		}

		// Verifica código
		const validCode = await prisma.twoFactorEmailCode.findFirst({
			where: {
				userId: user.id,
				code,
				expiresAt: { gt: new Date() },
				used: false,
			},
			orderBy: {
				createdAt: "desc",
			},
		})

		if (!validCode) {
			return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 })
		}

		// Marca código como usado
		await prisma.twoFactorEmailCode.update({
			where: { id: validCode.id },
			data: {
				used: true,
				usedAt: new Date(),
			},
		})

		// Retorna sucesso - o frontend vai chamar um endpoint especial para completar o login
		return NextResponse.json({
			success: true,
			message: "Código verificado com sucesso",
			userId: user.id,
			email: user.email,
		})
	} catch (error: any) {
		console.error("[Complete2FAEmail] ===== ERRO =====")
		console.error("[Complete2FAEmail] Error:", error)
		return NextResponse.json({ error: "Erro ao verificar código" }, { status: 500 })
	}
}
