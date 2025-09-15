import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
	try {
		// Primeiro, obter o usuário atual
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
		}

		const userId = session.user.id

		// Buscar histórico de sessões (incluindo as antigas)
		const sessionHistory = await prisma.session.findMany({
			where: {
				userId: userId,
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 20, // Últimas 20 tentativas
		})

		// Transformar dados para o formato esperado
		const loginHistory = sessionHistory.map((session, index) => {
			const isRecent = index < 5 // Considerar as 5 mais recentes como sucessos
			const isSuccess = new Date(session.expiresAt) > new Date() // Se não expirou, foi sucesso

			return {
				id: session.id,
				device: session.userAgent || "Dispositivo desconhecido",
				location: "Localização não disponível", // Better Auth não fornece por padrão
				timestamp: new Date(session.createdAt),
				success: isSuccess,
				ip: session.ipAddress || "IP não disponível",
				userAgent: session.userAgent,
				sessionDuration: session.expiresAt
					? Math.floor(
							(new Date(session.expiresAt).getTime() - new Date(session.createdAt).getTime()) / (1000 * 60 * 60 * 24),
						) + " dias"
					: "Indefinido",
			}
		})

		return NextResponse.json(loginHistory)
	} catch (error: any) {
		console.error("Erro ao buscar histórico de login:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
