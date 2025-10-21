import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestInfo, logAuthEvent } from "@/lib/auth-logger"

/**
 * Callback após reautenticação com Google
 * Valida a reautenticação e autoriza a operação
 */
export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams
		const code = searchParams.get("code")
		const stateParam = searchParams.get("state")

		if (!code || !stateParam) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=reauth_failed&message=Parâmetros inválidos", request.url),
			)
		}

		const state = JSON.parse(stateParam)
		const { userId, operation, timestamp } = state

		// Verifica se o token não expirou (5 minutos)
		if (Date.now() - timestamp > 5 * 60 * 1000) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=reauth_expired&message=Tempo de reautenticação expirado", request.url),
			)
		}

		// Valida a sessão atual
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user || session.user.id !== userId) {
			return NextResponse.redirect(new URL("/conta/seguranca?error=reauth_failed&message=Sessão inválida", request.url))
		}

		// Troca o código por token (validação básica com Google)
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				code,
				client_id: process.env.AUTH_GOOGLE_ID as string,
				client_secret: process.env.AUTH_GOOGLE_SECRET as string,
				redirect_uri: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/reauth/google/callback`,
				grant_type: "authorization_code",
			}),
		})

		if (!tokenResponse.ok) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=reauth_failed&message=Falha na validação com Google", request.url),
			)
		}

		const tokenData = await tokenResponse.json()
		const accessToken = tokenData.access_token

		// Busca informações do usuário para confirmar identidade
		const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		if (!userInfoResponse.ok) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=reauth_failed&message=Falha ao obter informações do usuário", request.url),
			)
		}

		const userInfo = await userInfoResponse.json()

		// Valida que o email corresponde
		if (userInfo.email !== session.user.email) {
			return NextResponse.redirect(
				new URL("/conta/seguranca?error=reauth_failed&message=Email não corresponde", request.url),
			)
		}

		// Registra a reautenticação no histórico de auditoria
		const { ipAddress, userAgent } = await getRequestInfo()
		await logAuthEvent({
			userId: session.user.id,
			eventType: "reauth",
			method: "reauth-google",
			ipAddress,
			userAgent,
			metadata: {
				operation,
				email: userInfo.email,
			},
		}).catch((err) => console.error("Failed to log reauth event:", err))

		// Reautenticação bem-sucedida! Cria um token de autorização temporário
		const authToken = Buffer.from(
			JSON.stringify({
				userId: session.user.id,
				operation,
				timestamp: Date.now(),
				email: userInfo.email,
			}),
		).toString("base64")

		console.log(`[ReauthCallback] Reauth successful for user ${session.user.id}, operation: ${operation}`)

		// Redireciona de volta para a página de segurança com o token
		return NextResponse.redirect(
			new URL(`/conta/seguranca?reauth_success=true&operation=${operation}&auth_token=${authToken}`, request.url),
		)
	} catch (error: any) {
		console.error("Error in reauth callback:", error)
		return NextResponse.redirect(new URL("/conta/seguranca?error=reauth_failed&message=Erro inesperado", request.url))
	}
}
