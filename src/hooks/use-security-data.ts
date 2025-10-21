import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { passkey, twoFactor } from "@/lib/auth-client"

// Types
interface LoginSession {
	id: string
	device: string
	location: string
	lastAccess: Date
	isCurrent: boolean
	ip: string
}

interface LoginHistory {
	id: string
	device: string
	location: string
	timestamp: Date
	success: boolean
	ip: string
	loginMethod: string
}

// Query Keys
export const securityKeys = {
	all: ["security"] as const,
	passkeys: () => [...securityKeys.all, "passkeys"] as const,
	sessions: () => [...securityKeys.all, "sessions"] as const,
	loginHistory: () => [...securityKeys.all, "login-history"] as const,
}

// Fetch Functions
async function fetchPasskeys() {
	const result = await passkey.listUserPasskeys()
	if (result.error) {
		throw new Error("Erro ao buscar passkeys")
	}
	return result.data || []
}

async function fetchSessions(): Promise<LoginSession[]> {
	const response = await fetch("/api/auth/sessions")
	if (!response.ok) {
		throw new Error("Erro ao buscar sessões")
	}
	const data = await response.json()
	return data.map((session: any) => ({
		...session,
		lastAccess: new Date(session.lastAccess),
	}))
}

async function fetchLoginHistory(): Promise<LoginHistory[]> {
	const response = await fetch("/api/auth/login-history")
	if (!response.ok) {
		throw new Error("Erro ao buscar histórico")
	}
	const data = await response.json()
	return data.map((entry: any) => ({
		...entry,
		timestamp: new Date(entry.timestamp),
	}))
}

// Hooks
export function usePasskeys() {
	return useQuery({
		queryKey: securityKeys.passkeys(),
		queryFn: fetchPasskeys,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)
	})
}

export function useSessions(enabled = false) {
	return useQuery({
		queryKey: securityKeys.sessions(),
		queryFn: fetchSessions,
		enabled,
		staleTime: 2 * 60 * 1000, // 2 minutos
		gcTime: 5 * 60 * 1000, // 5 minutos
		refetchInterval: 60 * 1000, // Refetch a cada 1 minuto quando ativo
	})
}

export function useLoginHistory(enabled = false) {
	return useQuery({
		queryKey: securityKeys.loginHistory(),
		queryFn: fetchLoginHistory,
		enabled,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	})
}

// Mutations
export function useDeletePasskey() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (passkeyId: string) => {
			const result = await passkey.deletePasskey({ id: passkeyId })
			if (result.error) {
				throw new Error("Erro ao excluir passkey")
			}

			// Registra evento de exclusão no histórico E envia email
			fetch("/api/auth/log-security-event", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					eventType: "passkey_removed",
					metadata: { passkeyId },
					sendEmail: true, // Flag para enviar email
				}),
			}).catch((err) => console.error("Failed to log passkey removal:", err))

			return passkeyId
		},
		onSuccess: (deletedId) => {
			// Atualizar cache otimisticamente
			queryClient.setQueryData(securityKeys.passkeys(), (old: any[] = []) => old.filter((p) => p.id !== deletedId))
			toast.success("Passkey excluído com sucesso")
		},
		onError: () => {
			toast.error("Erro ao excluir passkey")
		},
	})
}

export function useTerminateSession() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (sessionId: string) => {
			const response = await fetch("/api/auth/sessions", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ sessionId }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao encerrar sessão")
			}

			return sessionId
		},
		onSuccess: (sessionId) => {
			// Atualizar cache removendo a sessão
			queryClient.setQueryData(securityKeys.sessions(), (old: LoginSession[] = []) =>
				old.filter((s) => s.id !== sessionId),
			)
			toast.success("Sessão encerrada com sucesso")
		},
		onError: (error: Error) => {
			toast.error(error.message || "Erro ao encerrar sessão")
		},
	})
}

export function useTerminateAllSessions() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/auth/sessions", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ terminateAll: true }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao encerrar sessões")
			}
		},
		onSuccess: () => {
			// Atualizar cache mantendo apenas a sessão atual
			queryClient.setQueryData(securityKeys.sessions(), (old: LoginSession[] = []) => old.filter((s) => s.isCurrent))
			toast.success("Todas as outras sessões foram encerradas")
		},
		onError: (error: Error) => {
			toast.error(error.message || "Erro ao encerrar todas as sessões")
		},
	})
}

export function useDisableTwoFactor() {
	return useMutation({
		mutationFn: async (passwordOrToken: string) => {
			console.log("useDisableTwoFactor: received", {
				value: `${passwordOrToken?.substring(0, 20)}...`,
				isAuthToken: passwordOrToken?.startsWith("eyJ"),
			})

			const _passwordToUse = passwordOrToken
			const _tempPasswordCreated = false

			// Detecta se é um token de reautenticação (base64, começa com "eyJ")
			const isAuthToken = passwordOrToken?.startsWith("eyJ") || false

			// Se tem token de reautenticação, usa endpoint customizado para OAuth
			if (isAuthToken) {
				console.log("useDisableTwoFactor: using custom OAuth endpoint with reauth token")

				const response = await fetch("/api/auth/two-factor/disable-oauth", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ authToken: passwordOrToken }),
				})

				if (!response.ok) {
					const errorData = await response.json()
					console.error("useDisableTwoFactor: OAuth disable failed", errorData)
					throw new Error(errorData.error || "Erro ao desativar 2FA")
				}

				console.log("useDisableTwoFactor: SUCCESS via OAuth endpoint!")
				return { success: true }
			}

			// Para contas com senha, usa o método normal do Better Auth
			console.log("useDisableTwoFactor: using standard Better Auth method with password")
			const result = await twoFactor.disable({ password: passwordOrToken })

			if (result.error) {
				console.error("useDisableTwoFactor: Better Auth returned error:", result.error)
				throw new Error("Erro ao desativar 2FA. Verifique sua senha.")
			}

			console.log("useDisableTwoFactor: SUCCESS via Better Auth!")
			return result
		},
		onSuccess: () => {
			toast.success("2FA via aplicativo desativado com sucesso")
		},
		onError: (error: Error) => {
			toast.error(error.message)
		},
	})
}

export function useGenerateBackupCodes() {
	return useMutation({
		mutationFn: async (passwordOrToken: string) => {
			// Detecta se é um token de reautenticação (base64, começa com "eyJ")
			const isAuthToken = passwordOrToken?.startsWith("eyJ") || false

			// Se tem token de reautenticação, usa endpoint customizado para OAuth
			if (isAuthToken) {
				console.log("useGenerateBackupCodes: using custom OAuth endpoint with reauth token")

				const response = await fetch("/api/auth/two-factor/backup-codes-oauth", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ authToken: passwordOrToken }),
				})

				if (!response.ok) {
					const errorData = await response.json()
					console.error("useGenerateBackupCodes: OAuth generation failed", errorData)
					throw new Error(errorData.error || "Erro ao gerar códigos de backup")
				}

				const { backupCodes } = await response.json()
				console.log("useGenerateBackupCodes: SUCCESS via OAuth endpoint!")
				return backupCodes
			}

			// Para contas com senha, usa o método normal do Better Auth
			console.log("useGenerateBackupCodes: using standard Better Auth method with password")
			const result = await twoFactor.generateBackupCodes({ password: passwordOrToken })

			if (result.error) {
				console.error("useGenerateBackupCodes: Better Auth returned error:", result.error)
				throw new Error("Erro ao gerar códigos de backup. Verifique sua senha.")
			}

			console.log("useGenerateBackupCodes: SUCCESS via Better Auth!")
			return result.data?.backupCodes || []
		},
		onSuccess: () => {
			toast.success("Novos códigos de backup gerados!")
		},
		onError: (error: Error) => {
			toast.error(error.message)
		},
	})
}
