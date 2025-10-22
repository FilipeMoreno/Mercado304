import bcrypt from "bcryptjs"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestInfo } from "@/lib/auth-logger"
import { sendSecurityAlertEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"

// Enable Email 2FA
export async function POST(_request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Update user preferences to enable email 2FA
		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				twoFactorEmailEnabled: true,
			},
		})

		// Registra evento de ativação no histórico
		const { ipAddress, userAgent } = await getRequestInfo()
		await logSecurityEvent({
			userId: session.user.id,
			eventType: SecurityEventType.TWO_FA_ENABLED,
			ipAddress,
			userAgent,
			location: undefined,
			metadata: {
				method: "email",
				via: "email-2fa",
			},
		}).catch((err) => console.error("Failed to log 2FA email enable event:", err))

		// Envia email de notificação
		const location = await getLocationFromIP(ipAddress)
		sendSecurityAlertEmail({
			user: {
				email: session.user.email,
				...(session.user.name && { name: session.user.name }),
			},
			action: "Autenticação de Dois Fatores via EMAIL foi ATIVADA",
			device: userAgent,
			location,
			ipAddress,
			timestamp: new Date().toLocaleString("pt-BR"),
		}).catch((err) => console.error("Failed to send security alert:", err))

		return NextResponse.json({
			success: true,
			message: "2FA via email habilitado com sucesso",
		})
	} catch (error) {
		console.error("Error enabling email 2FA:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

// Disable Email 2FA
export async function DELETE(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const { password, authToken } = await request.json()

		// Valida senha ou token de reautenticação
		if (authToken) {
			// Valida token de reautenticação (conta OAuth)
			try {
				const tokenData = JSON.parse(Buffer.from(authToken, "base64").toString("utf-8"))

				if (tokenData.userId !== session.user.id || tokenData.email !== session.user.email) {
					return NextResponse.json({ error: "Token inválido" }, { status: 401 })
				}

				const ageInMs = Date.now() - tokenData.timestamp
				if (ageInMs > 10 * 60 * 1000) {
					return NextResponse.json({ error: "Token expirado" }, { status: 401 })
				}
			} catch (error) {
				console.error("[DisableEmail2FA] Error validating token:", error)
				return NextResponse.json({ error: "Token inválido" }, { status: 401 })
			}
		} else if (password) {
			// Valida senha (conta com senha)
			const account = await prisma.account.findFirst({
				where: {
					userId: session.user.id,
					providerId: "credential",
				},
				select: { password: true },
			})

			if (!account?.password) {
				return NextResponse.json({ error: "Senha não encontrada" }, { status: 400 })
			}

			const isPasswordValid = await bcrypt.compare(password, account.password)
			if (!isPasswordValid) {
				return NextResponse.json({ error: "Senha incorreta" }, { status: 401 })
			}
		} else {
			return NextResponse.json({ error: "Senha ou token de reautenticação necessário" }, { status: 400 })
		}

		// Update user preferences to disable email 2FA
		await prisma.user.update({
			where: { id: session.user.id },
			data: {
				twoFactorEmailEnabled: false,
			},
		})

		// Registra evento de desativação no histórico
		const { ipAddress, userAgent } = await getRequestInfo()
		await logSecurityEvent({
			userId: session.user.id,
			eventType: SecurityEventType.TWO_FA_DISABLED,
			ipAddress,
			userAgent,
			location: undefined,
			metadata: {
				method: password ? "password" : "oauth-reauth",
				via: "email-2fa",
			},
		}).catch((err) => console.error("Failed to log 2FA email disable event:", err))

		// Envia email de notificação
		const location = await getLocationFromIP(ipAddress)
		sendSecurityAlertEmail({
			user: {
				email: session.user.email,
				...(session.user.name && { name: session.user.name }),
			},
			action: "Autenticação de Dois Fatores via EMAIL foi DESATIVADA",
			device: userAgent,
			location,
			ipAddress,
			timestamp: new Date().toLocaleString("pt-BR"),
		}).catch((err) => console.error("Failed to send security alert:", err))

		return NextResponse.json({
			success: true,
			message: "2FA via email desabilitado com sucesso",
		})
	} catch (error: any) {
		console.error("[DisableEmail2FA] Error disabling email 2FA:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

// Check Email 2FA Status
export async function GET(_request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Get user's email 2FA preference
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				id: true,
				email: true,
				twoFactorEmailEnabled: true,
			},
		})

		return NextResponse.json({
			enabled: user?.twoFactorEmailEnabled || false,
			email: user?.email,
		})
	} catch (error) {
		console.error("Error checking email 2FA status:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
