import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getLocationFromIP } from "@/lib/geolocation"

// Função para extrair informações do User Agent
function getUserAgentInfo(userAgent: string): string {
	if (!userAgent || userAgent === "Dispositivo desconhecido") {
		return "Dispositivo desconhecido"
	}

	// Detectar navegador
	let browser = "Navegador desconhecido"
	if (userAgent.includes("Chrome")) browser = "Chrome"
	else if (userAgent.includes("Firefox")) browser = "Firefox"
	else if (userAgent.includes("Safari")) browser = "Safari"
	else if (userAgent.includes("Edge")) browser = "Edge"

	// Detectar sistema operacional
	let os = "OS desconhecido"
	if (userAgent.includes("Windows")) os = "Windows"
	else if (userAgent.includes("Mac OS")) os = "macOS"
	else if (userAgent.includes("Linux")) os = "Linux"
	else if (userAgent.includes("Android")) os = "Android"
	else if (userAgent.includes("iOS")) os = "iOS"

	// Detectar dispositivo
	let device = "Desktop"
	if (userAgent.includes("Mobile") || userAgent.includes("Android")) device = "Mobile"
	else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) device = "Tablet"

	return `${browser} - ${os} (${device})`
}

export async function GET(request: NextRequest) {
	try {
		// Primeiro obter a sessão atual para identificar o usuário
		const sessionResult = await auth.api.getSession({
			headers: await headers(),
		})
		if (!sessionResult?.user) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
		}

		const userId = sessionResult.user.id
		const currentSessionId = sessionResult.session?.id
		const currentSessionToken = request.cookies.get("better-auth.session_token")?.value

		// Buscar sessões do usuário diretamente do banco
		const prisma = new (await import("@prisma/client")).PrismaClient()

		const userSessions = await prisma.session.findMany({
			where: {
				userId: userId,
				expiresAt: {
					gt: new Date().toISOString(), // Apenas sessões não expiradas
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
		})

		await prisma.$disconnect()

		// Transformar dados para o formato esperado pelo frontend (com localização)
		const sessions = await Promise.all(
			userSessions.map(async (session: any) => ({
				id: session.id,
				device: getUserAgentInfo(session.userAgent || "Dispositivo desconhecido"),
				location: await getLocationFromIP(session.ipAddress || ""), // Obter localização do IP
				lastAccess: new Date(session.updatedAt || session.createdAt),
				// Comparar tanto por ID quanto por token para garantir identificação correta
				isCurrent: session.id === currentSessionId || session.token === currentSessionToken,
				ip: session.ipAddress || "IP não disponível",
				userAgent: session.userAgent,
				createdAt: new Date(session.createdAt),
				expiresAt: new Date(session.expiresAt),
			})),
		)

		return NextResponse.json(sessions)
	} catch (error: any) {
		console.error("Erro ao buscar sessões:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
export async function DELETE(request: NextRequest) {
	try {
		const { sessionId, terminateAll } = await request.json()

		// Obter sessão atual
		const sessionResult = await auth.api.getSession({
			headers: await headers(),
		})

		if (!sessionResult?.user) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 })
		}

		const userId = sessionResult.user.id
		const prisma = new (await import("@prisma/client")).PrismaClient()

		if (terminateAll) {
			// Revogar todas as outras sessões exceto a atual
			const currentSessionToken = request.cookies.get("better-auth.session_token")?.value
			const currentSessionIdFromAuth = sessionResult.session?.id

			// Buscar o ID da sessão atual para não deletá-la
			// Tenta primeiro pelo token, depois pelo ID do sessionResult
			let currentSession = await prisma.session.findFirst({
				where: {
					userId: userId,
					token: currentSessionToken,
				},
			})

			// Fallback: se não encontrou pelo token, usa o ID do sessionResult
			if (!currentSession && currentSessionIdFromAuth) {
				currentSession = await prisma.session.findFirst({
					where: {
						userId: userId,
						id: currentSessionIdFromAuth,
					},
				})
			}

			if (!currentSession) {
				// Em vez de erro, simplesmente deleta todas as sessões do usuário
				// Isso é seguro porque o usuário está autenticado e vai continuar com a sessão atual
				await prisma.session.deleteMany({
					where: { userId: userId },
				})
				await prisma.$disconnect()
				return NextResponse.json(
					{
						message: "Todas as sessões foram encerradas",
						warning: "Sessão atual não foi identificada no banco, todas as sessões foram removidas",
					},
					{ status: 200 },
				)
			}

			// Deletar todas as sessões EXCETO a atual
			await prisma.session.deleteMany({
				where: {
					userId: userId,
					NOT: {
						id: currentSession.id,
					},
				},
			})

			await prisma.$disconnect()

			return NextResponse.json({ message: "Todas as outras sessões foram encerradas" }, { status: 200 })
		} else if (sessionId) {
			// Revogar sessão específica
			const deletedSession = await prisma.session.deleteMany({
				where: {
					id: sessionId,
					userId: userId, // Garantir que só pode deletar suas próprias sessões
				},
			})

			await prisma.$disconnect()

			if (deletedSession.count === 0) {
				return NextResponse.json({ error: "Sessão não encontrada ou não autorizada" }, { status: 404 })
			}

			return NextResponse.json({ message: "Sessão encerrada com sucesso" }, { status: 200 })
		} else {
			return NextResponse.json({ error: "sessionId ou terminateAll é obrigatório" }, { status: 400 })
		}
	} catch (error: any) {
		console.error("Erro ao encerrar sessão:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
