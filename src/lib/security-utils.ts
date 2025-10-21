import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Constantes de segurança
export const SECURITY_CONSTANTS = {
	MAX_LOGIN_ATTEMPTS: 5,
	LOCKOUT_DURATION_MINUTES: 30,
	IP_CACHE_DURATION_DAYS: 30,
	MAX_SESSIONS_PER_USER: 10,
}

// Tipos de eventos de auditoria
export enum SecurityEventType {
	LOGIN_SUCCESS = "login_success",
	LOGIN_FAILED = "login_failed",
	PASSWORD_RESET = "password_reset",
	PASSWORD_CHANGED = "password_changed",
	TWO_FA_ENABLED = "2fa_enabled",
	TWO_FA_DISABLED = "2fa_disabled",
	ACCOUNT_LOCKED = "account_locked",
	ACCOUNT_UNLOCKED = "account_unlocked",
	SESSION_TERMINATED = "session_terminated",
	PASSKEY_ADDED = "passkey_added",
	PASSKEY_REMOVED = "passkey_removed",
	SUSPICIOUS_ACTIVITY = "suspicious_activity",
}

// Tipos de notificações
export enum NotificationType {
	NEW_DEVICE = "new_device",
	PASSWORD_CHANGED = "password_changed",
	TWO_FA_DISABLED = "2fa_disabled",
	SUSPICIOUS_LOGIN = "suspicious_login",
	ACCOUNT_LOCKED = "account_locked",
	ACCOUNT_UNLOCKED = "account_unlocked",
}

interface AuditLogParams {
	userId?: string
	eventType: SecurityEventType
	ipAddress?: string
	userAgent?: string
	location?: string
	metadata?: Record<string, any>
}

interface NotificationParams {
	userId: string
	type: NotificationType
	title: string
	message: string
	metadata?: Record<string, any>
}

/**
 * Registra um evento de auditoria de segurança
 */
export async function logSecurityEvent(params: AuditLogParams) {
	try {
		await prisma.securityAudit.create({
			data: {
				userId: params.userId,
				eventType: params.eventType,
				ipAddress: params.ipAddress,
				userAgent: params.userAgent,
				location: params.location,
				metadata: params.metadata || {},
			},
		})
	} catch (error) {
		console.error("Erro ao registrar evento de segurança:", error)
	}
}

/**
 * Cria uma notificação de segurança para o usuário
 */
export async function createSecurityNotification(params: NotificationParams) {
	try {
		await prisma.securityNotification.create({
			data: {
				userId: params.userId,
				type: params.type,
				title: params.title,
				message: params.message,
				metadata: params.metadata || {},
			},
		})
	} catch (error) {
		console.error("Erro ao criar notificação de segurança:", error)
	}
}

/**
 * Verifica se a conta está bloqueada
 */
export async function isAccountLocked(userId: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { lockedUntil: true },
	})

	if (!user?.lockedUntil) return false

	// Se ainda está bloqueado
	if (user.lockedUntil > new Date()) {
		return true
	}

	// Se o bloqueio expirou, limpar
	await unlockAccount(userId)
	return false
}

/**
 * Incrementa tentativas de login falhadas e bloqueia se necessário
 */
export async function handleFailedLogin(userId: string, ipAddress?: string, userAgent?: string, location?: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { failedLoginAttempts: true, email: true, name: true },
	})

	if (!user) return

	const newAttempts = user.failedLoginAttempts + 1

	// Log do evento
	await logSecurityEvent({
		userId,
		eventType: SecurityEventType.LOGIN_FAILED,
		ipAddress,
		userAgent,
		location,
		metadata: { attempts: newAttempts },
	})

	// Se atingiu o limite, bloquear conta
	if (newAttempts >= SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS) {
		const lockUntil = new Date()
		lockUntil.setMinutes(lockUntil.getMinutes() + SECURITY_CONSTANTS.LOCKOUT_DURATION_MINUTES)

		await prisma.user.update({
			where: { id: userId },
			data: {
				failedLoginAttempts: newAttempts,
				lockedUntil: lockUntil,
				lastFailedLogin: new Date(),
			},
		})

		// Log de bloqueio
		await logSecurityEvent({
			userId,
			eventType: SecurityEventType.ACCOUNT_LOCKED,
			ipAddress,
			userAgent,
			location,
			metadata: {
				reason: "max_failed_attempts",
				lockDurationMinutes: SECURITY_CONSTANTS.LOCKOUT_DURATION_MINUTES,
			},
		})

		// Notificar usuário
		await createSecurityNotification({
			userId,
			type: NotificationType.ACCOUNT_LOCKED,
			title: "Conta Bloqueada Temporariamente",
			message: `Sua conta foi bloqueada por ${SECURITY_CONSTANTS.LOCKOUT_DURATION_MINUTES} minutos devido a múltiplas tentativas de login falhadas.`,
			metadata: {
				lockUntil: lockUntil.toISOString(),
				attempts: newAttempts,
			},
		})
	} else {
		// Apenas incrementar tentativas
		await prisma.user.update({
			where: { id: userId },
			data: {
				failedLoginAttempts: newAttempts,
				lastFailedLogin: new Date(),
			},
		})
	}
}

/**
 * Reseta tentativas de login após sucesso
 */
export async function handleSuccessfulLogin(
	userId: string,
	ipAddress?: string,
	userAgent?: string,
	location?: string,
	loginMethod?: string,
) {
	// Resetar tentativas falhadas
	await prisma.user.update({
		where: { id: userId },
		data: {
			failedLoginAttempts: 0,
			lastFailedLogin: null,
		},
	})

	// Log do evento
	await logSecurityEvent({
		userId,
		eventType: SecurityEventType.LOGIN_SUCCESS,
		ipAddress,
		userAgent,
		location,
		metadata: { loginMethod },
	})

	// Verificar se é um novo dispositivo
	const existingSessions = await prisma.session.findFirst({
		where: {
			userId,
			userAgent,
			isRevoked: false,
		},
	})

	if (!existingSessions) {
		// Notificar sobre novo dispositivo
		await createSecurityNotification({
			userId,
			type: NotificationType.NEW_DEVICE,
			title: "Novo Dispositivo Detectado",
			message: `Um login foi realizado de um novo dispositivo. Local: ${location || "Desconhecido"}`,
			metadata: {
				ipAddress,
				userAgent,
				location,
				loginMethod,
			},
		})
	}
}

/**
 * Desbloqueia uma conta manualmente
 */
export async function unlockAccount(userId: string) {
	await prisma.user.update({
		where: { id: userId },
		data: {
			failedLoginAttempts: 0,
			lockedUntil: null,
			lastFailedLogin: null,
		},
	})

	await logSecurityEvent({
		userId,
		eventType: SecurityEventType.ACCOUNT_UNLOCKED,
		metadata: { reason: "manual_unlock" },
	})
}

/**
 * Limita o número de sessões ativas por usuário
 */
export async function enforceSessionLimit(userId: string) {
	const activeSessions = await prisma.session.findMany({
		where: {
			userId,
			expiresAt: { gt: new Date() },
			isRevoked: false,
		},
		orderBy: { createdAt: "asc" },
	})

	if (activeSessions.length >= SECURITY_CONSTANTS.MAX_SESSIONS_PER_USER) {
		// Deletar as sessões mais antigas
		const sessionsToDelete = activeSessions.slice(
			0,
			activeSessions.length - SECURITY_CONSTANTS.MAX_SESSIONS_PER_USER + 1,
		)

		for (const session of sessionsToDelete) {
			await prisma.session.update({
				where: { id: session.id },
				data: {
					isRevoked: true,
					revokedAt: new Date(),
					revokedReason: "session_limit_exceeded",
				},
			})
		}
	}
}

/**
 * Detecta atividade suspeita (login de país diferente, etc)
 */
export async function detectSuspiciousActivity(userId: string, currentLocation?: string): Promise<boolean> {
	if (!currentLocation) return false

	// Buscar últimos logins bem-sucedidos
	const recentLogins = await prisma.securityAudit.findMany({
		where: {
			userId,
			eventType: SecurityEventType.LOGIN_SUCCESS,
			createdAt: {
				gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
			},
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	})

	// Se não há histórico, não é suspeito
	if (recentLogins.length === 0) return false

	// Verificar se a localização atual é muito diferente das anteriores
	const previousLocations = recentLogins.map((log) => log.location).filter(Boolean)

	// Se todas as localizações anteriores eram diferentes da atual, é suspeito
	const isSuspicious =
		previousLocations.length > 0 && !previousLocations.some((loc) => loc?.includes(currentLocation.split(",")[0]))

	if (isSuspicious) {
		await logSecurityEvent({
			userId,
			eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
			location: currentLocation,
			metadata: {
				reason: "unusual_location",
				previousLocations,
			},
		})

		await createSecurityNotification({
			userId,
			type: NotificationType.SUSPICIOUS_LOGIN,
			title: "Atividade Suspeita Detectada",
			message: `Detectamos um login de uma localização incomum: ${currentLocation}. Se não foi você, altere sua senha imediatamente.`,
			metadata: { location: currentLocation },
		})
	}

	return isSuspicious
}
