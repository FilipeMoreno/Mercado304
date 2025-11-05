"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Market } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: Omit<Market, "id" | "createdAt" | "updatedAt">) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/markets", data, "market")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/markets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (newMarket: Market | { success: boolean; queued: boolean }) => {
			if ('queued' in newMarket && newMarket.queued) {
				toast.info("Mercado salvo offline", { description: "Será criado quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<Market> }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/markets/${id}`, data, "market", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/markets/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result, variables) => {
			if ('queued' in result && result.queued) {
				toast.info("Mercado atualizado offline", { description: "Será sincronizado quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/markets/${id}`, {}, "market", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/markets/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result) => {
			if (result?.queued) {
				toast.info("Mercado excluído offline", { description: "Será sincronizado quando voltar online" })
				return
			}
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


