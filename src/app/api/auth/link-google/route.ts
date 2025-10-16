import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

/**
 * Inicia o processo de vinculação de conta Google
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Cria um state token para vincular a conta
    const state = JSON.stringify({
      userId: session.user.id,
      action: "link",
      timestamp: Date.now(),
    })

    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")
    const callbackUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/link-google/callback`

    googleAuthUrl.searchParams.set("client_id", process.env.AUTH_GOOGLE_ID as string)
    googleAuthUrl.searchParams.set("redirect_uri", callbackUrl)
    googleAuthUrl.searchParams.set("response_type", "code")
    googleAuthUrl.searchParams.set("scope", "email profile")
    googleAuthUrl.searchParams.set("state", state)
    googleAuthUrl.searchParams.set("access_type", "offline")
    googleAuthUrl.searchParams.set("prompt", "consent") // Força seleção de conta

    console.log(`[LinkGoogle] Redirecting user ${session.user.id} to Google OAuth`)

    return NextResponse.json({ url: googleAuthUrl.toString() })
  } catch (error: any) {
    console.error("[LinkGoogle] Error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao iniciar vinculação" },
      { status: 500 }
    )
  }
}

