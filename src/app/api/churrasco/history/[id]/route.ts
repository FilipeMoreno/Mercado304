import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/churrasco/history/[id]
 * Busca um cálculo específico do churrascômetro
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const calculation = await prisma.churrascoCalculation.findUnique({
      where: {
        id: resolvedParams.id,
      },
    })

    if (!calculation) {
      return NextResponse.json({ error: "Cálculo não encontrado" }, { status: 404 })
    }

    // Verificar se o cálculo pertence ao usuário logado
    if (calculation.userId !== session.user.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    return NextResponse.json(calculation)
  } catch (error) {
    return handleApiError(error)
  }
}

