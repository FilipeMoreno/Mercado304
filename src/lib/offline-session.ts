/**
 * Sistema de cache de sessão para funcionamento offline
 * Armazena informações essenciais da sessão localmente
 */

const SESSION_CACHE_KEY = "mercado304-session-cache"
const SESSION_CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 dias

export interface CachedSession {
	user: {
		id: string
		email: string
		name: string
		emailVerified: boolean
		image?: string
	}
	timestamp: number
	expiresAt: number
}

/**
 * Salvar sessão no cache local
 */
export function cacheSession(user: CachedSession["user"]): void {
	if (typeof window === "undefined") return

	const cachedSession: CachedSession = {
		user,
		timestamp: Date.now(),
		expiresAt: Date.now() + SESSION_CACHE_EXPIRY,
	}

	try {
		localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cachedSession))
		console.log("✅ Sessão armazenada em cache local")
	} catch (error) {
		console.error("❌ Erro ao salvar sessão em cache:", error)
	}
}

/**
 * Obter sessão do cache local
 */
export function getCachedSession(): CachedSession | null {
	if (typeof window === "undefined") return null

	try {
		const cached = localStorage.getItem(SESSION_CACHE_KEY)
		if (!cached) return null

		const session: CachedSession = JSON.parse(cached)

		// Verificar se expirou
		if (Date.now() > session.expiresAt) {
			console.warn("⚠️ Sessão em cache expirada")
			clearCachedSession()
			return null
		}

		return session
	} catch (error) {
		console.error("❌ Erro ao recuperar sessão do cache:", error)
		return null
	}
}

/**
 * Verificar se há sessão válida em cache
 */
export function hasCachedSession(): boolean {
	return getCachedSession() !== null
}

/**
 * Limpar cache de sessão
 */
export function clearCachedSession(): void {
	if (typeof window === "undefined") return

	try {
		localStorage.removeItem(SESSION_CACHE_KEY)
		console.log("✅ Cache de sessão limpo")
	} catch (error) {
		console.error("❌ Erro ao limpar cache de sessão:", error)
	}
}

/**
 * Atualizar campo específico da sessão em cache
 */
export function updateCachedSession(
	updates: Partial<CachedSession["user"]>
): void {
	const cached = getCachedSession()
	if (!cached) return

	const updatedSession: CachedSession = {
		...cached,
		user: {
			...cached.user,
			...updates,
		},
		timestamp: Date.now(),
	}

	try {
		localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(updatedSession))
		console.log("✅ Sessão em cache atualizada")
	} catch (error) {
		console.error("❌ Erro ao atualizar cache de sessão:", error)
	}
}

/**
 * Verificar se a sessão em cache ainda é válida (não expirou)
 */
export function isCachedSessionValid(): boolean {
	const cached = getCachedSession()
	if (!cached) return false

	const isValid = Date.now() < cached.expiresAt
	if (!isValid) {
		clearCachedSession()
	}

	return isValid
}
