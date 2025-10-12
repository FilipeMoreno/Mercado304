import { type NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { isAccountLocked, handleFailedLogin, handleSuccessfulLogin, enforceSessionLimit } from "./security-utils"
import { getLocationFromIP } from "./geolocation"

const prisma = new PrismaClient()

/**
 * Middleware para interceptar tentativas de login e aplicar bloqueio automático
 */
export async function authSecurityMiddleware(request: NextRequest, response: NextResponse) {
	const url = request.nextUrl.pathname
	const method = request.method

	// Interceptar tentativas de sign-in
	if (url.includes("/api/auth/sign-in") && method === "POST") {
		try {
			const body = await request.clone().json()
			const email = body.email

			if (email) {
				// Buscar usuário por email
				const user = await prisma.user.findUnique({
					where: { email },
					select: { id: true, lockedUntil: true },
				})

				if (user) {
					// Verificar se conta está bloqueada
					const locked = await isAccountLocked(user.id)

					if (locked) {
						return NextResponse.json(
							{
								error: "Conta temporariamente bloqueada devido a múltiplas tentativas de login falhadas. Tente novamente mais tarde.",
								lockedUntil: user.lockedUntil,
							},
							{ status: 429 }
						)
					}
				}
			}
		} catch (error) {
			console.error("Erro no middleware de segurança:", error)
		}
	}

	return response
}

/**
 * Hook para ser chamado após tentativa de login (sucesso ou falha)
 */
export async function handleLoginAttempt(
	email: string,
	success: boolean,
	request: NextRequest,
	loginMethod?: string
) {
	try {
		const user = await prisma.user.findUnique({
			where: { email },
			select: { id: true },
		})

		if (!user) return

		// Obter informações da requisição
		const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "IP não disponível"
		const userAgent = request.headers.get("user-agent") || "User-Agent não disponível"
		const location = await getLocationFromIP(ipAddress)

		if (success) {
			// Login bem-sucedido
			await handleSuccessfulLogin(user.id, ipAddress, userAgent, location, loginMethod)
			
			// Aplicar limite de sessões
			await enforceSessionLimit(user.id)
		} else {
			// Login falhado
			await handleFailedLogin(user.id, ipAddress, userAgent, location)
		}
	} catch (error) {
		console.error("Erro ao processar tentativa de login:", error)
	}
}

/**
 * Extrai IP real do request considerando proxies
 */
export function getRealIP(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for")
	if (forwarded) {
		return forwarded.split(",")[0].trim()
	}

	const realIp = request.headers.get("x-real-ip")
	if (realIp) {
		return realIp
	}

	return "IP não disponível"
}

/**
 * Extrai informações do dispositivo do User-Agent
 */
export function getDeviceInfo(userAgent: string) {
	if (!userAgent || userAgent === "User-Agent não disponível") {
		return {
			browser: "Desconhecido",
			os: "Desconhecido",
			device: "Desconhecido",
			displayName: "Dispositivo Desconhecido",
		}
	}

	// Detectar navegador
	let browser = "Navegador desconhecido"
	if (userAgent.includes("Edg")) browser = "Edge"
	else if (userAgent.includes("Chrome")) browser = "Chrome"
	else if (userAgent.includes("Firefox")) browser = "Firefox"
	else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari"
	else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera"

	// Detectar sistema operacional
	let os = "OS desconhecido"
	if (userAgent.includes("Windows NT 10.0")) os = "Windows 10/11"
	else if (userAgent.includes("Windows NT 6.3")) os = "Windows 8.1"
	else if (userAgent.includes("Windows NT 6.2")) os = "Windows 8"
	else if (userAgent.includes("Windows NT 6.1")) os = "Windows 7"
	else if (userAgent.includes("Windows")) os = "Windows"
	else if (userAgent.includes("Mac OS X")) {
		const match = userAgent.match(/Mac OS X ([\d_]+)/)
		os = match ? `macOS ${match[1].replace(/_/g, ".")}` : "macOS"
	} else if (userAgent.includes("Linux")) os = "Linux"
	else if (userAgent.includes("Android")) {
		const match = userAgent.match(/Android ([\d.]+)/)
		os = match ? `Android ${match[1]}` : "Android"
	} else if (userAgent.includes("iOS") || userAgent.includes("iPhone") || userAgent.includes("iPad")) {
		const match = userAgent.match(/OS ([\d_]+)/)
		os = match ? `iOS ${match[1].replace(/_/g, ".")}` : "iOS"
	}

	// Detectar tipo de dispositivo
	let device = "Desktop"
	if (userAgent.includes("Mobile") || userAgent.includes("Android")) device = "Mobile"
	else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) device = "Tablet"

	return {
		browser,
		os,
		device,
		displayName: `${browser} em ${os} (${device})`,
	}
}
