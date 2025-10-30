"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Budget } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

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
	return useMutation({
		mutationFn: (data: Partial<Budget>) =>
			fetchWithErrorHandling("/api/budgets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
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
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Budget> }) =>
			fetchWithErrorHandling(`/api/budgets/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
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
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/budgets/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
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


