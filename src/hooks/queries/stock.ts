"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

export const useStockQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.stock(params),
		queryFn: () => fetchWithErrorHandling(`/api/stock?${params?.toString() || ""}`),
		staleTime: 1 * 60 * 1000,
	})
}

export const useStockItemQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.stockItem(id),
		queryFn: () => fetchWithErrorHandling(`/api/stock/${id}`),
		staleTime: 1 * 60 * 1000,
		enabled: !!id,
	})
}

export const useStockHistoryQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.stockHistory(params),
		queryFn: () => fetchWithErrorHandling(`/api/stock/history?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000,
	})
}

export const useCreateStockMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: any) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/stock", data, "stock")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/stock", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Item salvo offline", { description: "Será adicionado ao estoque quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["stock"])
			await invalidateRefetchFamily(queryClient, ["stock-history"])
			queryClient.invalidateQueries({ queryKey: queryKeys.expiration.alerts() })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Item adicionado ao estoque!")
		},
		onError: (error) => {
			toast.error(`Erro ao adicionar item ao estoque: ${error.message}`)
		},
	})
}

export const useUpdateStockMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: any }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/stock/${id}`, data, "stock", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/stock/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Estoque atualizado offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["stock"])
			queryClient.invalidateQueries({ queryKey: queryKeys.stockItem(id) })
			await invalidateRefetchFamily(queryClient, ["stock-history"])
			queryClient.invalidateQueries({ queryKey: queryKeys.expiration.alerts() })
			toast.success("Estoque atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar estoque: ${error.message}`)
		},
	})
}

export const useDeleteStockMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/stock/${id}`, {}, "stock", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/stock/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Item removido offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["stock"])
			await invalidateRefetchFamily(queryClient, ["stock-history"])
			queryClient.invalidateQueries({ queryKey: queryKeys.expiration.alerts() })
			toast.success("Item removido do estoque!")
		},
		onError: (error) => {
			toast.error(`Erro ao remover item do estoque: ${error.message}`)
		},
	})
}

export const useResetStockMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () =>
			fetchWithErrorHandling("/api/stock/reset", {
				method: "DELETE",
			}),
		onSuccess: async (data: { message: string; deletedCount: number }) => {
			await invalidateRefetchFamily(queryClient, ["stock"]) 
			await invalidateRefetchFamily(queryClient, ["stock-history"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.expiration.alerts() })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success(data.message || "Estoque resetado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao resetar estoque: ${error.message}`)
		},
	})
}


