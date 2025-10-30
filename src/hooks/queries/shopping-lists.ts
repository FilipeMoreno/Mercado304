"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { ShoppingList } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

export const useShoppingListsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.shoppingLists(params),
		queryFn: () => fetchWithErrorHandling(`/api/shopping-lists?${params?.toString() || ""}`),
		staleTime: 0,
	})
}

export const useShoppingListQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.shoppingList(id),
		queryFn: () => fetchWithErrorHandling(`/api/shopping-lists/${id}`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Partial<ShoppingList>) =>
			fetchWithErrorHandling("/api/shopping-lists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["shopping-lists"]) 
			toast.success("Lista criada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar lista: ${error.message}`)
		},
	})
}

export const useUpdateShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<ShoppingList> }) =>
			fetchWithErrorHandling(`/api/shopping-lists/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
			await invalidateRefetchFamily(queryClient, ["shopping-lists"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.shoppingList(id) })
			toast.success("Lista atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar lista: ${error.message}`)
		},
	})
}

export const useDeleteShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/shopping-lists/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["shopping-lists"]) 
			toast.success("Lista excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir lista: ${error.message}`)
		},
	})
}

export const useAddToShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ listId, item }: { listId: string; item: any }) =>
			fetchWithErrorHandling(`/api/shopping-lists/${listId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(item),
			}),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["shopping-lists"] })
			queryClient.invalidateQueries({ queryKey: ["shopping-list", variables.listId] })
		},
	})
}


