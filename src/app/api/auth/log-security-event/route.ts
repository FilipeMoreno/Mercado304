import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"
import { getRequestInfo } from "@/lib/auth-logger"
import { sendSecurityAlertEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"

/**
 * Endpoint para registrar eventos de segurança genéricos (2FA, passkey, etc)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { eventType, metadata, sendEmail: shouldSendEmail } = await request.json()

    if (!eventType) {
      return NextResponse.json({ error: "eventType é obrigatório" }, { status: 400 })
    }

    // Valida se é um tipo de evento válido
    if (!Object.values(SecurityEventType).includes(eventType as SecurityEventType)) {
      return NextResponse.json({ error: "Tipo de evento inválido" }, { status: 400 })
    }

    // Obtém informações da requisição
    const { ipAddress, userAgent } = await getRequestInfo()

    // Registra o evento
    await logSecurityEvent({
      userId: session.user.id,
      eventType: eventType as SecurityEventType,
      ipAddress,
      userAgent,
      metadata: metadata || {},
    })

    console.log(`[LogSecurityEvent] Event logged: ${eventType} for user ${session.user.id}`)

    // Envia email se solicitado
    if (shouldSendEmail) {
      const location = await getLocationFromIP(ipAddress)
      let action = ""

      if (eventType === SecurityEventType.PASSKEY_ADDED) {
        action = `Passkey "${metadata?.name || 'Novo Passkey'}" foi ADICIONADO`
      } else if (eventType === SecurityEventType.PASSKEY_REMOVED) {
        action = "Passkey foi REMOVIDO"
      }

      if (action) {
        sendSecurityAlertEmail({
          user: {
            email: session.user.email,
            name: session.user.name || undefined,
          },
          action,
          device: userAgent,
          location,
          ipAddress,
          timestamp: new Date().toLocaleString('pt-BR'),
        }).catch(err => console.error("Failed to send security alert:", err))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[LogSecurityEvent] Error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao registrar evento" },
      { status: 500 }
    )
  }
}

