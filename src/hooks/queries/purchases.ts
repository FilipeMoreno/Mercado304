"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

export const usePurchasesQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.purchases(params),
		queryFn: () => fetchWithErrorHandling(`/api/purchases?${params?.toString() || ""}`),
		staleTime: 0,
	})
}

export const usePurchaseQuery = (id: string, options?: { enabled: boolean }) => {
	return useQuery({
		queryKey: queryKeys.purchase(id),
		queryFn: () => fetchWithErrorHandling(`/api/purchases/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: options?.enabled ?? !!id,
	})
}

export const useCreatePurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/purchases", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["purchases"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			toast.success("Compra registrada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao registrar compra: ${error.message}`)
		},
	})
}

export const useUpdatePurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/purchases/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
			await invalidateRefetchFamily(queryClient, ["purchases"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.purchase(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Compra atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar compra: ${error.message}`)
		},
	})
}

export const useDeletePurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/purchases/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["purchases"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Compra excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir compra: ${error.message}`)
		},
	})
}


