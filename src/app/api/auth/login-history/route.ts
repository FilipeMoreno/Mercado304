import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Função para obter localização do IP
async function getLocationFromIP(ip: string): Promise<string> {
	if (!ip || ip === "IP não disponível") {
		return "Localização não disponível"
	}

	try {
		const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`, {
			next: { revalidate: 3600 },
		})

		if (!response.ok) return "Localização não disponível"

		const data = await response.json()

		if (data.status === "success") {
			const parts = []
			if (data.city) parts.push(data.city)
			if (data.regionName) parts.push(data.regionName)
			if (data.country) parts.push(data.country)
			return parts.join(", ") || "Localização não disponível"
		}

		return "Localização não disponível"
	} catch (error) {
		return "Localização não disponível"
	}
}

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

		// Buscar informações do usuário para obter o método de login
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { lastLoginMethod: true },
		})

		// Transformar dados para o formato esperado
		const loginHistory = await Promise.all(
			sessionHistory.map(async (session: any) => {
				const isSuccess = new Date(session.expiresAt) > new Date() // Se não expirou, foi sucesso

				return {
					id: session.id,
					device: session.userAgent || "Dispositivo desconhecido",
					location: await getLocationFromIP(session.ipAddress || ""),
					timestamp: new Date(session.createdAt),
					success: isSuccess,
					ip: session.ipAddress || "IP não disponível",
					userAgent: session.userAgent,
					loginMethod: user?.lastLoginMethod || "Não disponível",
					sessionDuration: session.expiresAt
						? Math.floor(
								(new Date(session.expiresAt).getTime() - new Date(session.createdAt).getTime()) / (1000 * 60 * 60 * 24),
						  ) + " dias"
						: "Indefinido",
				}
			})
		)

		return NextResponse.json(loginHistory)
	} catch (error: any) {
		console.error("Erro ao buscar histórico de login:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
