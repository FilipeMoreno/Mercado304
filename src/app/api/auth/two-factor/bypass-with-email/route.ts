import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { logAuthEvent } from "@/lib/auth-logger"
import { sendNewSessionEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"
import { prisma } from "@/lib/prisma"

/**
 * Cria sessão após validação de código 2FA por email
 * Bypassa o Better Auth pois já validamos o código
 */
export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json()

		if (!email) {
			return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
		}

		// Busca usuário
		const user = await prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
		}

		// Obtém informações da requisição
		const headersList = await headers()
		const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "Unknown"
		const userAgent = headersList.get("user-agent") || "Unknown"

		// Gera token único e seguro
		const { randomBytes } = await import("node:crypto")
		const sessionToken = randomBytes(32).toString("base64url")

		const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) // 7 dias

		// Remove sessões antigas deste dispositivo (opcional)
		await prisma.session.deleteMany({
			where: {
				userId: user.id,
				userAgent,
			},
		})

		// Cria nova sessão
		const _session = await prisma.session.create({
			data: {
				id: sessionToken,
				userId: user.id,
				expiresAt,
				token: sessionToken,
				ipAddress,
				userAgent,
				loginMethod: "email-2fa",
			},
		})

		// Atualiza lastLoginMethod
		await prisma.user.update({
			where: { id: user.id },
			data: { lastLoginMethod: "email" },
		})

		// Registra no histórico
		await logAuthEvent({
			userId: user.id,
			eventType: "login",
			method: "email",
			ipAddress,
			userAgent,
			metadata: {
				twoFactorMethod: "email",
			},
		}).catch((err) => console.error("Failed to log:", err))

		// Envia email de notificação de novo login
		const location = await getLocationFromIP(ipAddress)
		sendNewSessionEmail({
			user: {
				email: user.email,
				name: user.name || undefined,
			},
			device: userAgent,
			location,
			ipAddress,
			timestamp: new Date().toLocaleString("pt-BR"),
		}).catch((err) => console.error("[Bypass2FAEmail] Failed to send session email:", err))

		// Prepara resposta com cookie
		const response = NextResponse.json({
			success: true,
			message: "Login completado",
		})

		// Define o cookie (formato Better Auth)
		response.cookies.set({
			name: "better-auth.session_token",
			value: sessionToken,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7,
			path: "/",
		})

		return response
	} catch (error: any) {
		console.error("[Bypass2FAEmail] Error:", error)
		return NextResponse.json({ error: "Erro ao criar sessão" }, { status: 500 })
	}
}
