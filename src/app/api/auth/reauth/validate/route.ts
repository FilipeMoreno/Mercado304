import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

/**
 * Valida um token de reautenticação e permite operações sensíveis
 */
export async function POST(request: NextRequest) {
  try {
    // Obtém a sessão usando os headers da requisição
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { authToken, operation } = await request.json()

    if (!authToken || !operation) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 })
    }

    // Decodifica e valida o token
    const tokenData = JSON.parse(Buffer.from(authToken, "base64").toString("utf-8"))
    const { userId, operation: tokenOperation, timestamp, email } = tokenData

    // Validações
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Token inválido - user ID" }, { status: 401 })
    }

    if (email !== session.user.email) {
      return NextResponse.json({ error: "Email não corresponde" }, { status: 401 })
    }

    if (operation !== tokenOperation) {
      return NextResponse.json({ error: "Operação não corresponde" }, { status: 400 })
    }

    // Verifica se o token não expirou (10 minutos)
    const ageInMs = Date.now() - timestamp
    if (ageInMs > 10 * 60 * 1000) {
      return NextResponse.json({ error: "Token expirado. Por favor, reautentique." }, { status: 401 })
    }

    // Token válido! Retorna sucesso
    return NextResponse.json({
      valid: true,
      userId,
      operation,
    })
  } catch (error: any) {
    console.error("[ValidateToken] Error validating reauth token:", error)
    return NextResponse.json({ error: "Token inválido - " + error.message }, { status: 401 })
  }
}

