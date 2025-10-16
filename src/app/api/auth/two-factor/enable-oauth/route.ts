import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as OTPAuth from "otplib"
import { logAuthEvent, getRequestInfo } from "@/lib/auth-logger"
import { SecurityEventType } from "@/lib/security-utils"
import { logSecurityEvent } from "@/lib/security-utils"

/**
 * Endpoint customizado para habilitar 2FA em contas OAuth (sem senha)
 * Gera TOTP e códigos de backup diretamente no banco
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verifica se o usuário tem conta com senha (não deve usar este endpoint)
    const credentialAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "credential",
      },
      select: {
        id: true,
        password: true,
      },
    })

    if (credentialAccount?.password) {
      return NextResponse.json(
        { error: "Use o endpoint padrão para contas com senha" },
        { status: 400 }
      )
    }

    // Gera secret para TOTP
    const secret = OTPAuth.authenticator.generateSecret()
    const totpURI = OTPAuth.authenticator.keyuri(session.user.email, "Mercado304", secret)

    // Gera 10 códigos de backup
    const backupCodes: string[] = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      backupCodes.push(code)
    }

    // Salva no banco de dados (sem criptografia para contas OAuth)
    await prisma.twoFactor.upsert({
      where: { userId: session.user.id },
      update: {
        secret,
        backupCodes: JSON.stringify(backupCodes),
      },
      create: {
        id: `2fa_${session.user.id}_${Date.now()}`,
        userId: session.user.id,
        secret,
        backupCodes: JSON.stringify(backupCodes),
      },
    })

    // Marca como habilitado (mas ainda precisa verificar com código TOTP)
    // A verificação será feita no frontend antes de realmente ativar

    // Nota: O evento de ativação será registrado após verificação do código TOTP
    // no endpoint verify-totp-oauth

    return NextResponse.json({
      totpURI,
      backupCodes,
    })
  } catch (error: any) {
    console.error("[Enable2FA-OAuth] Error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao habilitar 2FA" },
      { status: 500 }
    )
  }
}

