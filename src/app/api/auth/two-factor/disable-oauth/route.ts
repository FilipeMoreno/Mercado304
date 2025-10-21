import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestInfo } from "@/lib/auth-logger"
import { sendSecurityAlertEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"

/**
 * Endpoint customizado para desativar 2FA em contas OAuth (sem senha)
 * Valida token de reautenticação e desativa diretamente no banco
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const { authToken } = await request.json()

		if (!authToken) {
			return NextResponse.json({ error: "Token de reautenticação necessário" }, { status: 400 })
		}

		// Valida o token de reautenticação diretamente (sem fazer fetch interno)
		try {
			const tokenData = JSON.parse(Buffer.from(authToken, "base64").toString("utf-8"))

			// Validações
			if (tokenData.userId !== session.user.id) {
				return NextResponse.json({ error: "Token inválido - user ID" }, { status: 401 })
			}

			if (tokenData.email !== session.user.email) {
				return NextResponse.json({ error: "Email não corresponde" }, { status: 401 })
			}

			if (tokenData.operation !== "disable-2fa") {
				return NextResponse.json({ error: "Operação não corresponde" }, { status: 400 })
			}

			// Verifica se o token não expirou (10 minutos)
			const ageInMs = Date.now() - tokenData.timestamp
			if (ageInMs > 10 * 60 * 1000) {
				return NextResponse.json({ error: "Token expirado" }, { status: 401 })
			}
		} catch (error) {
			console.error("[Disable2FA-OAuth] Error parsing/validating token:", error)
			return NextResponse.json({ error: "Token inválido" }, { status: 401 })
		}

		// Desativa o 2FA diretamente no banco de dados
		await prisma.$transaction(async (tx) => {
			// Remove o registro de 2FA
			await tx.twoFactor.deleteMany({
				where: { userId: session.user.id },
			})

			// Marca como desabilitado no usuário
			await tx.user.update({
				where: { id: session.user.id },
				data: { twoFactorEnabled: false },
			})
		})

		// Registra evento de desativação no histórico
		const { ipAddress, userAgent } = await getRequestInfo()
		await logSecurityEvent({
			userId: session.user.id,
			eventType: SecurityEventType.TWO_FA_DISABLED,
			ipAddress,
			userAgent,
			metadata: {
				method: "oauth-reauth",
				via: "authenticator-app",
			},
		}).catch((err) => console.error("Failed to log 2FA disable event:", err))

		// Envia email de notificação
		const location = await getLocationFromIP(ipAddress)
		sendSecurityAlertEmail({
			user: {
				email: session.user.email,
				name: session.user.name || undefined,
			},
			action: "Autenticação de Dois Fatores (App) foi DESATIVADA",
			device: userAgent,
			location,
			ipAddress,
			timestamp: new Date().toLocaleString("pt-BR"),
		}).catch((err) => console.error("Failed to send security alert:", err))

		return NextResponse.json({
			success: true,
			message: "2FA desativado com sucesso",
		})
	} catch (error: any) {
		console.error("[Disable2FA-OAuth] Error:", error)
		return NextResponse.json({ error: error.message || "Erro ao desativar 2FA" }, { status: 500 })
	}
}
