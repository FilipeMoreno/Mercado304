import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Verifica se o usuário tem conta Google vinculada
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Verifica se existe uma conta Google vinculada
    const googleAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        providerId: "google",
      },
    })

    return NextResponse.json({
      hasGoogleAccount: !!googleAccount,
      accountId: googleAccount?.accountId,
    })
  } catch (error: any) {
    console.error("[HasGoogleAccount] Error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao verificar conta Google" },
      { status: 500 }
    )
  }
}

