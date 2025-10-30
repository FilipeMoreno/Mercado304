"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

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
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
			fetchWithErrorHandling(`/api/quotes/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
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
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/quotes/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
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


