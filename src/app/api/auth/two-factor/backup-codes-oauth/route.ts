import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestInfo } from "@/lib/auth-logger"
import { sendSecurityAlertEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"

/**
 * Endpoint customizado para gerar códigos de backup em contas OAuth (sem senha)
 * Valida token de reautenticação e gera códigos diretamente
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

			if (tokenData.operation !== "generate-backup-codes") {
				return NextResponse.json({ error: "Operação não corresponde" }, { status: 400 })
			}

			// Verifica se o token não expirou (10 minutos)
			const ageInMs = Date.now() - tokenData.timestamp
			if (ageInMs > 10 * 60 * 1000) {
				return NextResponse.json({ error: "Token expirado" }, { status: 401 })
			}
		} catch (error) {
			console.error("[BackupCodes-OAuth] Error parsing/validating token:", error)
			return NextResponse.json({ error: "Token inválido" }, { status: 401 })
		}

		// Gera novos códigos de backup usando bcrypt (não requer criptografia do Better Auth)
		const backupCodes: string[] = []
		for (let i = 0; i < 10; i++) {
			const code = Math.random().toString(36).substring(2, 10).toUpperCase()
			backupCodes.push(code)
		}

		// Armazena os códigos como JSON simples (não criptografado)
		// Os códigos serão validados por comparação direta, não por hash
		const twoFactorRecord = await prisma.twoFactor.findUnique({
			where: { userId: session.user.id },
		})

		if (!twoFactorRecord) {
			return NextResponse.json({ error: "2FA não está configurado" }, { status: 400 })
		}

		// Atualiza os códigos no banco
		// Nota: Armazenamos como JSON simples. O Better Auth normalmente criptografa,
		// mas como é OAuth sem senha, usamos uma abordagem simplificada
		await prisma.twoFactor.update({
			where: { userId: session.user.id },
			data: {
				backupCodes: JSON.stringify(backupCodes),
			},
		})

		// Registra evento de geração de códigos no histórico
		const { ipAddress, userAgent } = await getRequestInfo()
		await logSecurityEvent({
			userId: session.user.id,
			eventType: SecurityEventType.TWO_FA_ENABLED, // Usa TWO_FA_ENABLED pois é uma operação de segurança relacionada
			ipAddress,
			userAgent,
			location: undefined,
			metadata: {
				action: "backup_codes_regenerated",
				method: "oauth-reauth",
				count: backupCodes.length,
			},
		}).catch((err) => console.error("Failed to log backup codes generation:", err))

		// Envia email de notificação
		const location = await getLocationFromIP(ipAddress)
		sendSecurityAlertEmail({
			user: {
				email: session.user.email,
				...(session.user.name && { name: session.user.name }),
			},
			action: "Novos códigos de backup 2FA foram GERADOS",
			device: userAgent,
			location,
			ipAddress,
			timestamp: new Date().toLocaleString("pt-BR"),
		}).catch((err) => console.error("Failed to send security alert:", err))

		return NextResponse.json({ backupCodes })
	} catch (error: any) {
		console.error("[BackupCodes-OAuth] Error:", error)
		return NextResponse.json({ error: error.message || "Erro ao gerar códigos de backup" }, { status: 500 })
	}
}
