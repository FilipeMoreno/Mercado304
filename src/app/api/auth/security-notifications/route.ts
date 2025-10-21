import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET - Buscar notificações de segurança do usuário
 */
export async function GET(_request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
		}

		const userId = session.user.id

		// Buscar notificações (não lidas primeiro)
		const notifications = await prisma.securityNotification.findMany({
			where: { userId },
			orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
			take: 50,
		})

		// Contar não lidas
		const unreadCount = notifications.filter((n) => !n.isRead).length

		return NextResponse.json({
			notifications,
			unreadCount,
		})
	} catch (error: any) {
		console.error("Erro ao buscar notificações:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

/**
 * PATCH - Marcar notificação como lida
 */
export async function PATCH(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
		}

		const { notificationId, markAllAsRead } = await request.json()
		const userId = session.user.id

		if (markAllAsRead) {
			// Marcar todas como lidas
			await prisma.securityNotification.updateMany({
				where: {
					userId,
					isRead: false,
				},
				data: {
					isRead: true,
				},
			})

			return NextResponse.json({ message: "Todas as notificações foram marcadas como lidas" })
		}

		if (!notificationId) {
			return NextResponse.json({ error: "notificationId é obrigatório" }, { status: 400 })
		}

		// Marcar notificação específica como lida
		const notification = await prisma.securityNotification.updateMany({
			where: {
				id: notificationId,
				userId, // Garantir que só pode marcar suas próprias notificações
			},
			data: {
				isRead: true,
			},
		})

		if (notification.count === 0) {
			return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
		}

		return NextResponse.json({ message: "Notificação marcada como lida" })
	} catch (error: any) {
		console.error("Erro ao atualizar notificação:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}

/**
 * DELETE - Deletar notificação
 */
export async function DELETE(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
		}

		const { notificationId, deleteAll } = await request.json()
		const userId = session.user.id

		if (deleteAll) {
			// Deletar todas as notificações lidas
			await prisma.securityNotification.deleteMany({
				where: {
					userId,
					isRead: true,
				},
			})

			return NextResponse.json({ message: "Todas as notificações lidas foram removidas" })
		}

		if (!notificationId) {
			return NextResponse.json({ error: "notificationId é obrigatório" }, { status: 400 })
		}

		// Deletar notificação específica
		const notification = await prisma.securityNotification.deleteMany({
			where: {
				id: notificationId,
				userId,
			},
		})

		if (notification.count === 0) {
			return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
		}

		return NextResponse.json({ message: "Notificação removida" })
	} catch (error: any) {
		console.error("Erro ao deletar notificação:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
