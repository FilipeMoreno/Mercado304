import { type NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * Endpoint para listar todos os dispositivos confiáveis do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Busca todos os dispositivos confiáveis do usuário que ainda não expiraram
    const devices = await prisma.trustedDevice.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json({ devices })
  } catch (error: any) {
    console.error("[TrustedDevices] Error fetching devices:", error)
    return NextResponse.json(
      { error: error.message || "Erro ao buscar dispositivos" },
      { status: 500 }
    )
  }
}

