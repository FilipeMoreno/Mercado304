import { headers } from "next/headers"
import { logSecurityEvent, SecurityEventType } from "./security-utils"

/**
 * Registra um evento de autenticação no histórico
 */
export async function logAuthEvent(params: {
	userId: string
	eventType: "login" | "reauth" | "logout"
	method: "google" | "passkey" | "email" | "one-tap" | "reauth-google"
	ipAddress?: string
	userAgent?: string
	location?: string
	metadata?: Record<string, any>
}) {
	const { userId, eventType, method, ipAddress, userAgent, location, metadata } = params

	console.log(`[AuthLogger] Logging ${eventType} event for user ${userId} via ${method}`)

	try {
		// Determina o tipo de evento de segurança
		let securityEventType: SecurityEventType

		if (eventType === "login" || eventType === "reauth") {
			securityEventType = SecurityEventType.LOGIN_SUCCESS
		} else {
			securityEventType = SecurityEventType.LOGIN_SUCCESS // Usar LOGIN_SUCCESS para outros eventos também
		}

		// Registra no SecurityAudit
		await logSecurityEvent({
			userId,
			eventType: securityEventType,
			ipAddress: ipAddress || "Unknown",
			userAgent: userAgent || "Unknown",
			location: location || "Unknown",
			metadata: {
				loginMethod: method,
				authType: eventType,
				...metadata,
			},
		})

		console.log(`[AuthLogger] Successfully logged ${eventType} event`)
	} catch (error) {
		console.error(`[AuthLogger] Error logging auth event:`, error)
	}
}

/**
 * Extrai informações de IP e UserAgent dos headers
 */
export async function getRequestInfo() {
	const headersList = await headers()

	const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || "Unknown"

	const userAgent = headersList.get("user-agent") || "Unknown"

	return { ipAddress, userAgent }
}
