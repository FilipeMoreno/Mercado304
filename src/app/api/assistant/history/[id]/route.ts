import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/assistant/history/[id]
 * Busca uma sessão específica do assistente
 */
export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const chatSession = await prisma.assistantChatSession.findUnique({
			where: {
				id: params.id,
			},
		})

		if (!chatSession) {
			return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
		}

		// Verificar se a sessão pertence ao usuário logado
		if (chatSession.userId !== session.user.id) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
		}

		// Retornar no formato esperado pelo frontend
		const formattedSession = {
			id: chatSession.id,
			title: chatSession.title,
			messages: chatSession.messages,
			createdAt: chatSession.createdAt,
			updatedAt: chatSession.updatedAt,
			isPinned: chatSession.isPinned,
			isArchived: chatSession.isArchived,
			messageCount: Array.isArray(chatSession.messages) ? chatSession.messages.length : 0,
			lastMessage:
				Array.isArray(chatSession.messages) && chatSession.messages.length > 0
					? (chatSession.messages[chatSession.messages.length - 1] as any)?.content || ""
					: "",
		}

		return NextResponse.json(formattedSession)
	} catch (error) {
		return handleApiError(error)
	}
}

/**
 * PUT /api/assistant/history/[id]
 * Atualiza uma sessão existente do assistente
 */
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const body = await request.json()
		const { title, messages, isPinned, isArchived } = body

		// Verificar se a sessão existe e pertence ao usuário
		const existingSession = await prisma.assistantChatSession.findUnique({
			where: { id: params.id },
		})

		if (!existingSession) {
			return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
		}

		if (existingSession.userId !== session.user.id) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
		}

		// Atualizar sessão
		const updatedSession = await prisma.assistantChatSession.update({
			where: { id: params.id },
			data: {
				...(title !== undefined && { title }),
				...(messages !== undefined && { messages }),
				...(isPinned !== undefined && { isPinned }),
				...(isArchived !== undefined && { isArchived }),
				updatedAt: new Date(),
			},
		})

		// Retornar no formato esperado pelo frontend
		const formattedSession = {
			id: updatedSession.id,
			title: updatedSession.title,
			messages: updatedSession.messages,
			createdAt: updatedSession.createdAt,
			updatedAt: updatedSession.updatedAt,
			isPinned: updatedSession.isPinned,
			isArchived: updatedSession.isArchived,
			messageCount: Array.isArray(updatedSession.messages) ? updatedSession.messages.length : 0,
			lastMessage:
				Array.isArray(updatedSession.messages) && updatedSession.messages.length > 0
					? (updatedSession.messages[updatedSession.messages.length - 1] as any)?.content || ""
					: "",
		}

		return NextResponse.json(formattedSession)
	} catch (error) {
		return handleApiError(error)
	}
}

/**
 * DELETE /api/assistant/history/[id]
 * Deleta uma sessão do assistente
 */
export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Verificar se a sessão existe e pertence ao usuário
		const existingSession = await prisma.assistantChatSession.findUnique({
			where: { id: params.id },
		})

		if (!existingSession) {
			return NextResponse.json({ error: "Sessão não encontrada" }, { status: 404 })
		}

		if (existingSession.userId !== session.user.id) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
		}

		// Deletar sessão
		await prisma.assistantChatSession.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ message: "Sessão deletada com sucesso" })
	} catch (error) {
		return handleApiError(error)
	}
}
