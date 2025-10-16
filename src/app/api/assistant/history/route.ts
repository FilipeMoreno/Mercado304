import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/assistant/history
 * Busca o histórico de conversas do assistente do usuário logado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Buscar sessões do usuário, ordenadas por data de atualização (mais recente primeiro)
    const sessions = await prisma.assistantChatSession.findMany({
      where: {
        userId: session.user.id,
        isArchived: false, // Não incluir sessões arquivadas
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 50, // Limite de 50 sessões
    })

    // Mapear para o formato esperado pelo frontend
    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      messages: session.messages,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      isPinned: session.isPinned,
      isArchived: session.isArchived,
      messageCount: Array.isArray(session.messages) ? session.messages.length : 0,
      lastMessage: Array.isArray(session.messages) && session.messages.length > 0
        ? (session.messages[session.messages.length - 1] as any)?.content || ""
        : "",
    }))

    return NextResponse.json(formattedSessions)
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/assistant/history
 * Cria uma nova sessão de chat do assistente
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { title, messages, isPinned = false } = body

    if (!title || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Dados incompletos ou inválidos" }, { status: 400 })
    }

    // Criar nova sessão
    const newSession = await prisma.assistantChatSession.create({
      data: {
        userId: session.user.id,
        title,
        messages,
        isPinned,
      },
    })

    // Retornar no formato esperado pelo frontend
    const formattedSession = {
      id: newSession.id,
      title: newSession.title,
      messages: newSession.messages,
      createdAt: newSession.createdAt,
      updatedAt: newSession.updatedAt,
      isPinned: newSession.isPinned,
      isArchived: newSession.isArchived,
      messageCount: Array.isArray(newSession.messages) ? newSession.messages.length : 0,
      lastMessage: Array.isArray(newSession.messages) && newSession.messages.length > 0
        ? (newSession.messages[newSession.messages.length - 1] as any)?.content || ""
        : "",
    }

    return NextResponse.json(formattedSession, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
