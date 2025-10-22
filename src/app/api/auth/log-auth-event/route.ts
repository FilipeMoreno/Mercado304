import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestInfo, logAuthEvent } from "@/lib/auth-logger"
import { sendNewSessionEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"

/**
 * Endpoint para registrar eventos de autenticação (login, reauth, etc)
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const { eventType, method, metadata } = await request.json()

		if (!eventType || !method) {
			return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
		}

		// Obtém informações da requisição
		const { ipAddress, userAgent } = await getRequestInfo()

		// Registra o evento
		await logAuthEvent({
			userId: session.user.id,
			eventType,
			method,
			ipAddress,
			userAgent,
			metadata,
		})

		// Se for um evento de login, envia email de notificação
		if (eventType === "login") {
			const location = await getLocationFromIP(ipAddress)
			sendNewSessionEmail({
				user: {
					email: session.user.email,
					...(session.user.name && { name: session.user.name }),
				},
				device: userAgent,
				location,
				ipAddress,
				timestamp: new Date().toLocaleString("pt-BR"),
			}).catch((err) => console.error("Failed to send new session email:", err))
		}

		return NextResponse.json({ success: true })
	} catch (error: any) {
		console.error("[LogAuthEvent] Error:", error)
		return NextResponse.json({ error: error.message || "Erro ao registrar evento" }, { status: 500 })
	}
}
