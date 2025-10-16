import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendTwoFactorEmail } from "@/lib/email"

// Enviar código de verificação por email
export async function POST(request: NextRequest) {
	try {

		// Tenta pegar o email do corpo da requisição (se enviado)
		let requestBody: any = {}
		try {
			requestBody = await request.json()
		} catch {
			// Corpo vazio, tudo bem
		}

		const emailFromRequest = requestBody.email

		// Tenta buscar sessão
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		let user: any = null
		let userId: string

		// Se tem sessão, usa ela
		if (session?.user) {
			userId = session.user.id
			user = await prisma.user.findUnique({
				where: { id: userId },
				select: { id: true, twoFactorEmailEnabled: true, email: true, name: true },
			})
		}
		// Se não tem sessão mas tem email, busca por email
		else if (emailFromRequest) {
			user = await prisma.user.findUnique({
				where: { email: emailFromRequest },
				select: { id: true, twoFactorEmailEnabled: true, email: true, name: true },
			})
			userId = user?.id
		}
		// Se não tem nenhum, retorna erro
		else {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		if (!user) {
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
		}

		if (!user.twoFactorEmailEnabled) {
			return NextResponse.json(
				{ error: "2FA por email não está habilitado" },
				{ status: 400 }
			)
		}

		// Invalida códigos antigos não usados deste usuário
		await prisma.twoFactorEmailCode.updateMany({
			where: {
				userId: userId,
				used: false,
			},
			data: {
				used: true,
				usedAt: new Date(),
			},
		})

		// Gerar código de 6 dígitos
		const code = Math.floor(100000 + Math.random() * 900000).toString()
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutos

		// Salvar código no banco
		await prisma.twoFactorEmailCode.create({
			data: {
				userId: userId,
				code,
				expiresAt,
				type: "EMAIL",
			},
		})

		console.log(`[2FA-Email-Send] Código gerado para usuário ${userId}, expira em 10min`)

		// Enviar email
		await sendTwoFactorEmail({
			user: {
				email: user.email,
				name: user.name || undefined,
			},
			code,
		})

		console.log(`[2FA-Email-Send] Email enviado com sucesso para ${user.email}`)

		return NextResponse.json({
			success: true,
			message: "Código de verificação enviado por email",
			expiresIn: "10 minutos",
		})
	} catch (error) {
		console.error("[2FA-Email-Send] ===== ERRO =====")
		console.error("[2FA-Email-Send] Erro ao enviar código:", error)
		return NextResponse.json(
			{ error: "Erro ao enviar código" },
			{ status: 500 }
		)
	}
}

// Verificar código de verificação
export async function PUT(request: NextRequest) {
	try {

		const { code, email } = await request.json()

		if (!code || code.length !== 6) {
			return NextResponse.json({ error: "Código inválido" }, { status: 400 })
		}

		// Tenta buscar sessão
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		let userId: string | undefined

		// Se tem sessão, usa ela
		if (session?.user) {
			userId = session.user.id
		}
		// Se não tem sessão mas tem email, busca userId pelo email
		else if (email) {
			const user = await prisma.user.findUnique({
				where: { email },
				select: { id: true },
			})
			userId = user?.id
		}

		if (!userId) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Buscar código válido no banco
		const validCode = await prisma.twoFactorEmailCode.findFirst({
			where: {
				userId: userId,
				code,
				expiresAt: { gt: new Date() },
				used: false,
			},
			orderBy: {
				createdAt: "desc",
			},
		})

		if (!validCode) {
			return NextResponse.json(
				{ error: "Código inválido ou expirado" },
				{ status: 400 }
			)
		}

		// Marca código como usado
		await prisma.twoFactorEmailCode.update({
			where: { id: validCode.id },
			data: {
				used: true,
				usedAt: new Date(),
			},
		})

		return NextResponse.json({
			success: true,
			message: "Código verificado com sucesso",
		})
	} catch (error) {
		console.error("[2FA-Email-Verify] ===== ERRO =====")
		console.error("[2FA-Email-Verify] Erro ao verificar código:", error)
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 }
		)
	}
}
