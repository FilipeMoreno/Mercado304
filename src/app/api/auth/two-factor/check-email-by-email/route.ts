import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * Verifica se um email tem 2FA por email habilitado
 * Usado na página de 2FA quando não há sessão completa
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({
        enabled: false,
        reason: "no_email"
      })
    }


    // Busca usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        twoFactorEmailEnabled: true,
        twoFactorEnabled: true,
      },
    })


    return NextResponse.json({
      enabled: user?.twoFactorEmailEnabled || false,
      totpEnabled: user?.twoFactorEnabled || false,
    })
  } catch (error: any) {
    console.error("[CheckEmail2FAByEmail] Error:", error)
    return NextResponse.json({
      enabled: false,
      reason: "error"
    })
  }
}

