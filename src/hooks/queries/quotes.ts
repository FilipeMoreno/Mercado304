"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

export const useQuotesQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.quotes(params),
		queryFn: () => fetchWithErrorHandling(`/api/quotes?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000,
	})
}

export const useQuoteQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.quote(id),
		queryFn: () => fetchWithErrorHandling(`/api/quotes/${id}`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useQuoteComparisonQuery = (quoteIds: string[]) => {
	return useQuery({
		queryKey: queryKeys.quoteComparison(quoteIds),
		queryFn: () =>
			fetchWithErrorHandling("/api/quotes/compare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quoteIds }),
			}),
		staleTime: 1 * 60 * 1000,
		enabled: quoteIds.length >= 2,
	})
}

export const useQuoteStatsQuery = () => {
	return useQuery({
		queryKey: queryKeys.quoteStats(),
		queryFn: () => fetchWithErrorHandling("/api/quotes/stats"),
		staleTime: 2 * 60 * 1000,
	})
}

export const useUpdateQuoteMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<any> }) => {
			if (!isOnline) {
				await addToQueue("PATCH", `/api/quotes/${id}`, data, "quote", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/quotes/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Cotação atualizada offline", { description: "Será sincronizada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["quotes"])
			queryClient.invalidateQueries({ queryKey: queryKeys.quote(id) })
			toast.success("Cotação atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar cotação: ${error.message}`)
		},
	})
}

export const useDeleteQuoteMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/quotes/${id}`, {}, "quote", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/quotes/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Cotação excluída offline", { description: "Será sincronizada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["quotes"])
			toast.success("Cotação excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir cotação: ${error.message}`)
		},
	})
}

export const useConvertQuoteToPurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, paymentMethod, purchaseDate }: { id: string; paymentMethod?: string; purchaseDate?: string }) =>
			fetchWithErrorHandling(`/api/quotes/${id}/convert`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentMethod, purchaseDate }),
			}),
		onSuccess: async (_, { id }) => {
			await invalidateRefetchFamily(queryClient, ["quotes"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.quote(id) })
			await invalidateRefetchFamily(queryClient, ["purchases"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: queryKeys.quoteStats() })
			toast.success("Cotação convertida em compra com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao converter cotação: ${error.message}`)
		},
	})
}


