"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: any) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/purchases", data, "purchase")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/purchases", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Compra salva offline", { description: "Será registrada quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: any }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/purchases/${id}`, data, "purchase", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/purchases/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Compra atualizada offline", { description: "Será sincronizada quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/purchases/${id}`, {}, "purchase", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/purchases/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Compra excluída offline", { description: "Será sincronizada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["purchases"])
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Compra excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir compra: ${error.message}`)
		},
	})
}


