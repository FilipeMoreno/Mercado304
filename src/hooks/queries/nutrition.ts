"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

export const useNutritionAnalysisQuery = () => {
	return useQuery({
		queryKey: queryKeys.nutrition.analysis(),
		queryFn: () => fetchWithErrorHandling("/api/nutrition/analysis"),
		staleTime: 5 * 60 * 1000,
	})
}

export const useNutritionSummaryQuery = (period = "30") => {
	return useQuery({
		queryKey: queryKeys.nutritionSummary(period),
		queryFn: () => fetchWithErrorHandling(`/api/nutrition/analysis?period=${period}`),
		staleTime: 5 * 60 * 1000,
	})
}

interface NutritionalInfo {
	calories?: number
	carbohydrates?: number
	proteins?: number
	totalFat?: number
	saturatedFat?: number
	transFat?: number
	fiber?: number
	sodium?: number
}

export const useAnalyzeNutritionalLabelMutation = () => {
	return useMutation({
		mutationFn: async ({ image, productId }: { image: string; productId: string }) => {
			return fetchWithErrorHandling("/api/ai/analyze-nutritional-label", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ image, productId }),
			})
		},
	})
}

export const useSaveNutritionalInfoMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ productId, data }: { productId: string; data: Partial<NutritionalInfo> }) => {
			return fetchWithErrorHandling(`/api/products/${productId}/nutritional-info`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ ...data, productId }),
			})
		},
		onSuccess: async (_, variables) => {
			await invalidateRefetchFamily(queryClient, queryKeys.product(variables.productId))
			toast.success("Informações nutricionais salvas com sucesso!")
		},
		onError: () => {
			toast.error("Erro ao salvar informações nutricionais")
		},
	})
}


