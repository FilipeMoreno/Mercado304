import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"

/**
 * Inicia o fluxo de reautenticação com Google para operações sensíveis
 * Retorna a URL para redirecionar o usuário
 */
export async function POST(request: NextRequest) {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const { operation } = await request.json()

		// Valida a operação
		const validOperations = [
			"enable-2fa",
			"disable-2fa",
			"disable-email-2fa",
			"generate-backup-codes",
			"manage-passkey",
			"change-password",
		]
		if (!validOperations.includes(operation)) {
			return NextResponse.json({ error: "Operação inválida" }, { status: 400 })
		}

		// Cria uma URL de reautenticação do Google
		const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

		const callbackUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/reauth/google/callback`

		googleAuthUrl.searchParams.set("client_id", process.env.AUTH_GOOGLE_ID as string)
		googleAuthUrl.searchParams.set("redirect_uri", callbackUrl)
		googleAuthUrl.searchParams.set("response_type", "code")
		googleAuthUrl.searchParams.set("scope", "email profile")
		googleAuthUrl.searchParams.set("prompt", "login") // Força reautenticação
		googleAuthUrl.searchParams.set("login_hint", session.user.email) // Sugere o email do usuário
		googleAuthUrl.searchParams.set(
			"state",
			JSON.stringify({
				userId: session.user.id,
				operation,
				timestamp: Date.now(),
			}),
		)

		return NextResponse.json({
			reauthUrl: googleAuthUrl.toString(),
		})
	} catch (error: any) {
		console.error("Error creating reauth URL:", error)
		return NextResponse.json({ error: error.message || "Erro ao criar URL de reautenticação" }, { status: 500 })
	}
}
