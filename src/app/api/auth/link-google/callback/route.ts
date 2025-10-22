import { randomBytes } from "node:crypto"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestInfo } from "@/lib/auth-logger"
import { sendSecurityAlertEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"

/**
 * Callback após autorização do Google para vinculação
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const code = searchParams.get("code")
		const stateParam = searchParams.get("state")

		if (!code || !stateParam) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=link_failed&message=Parâmetros inválidos", request.url),
			)
		}

		const state = JSON.parse(stateParam)
		const { userId, action, timestamp } = state

		if (action !== "link") {
			return NextResponse.redirect(new URL("/conta/seguranca?error=link_failed&message=Ação inválida", request.url))
		}

		// Verifica se o token não expirou (10 minutos)
		if (Date.now() - timestamp > 10 * 60 * 1000) {
			return NextResponse.redirect(new URL("/conta/seguranca?error=link_expired&message=Tempo expirado", request.url))
		}

		// Valida a sessão atual
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user || session.user.id !== userId) {
			return NextResponse.redirect(new URL("/conta/seguranca?error=link_failed&message=Sessão inválida", request.url))
		}

		// Troca o código por token
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				code,
				client_id: process.env.AUTH_GOOGLE_ID as string,
				client_secret: process.env.AUTH_GOOGLE_SECRET as string,
				redirect_uri: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/link-google/callback`,
				grant_type: "authorization_code",
			}),
		})

		if (!tokenResponse.ok) {
			console.error("[LinkGoogleCallback] Token exchange failed:", await tokenResponse.text())
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=link_failed&message=Falha na validação com Google", request.url),
			)
		}

		const tokenData = await tokenResponse.json()
		const accessToken = tokenData.access_token
		const refreshToken = tokenData.refresh_token
		const idToken = tokenData.id_token

		// Busca informações do usuário
		const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		if (!userInfoResponse.ok) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=link_failed&message=Falha ao obter informações", request.url),
			)
		}

		const userInfo = await userInfoResponse.json()
		const googleEmail = userInfo.email
		const googleId = userInfo.id

		console.log(`[LinkGoogleCallback] Linking Google account ${googleEmail} to user ${userId}`)

		// Verifica se este email Google já está vinculado a outra conta
		const existingGoogleAccount = await prisma.account.findFirst({
			where: {
				providerId: "google",
				accountId: googleId,
			},
			include: {
				user: true,
			},
		})

		if (existingGoogleAccount && existingGoogleAccount.userId !== userId) {
			return NextResponse.redirect(
				new URL(
					"/conta/seguranca?error=link_failed&message=Esta conta Google já está vinculada a outro usuário",
					request.url,
				),
			)
		}

		// Verifica se o usuário já tem uma conta Google vinculada
		const existingUserGoogleAccount = await prisma.account.findFirst({
			where: {
				userId,
				providerId: "google",
			},
		})

		if (existingUserGoogleAccount) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=link_failed&message=Você já tem uma conta Google vinculada", request.url),
			)
		}

		// Cria a vinculação
		await prisma.account.create({
			data: {
				id: randomBytes(16).toString("hex"),
				userId,
				providerId: "google",
				accountId: googleId,
				accessToken,
				refreshToken,
				idToken,
				accessTokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
				scope: tokenData.scope || "email profile",
			},
		})

		// Se o email ainda não está verificado, marca como verificado
		// (Google já validou o email)
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { emailVerified: true },
		})

		if (!user?.emailVerified) {
			await prisma.user.update({
				where: { id: userId },
				data: { emailVerified: true },
			})
			console.log(`[LinkGoogleCallback] Email marked as verified (via Google OAuth)`)
		}

		console.log(`[LinkGoogleCallback] Successfully linked Google account to user ${userId}`)

		// Registra evento de vinculação
		const { ipAddress, userAgent } = await getRequestInfo()
		await logSecurityEvent({
			userId,
			eventType: SecurityEventType.LOGIN_SUCCESS, // Poderia criar um novo tipo "ACCOUNT_LINKED"
			ipAddress,
			userAgent,
			location: undefined,
			metadata: {
				action: "google_account_linked",
				googleEmail,
				googleId,
			},
		}).catch((err) => console.error("Failed to log account link event:", err))

		// Envia email de notificação
		const location = await getLocationFromIP(ipAddress)

		const userForEmail: { email: string; name?: string } = {
			email: session.user.email,
		}

		if (session.user.name) {
			userForEmail.name = session.user.name
		}

		sendSecurityAlertEmail({
			user: userForEmail,
			action: `Conta Google (${googleEmail}) foi VINCULADA à sua conta`,
			device: userAgent,
			location,
			ipAddress,
			timestamp: new Date().toLocaleString("pt-BR"),
		}).catch((err) => console.error("Failed to send security alert:", err))

		return NextResponse.redirect(
			new URL("/conta/seguranca?link_success=true&message=Conta Google vinculada com sucesso", request.url),
		)
	} catch (error: any) {
		console.error("[LinkGoogleCallback] Error:", error)
		return NextResponse.redirect(new URL("/conta/seguranca?error=link_failed&message=Erro inesperado", request.url))
	}
}
