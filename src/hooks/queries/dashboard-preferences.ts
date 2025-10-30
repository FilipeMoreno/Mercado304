"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

export interface DashboardPreferences {
	cardOrder: string[]
	hiddenCards: string[]
	layoutStyle: "grid" | "list" | "compact"
	cardsPerRow: number
	showSummaryCard: boolean
	showMonthlyChart: boolean
	showCategoryStats: boolean
	showTopProducts: boolean
	showMarketCompare: boolean
	showRecentBuys: boolean
	showExpirationAlerts: boolean
	showReplenishment: boolean
	showSavingsCard: boolean
	showDiscountStats: boolean
	showTemporalComp: boolean
	showNutritionCard: boolean
	showPaymentStats: boolean
	showMonthlyStats: boolean
	customTitle?: string
	customSubtitle?: string
}

export const useDashboardPreferencesQuery = () => {
	return useQuery({
		queryKey: queryKeys.dashboard.preferences(),
		queryFn: () => fetchWithErrorHandling("/api/dashboard/preferences"),
		staleTime: 10 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
	})
}

export const useUpdateDashboardPreferencesMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Partial<DashboardPreferences>) =>
			fetchWithErrorHandling("/api/dashboard/preferences", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, queryKeys.dashboard.preferences())
			toast.success("Preferências salvas com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao salvar preferências: ${error.message}`)
		},
	})
}

export const useCreateDashboardPreferencesMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Partial<DashboardPreferences>) =>
			fetchWithErrorHandling("/api/dashboard/preferences", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, queryKeys.dashboard.preferences())
			toast.success("Preferências criadas com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar preferências: ${error.message}`)
		},
	})
}

export const useResetDashboardPreferencesMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () =>
			fetchWithErrorHandling("/api/dashboard/preferences", {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, queryKeys.dashboard.preferences())
			toast.success("Preferências resetadas para o padrão!")
		},
		onError: (error) => {
			toast.error(`Erro ao resetar preferências: ${error.message}`)
		},
	})
}


