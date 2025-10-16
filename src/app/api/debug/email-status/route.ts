import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Endpoint de debug para verificar status do emailVerified
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Busca direto do banco de dados
    const userFromDB = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    // Busca contas vinculadas
    const accounts = await prisma.account.findMany({
      where: { userId: session.user.id },
      select: {
        providerId: true,
        accountId: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      session: {
        userId: session.user.id,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
      },
      database: userFromDB,
      accounts: accounts,
      match: session.user.emailVerified === userFromDB?.emailVerified,
    })
  } catch (error: any) {
    console.error("[DebugEmailStatus] Error:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao verificar status" },
      { status: 500 }
    )
  }
}

