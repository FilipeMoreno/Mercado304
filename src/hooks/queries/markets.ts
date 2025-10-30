"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Market } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

export const useMarketsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.markets(params),
		queryFn: () => fetchWithErrorHandling(`/api/markets?${params?.toString() || ""}`),
		staleTime: 0,
	})
}

export const useMarketQuery = (id: string) => {
	return useQuery({
		queryKey: ["markets", id],
		queryFn: () => fetchWithErrorHandling(`/api/markets/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateMarketMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Omit<Market, "id" | "createdAt" | "updatedAt">) =>
			fetchWithErrorHandling("/api/markets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (newMarket: Market) => {
			await invalidateRefetchFamily(queryClient, ["markets"]) 
			toast.success("Mercado criado com sucesso!")
			return newMarket
		},
		onError: (error) => {
			toast.error(`Erro ao criar mercado: ${error.message}`)
		},
	})
}

export const useUpdateMarketMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Market> }) =>
			fetchWithErrorHandling(`/api/markets/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["market", variables.id] })
			await invalidateRefetchFamily(queryClient, ["markets"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Mercado atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar mercado: ${error.message}`)
		},
	})
}

export const useDeleteMarketMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/markets/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["markets"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Mercado excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir mercado: ${error.message}`)
		},
	})
}

export const useMarketStatsQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.marketStats(id),
		queryFn: () => fetchWithErrorHandling(`/api/markets/${id}/stats`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}


