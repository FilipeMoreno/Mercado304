import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
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

    // Valida se há corpo na requisição
    const contentType = request.headers.get("content-type")
    if (!contentType?.includes("application/json")) {
      return NextResponse.json({ error: "Content-Type deve ser application/json" }, { status: 400 })
    }

    const body = await request.text()
    if (!body || body.trim() === "") {
      return NextResponse.json({ error: "Corpo da requisição está vazio" }, { status: 400 })
    }

    let data: {
      eventType?: "login" | "reauth" | "logout"
      method?: "email" | "google" | "one-tap" | "passkey" | "reauth-google"
      metadata?: Record<string, unknown>
    }
    try {
      data = JSON.parse(body)
    } catch {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }

    const { eventType, method, metadata } = data

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
          name: session.user.name || undefined,
        },
        device: userAgent,
        location,
        ipAddress,
        timestamp: new Date().toLocaleString('pt-BR'),
      }).catch(err => console.error("Failed to send new session email:", err))
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erro ao registrar evento"
    console.error("[LogAuthEvent] Error:", error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

