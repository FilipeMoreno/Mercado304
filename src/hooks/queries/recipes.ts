"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

export const useRecipesQuery = () => {
	return useQuery({
		queryKey: queryKeys.recipes(),
		queryFn: () => fetchWithErrorHandling("/api/recipes"),
		staleTime: 5 * 60 * 1000,
	})
}

export const useRecipeQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.recipe(id),
		queryFn: () => fetchWithErrorHandling(`/api/recipes/${id}`),
		staleTime: 5 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateRecipeMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: any) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/recipes", data, "recipe")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Receita salva offline", { description: "Será criada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["recipes"])
			toast.success("Receita salva com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao salvar receita: ${error.message}`)
		},
	})
}

export const useDeleteRecipeMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/recipes/${id}`, {}, "recipe", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/recipes/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Receita excluída offline", { description: "Será sincronizada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["recipes"])
			toast.success("Receita excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir receita: ${error.message}`)
		},
	})
}


