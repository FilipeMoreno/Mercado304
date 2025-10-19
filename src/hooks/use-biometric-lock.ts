"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSession } from "@/lib/auth-client"

interface BiometricLockConfig {
	enabled: boolean
	lockOnClose: boolean
	inactivityTimeout: number // em minutos, 0 = desabilitado
}

interface BiometricLockState {
	isLocked: boolean
	shouldShowLock: boolean
	config: BiometricLockConfig
	hasCredential: boolean
	lastActivity: number
}

const STORAGE_KEY = "mercado304-biometric-lock"
const CONFIG_KEY = "mercado304-biometric-config"
const LAST_ACTIVITY_KEY = "mercado304-last-activity"
const HAS_CREDENTIAL_KEY = "mercado304-has-biometric-credential"

const DEFAULT_CONFIG: BiometricLockConfig = {
	enabled: false,
	lockOnClose: true,
	inactivityTimeout: 5, // 5 minutos por padrão
}

export function useBiometricLock() {
	const { data: session } = useSession()
	const [state, setState] = useState<BiometricLockState>({
		isLocked: false,
		shouldShowLock: false,
		config: DEFAULT_CONFIG,
		hasCredential: false,
		lastActivity: Date.now(),
	})

	const activityTimerRef = useRef<NodeJS.Timeout>()
	const visibilityListenerRef = useRef<(() => void) | null>(null)

	// Carrega configuração do localStorage
	const loadConfig = useCallback((): BiometricLockConfig => {
		if (typeof window === "undefined") return DEFAULT_CONFIG

		try {
			const stored = localStorage.getItem(CONFIG_KEY)
			if (stored) {
				return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
			}
		} catch (error) {
			console.error("Erro ao carregar configuração de bloqueio:", error)
		}

		return DEFAULT_CONFIG
	}, [])

	// Salva configuração no localStorage
	const saveConfig = useCallback((config: BiometricLockConfig) => {
		if (typeof window === "undefined") return

		try {
			localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
		} catch (error) {
			console.error("Erro ao salvar configuração de bloqueio:", error)
		}
	}, [])

	// Verifica se tem credencial biométrica registrada
	const checkCredential = useCallback(async (): Promise<boolean> => {
		if (typeof window === "undefined") return false

		try {
			// Verifica no localStorage primeiro (cache)
			const cached = localStorage.getItem(HAS_CREDENTIAL_KEY)
			if (cached !== null) {
				return cached === "true"
			}

			// Verifica se WebAuthn está disponível
			if (!window.PublicKeyCredential) {
				return false
			}

			// Verifica se tem credenciais disponíveis
			const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
			localStorage.setItem(HAS_CREDENTIAL_KEY, available.toString())
			return available
		} catch (error) {
			console.error("Erro ao verificar credencial biométrica:", error)
			return false
		}
	}, [])

	// Atualiza última atividade
	const updateActivity = useCallback(() => {
		const now = Date.now()
		localStorage.setItem(LAST_ACTIVITY_KEY, now.toString())
		setState((prev) => ({ ...prev, lastActivity: now }))
	}, [])

	// Verifica se deve bloquear por inatividade
	const checkInactivity = useCallback(() => {
		if (typeof window === "undefined") return false

		const config = loadConfig()
		if (!config.enabled || config.inactivityTimeout === 0) return false

		const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
		if (!lastActivity) return false

		const now = Date.now()
		const inactiveTime = now - parseInt(lastActivity, 10)
		const timeoutMs = config.inactivityTimeout * 60 * 1000

		return inactiveTime >= timeoutMs
	}, [loadConfig])

	// Bloqueia o app
	const lock = useCallback(() => {
		if (typeof window === "undefined") return

		localStorage.setItem(STORAGE_KEY, "true")
		setState((prev) => ({ ...prev, isLocked: true, shouldShowLock: true }))
	}, [])

	// Desbloqueia o app
	const unlock = useCallback(() => {
		if (typeof window === "undefined") return

		localStorage.removeItem(STORAGE_KEY)
		updateActivity()
		setState((prev) => ({ ...prev, isLocked: false, shouldShowLock: false }))
	}, [updateActivity])

	// Atualiza configuração
	const updateConfig = useCallback(
		(newConfig: Partial<BiometricLockConfig>) => {
			const updated = { ...state.config, ...newConfig }
			saveConfig(updated)
			setState((prev) => ({ ...prev, config: updated }))
		},
		[state.config, saveConfig],
	)

	// Marca que tem credencial biométrica
	const setHasCredential = useCallback((value: boolean) => {
		if (typeof window === "undefined") return
		localStorage.setItem(HAS_CREDENTIAL_KEY, value.toString())
		setState((prev) => ({ ...prev, hasCredential: value }))
	}, [])

	// Inicializa o hook
	useEffect(() => {
		if (typeof window === "undefined" || !session?.user) return

		const init = async () => {
			const config = loadConfig()
			const hasCredential = await checkCredential()
			const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY)
			const wasLocked = localStorage.getItem(STORAGE_KEY) === "true"

			// Determina se deve mostrar bloqueio
			const shouldLock =
				config.enabled && hasCredential && (wasLocked || (config.lockOnClose && lastActivity) || checkInactivity())

			setState({
				isLocked: shouldLock,
				shouldShowLock: shouldLock,
				config,
				hasCredential,
				lastActivity: lastActivity ? parseInt(lastActivity, 10) : Date.now(),
			})

			if (shouldLock) {
				localStorage.setItem(STORAGE_KEY, "true")
			} else {
				updateActivity()
			}
		}

		init()
	}, [session?.user, loadConfig, checkCredential, checkInactivity, updateActivity])

	// Monitora atividade do usuário
	useEffect(() => {
		if (typeof window === "undefined" || !session?.user || !state.config.enabled) return

		const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]

		const handleActivity = () => {
			if (!state.isLocked) {
				updateActivity()
			}
		}

		events.forEach((event) => {
			document.addEventListener(event, handleActivity, { passive: true })
		})

		return () => {
			events.forEach((event) => {
				document.removeEventListener(event, handleActivity)
			})
		}
	}, [session?.user, state.config.enabled, state.isLocked, updateActivity])

	// Timer para verificar inatividade
	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!session?.user ||
			!state.config.enabled ||
			state.config.inactivityTimeout === 0 ||
			state.isLocked
		) {
			return
		}

		// Verifica a cada 30 segundos
		activityTimerRef.current = setInterval(() => {
			if (checkInactivity()) {
				lock()
			}
		}, 30000)

		return () => {
			if (activityTimerRef.current) {
				clearInterval(activityTimerRef.current)
			}
		}
	}, [session?.user, state.config, state.isLocked, checkInactivity, lock])

	// Monitora quando o app é fechado/minimizado
	useEffect(() => {
		if (typeof window === "undefined" || !session?.user || !state.config.enabled || !state.config.lockOnClose) {
			return
		}

		const handleVisibilityChange = () => {
			if (document.hidden) {
				// App foi minimizado/fechado
				updateActivity()
			} else {
				// App foi aberto novamente
				if (checkInactivity()) {
					lock()
				}
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange)
		visibilityListenerRef.current = () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange)
		}

		return () => {
			visibilityListenerRef.current?.()
		}
	}, [session?.user, state.config, checkInactivity, lock, updateActivity])

	// Limpa estado quando faz logout
	useEffect(() => {
		if (!session?.user) {
			setState({
				isLocked: false,
				shouldShowLock: false,
				config: DEFAULT_CONFIG,
				hasCredential: false,
				lastActivity: Date.now(),
			})
		}
	}, [session?.user])

	return {
		isLocked: state.isLocked,
		shouldShowLock: state.shouldShowLock,
		config: state.config,
		hasCredential: state.hasCredential,
		lock,
		unlock,
		updateConfig,
		setHasCredential,
	}
}

// Hook auxiliar para verificar se biometria está disponível
export function useBiometricAvailable() {
	const [available, setAvailable] = useState(false)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		const check = async () => {
			if (typeof window === "undefined") {
				setLoading(false)
				return
			}

			try {
				if (!window.PublicKeyCredential) {
					setAvailable(false)
					setLoading(false)
					return
				}

				const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
				setAvailable(isAvailable)
			} catch (error) {
				console.error("Erro ao verificar disponibilidade de biometria:", error)
				setAvailable(false)
			} finally {
				setLoading(false)
			}
		}

		check()
	}, [])

	return { available, loading }
}
