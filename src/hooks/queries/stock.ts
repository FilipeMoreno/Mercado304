"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

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
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/stock", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
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
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/stock/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
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
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/stock/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
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


