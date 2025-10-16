import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as OTPAuth from "otplib"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"
import { getRequestInfo } from "@/lib/auth-logger"
import { sendSecurityAlertEmail } from "@/lib/email"
import { getLocationFromIP } from "@/lib/geolocation"

/**
 * Endpoint customizado para verificar TOTP em contas OAuth (sem senha)
 * Valida o código e marca 2FA como habilitado
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { code } = await request.json()

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    }

    // Busca o secret do 2FA (não criptografado para contas OAuth)
    const twoFactorRecord = await prisma.twoFactor.findUnique({
      where: { userId: session.user.id },
    })

    if (!twoFactorRecord) {
      return NextResponse.json({ error: "2FA não está configurado" }, { status: 400 })
    }

    // Valida o código TOTP usando o secret
    const isValid = OTPAuth.authenticator.verify({
      token: code,
      secret: twoFactorRecord.secret,
    })

    if (!isValid) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 })
    }

    // Marca o 2FA como habilitado
    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabled: true },
    })

    // Registra evento de ativação de 2FA no histórico
    const { ipAddress, userAgent } = await getRequestInfo()
    await logSecurityEvent({
      userId: session.user.id,
      eventType: SecurityEventType.TWO_FA_ENABLED,
      ipAddress,
      userAgent,
      metadata: {
        method: "totp-oauth",
        via: "authenticator-app",
      },
    }).catch(err => console.error("Failed to log 2FA enable event:", err))

    // Envia email de notificação
    const location = await getLocationFromIP(ipAddress)
    sendSecurityAlertEmail({
      user: {
        email: session.user.email,
        name: session.user.name || undefined,
      },
      action: "Autenticação de Dois Fatores (App) foi ATIVADA",
      device: userAgent,
      location,
      ipAddress,
      timestamp: new Date().toLocaleString('pt-BR'),
    }).catch(err => console.error("Failed to send security alert:", err))

    return NextResponse.json({
      success: true,
      message: "2FA ativado com sucesso"
    })
  } catch (error: any) {
    console.error("[VerifyTOTP-OAuth] Error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao verificar código" },
      { status: 500 }
    )
  }
}

