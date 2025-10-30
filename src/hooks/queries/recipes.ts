"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

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
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
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
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/recipes/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["recipes"]) 
			toast.success("Receita excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir receita: ${error.message}`)
		},
	})
}


