import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { logAuthEvent } from "@/lib/auth-logger"

/**
 * Completa o login após validação do código 2FA por email
 * Cria sessão usando Better Auth
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 })
    }


    // Busca usuário completo
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Cria sessão manualmente no banco de dados
    const headersList = await headers()
    const ipAddress =
      headersList.get("x-forwarded-for")?.split(",")[0] ||
      headersList.get("x-real-ip") ||
      "Unknown"
    const userAgent = headersList.get("user-agent") || "Unknown"

    // Gera token de sessão único usando cuid2 ou similar
    const { randomBytes } = await import("crypto")
    const sessionToken = randomBytes(32).toString("hex")

    const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000) // 7 dias

    // Cria sessão no banco
    const newSession = await prisma.session.create({
      data: {
        id: sessionToken,
        userId: user.id,
        expiresAt,
        token: sessionToken,
        ipAddress,
        userAgent,
        loginMethod: "email-2fa",
      },
    })


    // Registra no histórico
    await logAuthEvent({
      userId: user.id,
      eventType: "login",
      method: "email",
      ipAddress,
      userAgent,
      metadata: {
        twoFactorMethod: "email",
      },
    }).catch(err => console.error("Failed to log auth event:", err))

    // Retorna com cookie de sessão
    const response = NextResponse.json({
      success: true,
      message: "Login completado com sucesso",
    })

    // Define o cookie de sessão no formato do Better Auth
    response.cookies.set("better-auth.session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 dias
      path: "/",
    })


    return response
  } catch (error: any) {
    console.error("[Complete2FAEmailLogin] Error:", error)
    return NextResponse.json(
      { error: "Erro ao completar login" },
      { status: 500 }
    )
  }
}

