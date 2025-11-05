"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Budget } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

// Deprecated in favor of Quotes, mantido por compatibilidade
export const useBudgetsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.budgets(params),
		queryFn: () => fetchWithErrorHandling(`/api/budgets?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000,
	})
}

export const useBudgetQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.budget(id),
		queryFn: () => fetchWithErrorHandling(`/api/budgets/${id}`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useBudgetComparisonQuery = (budgetIds: string[]) => {
	return useQuery({
		queryKey: queryKeys.budgetComparison(budgetIds),
		queryFn: () =>
			fetchWithErrorHandling("/api/budgets/compare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ budgetIds }),
			}),
		staleTime: 1 * 60 * 1000,
		enabled: budgetIds.length >= 2,
	})
}

export const useCreateBudgetMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: Partial<Budget>) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/budgets", data, "budget")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/budgets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Orçamento salvo offline", { description: "Será criado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["budgets"])
			toast.success("Orçamento criado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar orçamento: ${error.message}`)
		},
	})
}

export const useUpdateBudgetMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<Budget> }) => {
			if (!isOnline) {
				await addToQueue("PATCH", `/api/budgets/${id}`, data, "budget", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/budgets/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Orçamento atualizado offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["budgets"])
			queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) })
			toast.success("Orçamento atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar orçamento: ${error.message}`)
		},
	})
}

export const useDeleteBudgetMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/budgets/${id}`, {}, "budget", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/budgets/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Orçamento excluído offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["budgets"])
			toast.success("Orçamento excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir orçamento: ${error.message}`)
		},
	})
}

export const useConvertBudgetToPurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, paymentMethod, purchaseDate }: { id: string; paymentMethod?: string; purchaseDate?: string }) =>
			fetchWithErrorHandling(`/api/budgets/${id}/convert`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentMethod, purchaseDate }),
			}),
		onSuccess: async (_, { id }) => {
			await invalidateRefetchFamily(queryClient, ["budgets"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) })
			await invalidateRefetchFamily(queryClient, ["purchases"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: queryKeys.budgetStats() })
			toast.success("Orçamento convertido em compra com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao converter orçamento: ${error.message}`)
		},
	})
}

export const useBudgetStatsQuery = () => {
	return useQuery({
		queryKey: queryKeys.budgetStats(),
		queryFn: () => fetchWithErrorHandling("/api/budgets/stats"),
		staleTime: 2 * 60 * 1000,
	})
}


