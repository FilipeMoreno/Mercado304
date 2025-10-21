import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

// Types
interface SecurityNotification {
	id: string
	type: string
	title: string
	message: string
	isRead: boolean
	metadata?: any
	createdAt: Date
}

interface NotificationsResponse {
	notifications: SecurityNotification[]
	unreadCount: number
}

// Query Keys
export const securityNotificationKeys = {
	all: ["security-notifications"] as const,
	list: () => [...securityNotificationKeys.all, "list"] as const,
}

// Fetch Functions
async function fetchNotifications(): Promise<NotificationsResponse> {
	const response = await fetch("/api/auth/security-notifications")
	if (!response.ok) {
		throw new Error("Erro ao buscar notificações")
	}
	const data = await response.json()
	return {
		notifications: data.notifications.map((n: any) => ({
			...n,
			createdAt: new Date(n.createdAt),
		})),
		unreadCount: data.unreadCount,
	}
}

// Hooks
export function useSecurityNotifications(enabled = true) {
	return useQuery({
		queryKey: securityNotificationKeys.list(),
		queryFn: fetchNotifications,
		enabled,
		staleTime: 30 * 1000, // 30 segundos
		refetchInterval: 60 * 1000, // Refetch a cada 1 minuto
	})
}

// Mutations
export function useMarkNotificationAsRead() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const response = await fetch("/api/auth/security-notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notificationId }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao marcar notificação como lida")
			}

			return notificationId
		},
		onSuccess: (notificationId) => {
			// Atualizar cache otimisticamente
			queryClient.setQueryData(securityNotificationKeys.list(), (old: NotificationsResponse | undefined) => {
				if (!old) return old
				return {
					notifications: old.notifications.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
					unreadCount: Math.max(0, old.unreadCount - 1),
				}
			})
		},
		onError: (error: Error) => {
			toast.error(error.message || "Erro ao marcar notificação como lida")
		},
	})
}

export function useMarkAllNotificationsAsRead() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/auth/security-notifications", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ markAllAsRead: true }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao marcar todas como lidas")
			}
		},
		onSuccess: () => {
			// Atualizar cache
			queryClient.setQueryData(securityNotificationKeys.list(), (old: NotificationsResponse | undefined) => {
				if (!old) return old
				return {
					notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
					unreadCount: 0,
				}
			})
			toast.success("Todas as notificações foram marcadas como lidas")
		},
		onError: (error: Error) => {
			toast.error(error.message || "Erro ao marcar todas como lidas")
		},
	})
}

export function useDeleteNotification() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (notificationId: string) => {
			const response = await fetch("/api/auth/security-notifications", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ notificationId }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao deletar notificação")
			}

			return notificationId
		},
		onSuccess: (notificationId) => {
			// Atualizar cache removendo a notificação
			queryClient.setQueryData(securityNotificationKeys.list(), (old: NotificationsResponse | undefined) => {
				if (!old) return old
				const notification = old.notifications.find((n) => n.id === notificationId)
				return {
					notifications: old.notifications.filter((n) => n.id !== notificationId),
					unreadCount: notification?.isRead ? old.unreadCount : Math.max(0, old.unreadCount - 1),
				}
			})
			toast.success("Notificação removida")
		},
		onError: (error: Error) => {
			toast.error(error.message || "Erro ao deletar notificação")
		},
	})
}

export function useDeleteAllReadNotifications() {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const response = await fetch("/api/auth/security-notifications", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ deleteAll: true }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao deletar notificações")
			}
		},
		onSuccess: () => {
			// Atualizar cache removendo todas as lidas
			queryClient.setQueryData(securityNotificationKeys.list(), (old: NotificationsResponse | undefined) => {
				if (!old) return old
				return {
					notifications: old.notifications.filter((n) => !n.isRead),
					unreadCount: old.unreadCount,
				}
			})
			toast.success("Todas as notificações lidas foram removidas")
		},
		onError: (error: Error) => {
			toast.error(error.message || "Erro ao deletar notificações")
		},
	})
}
