"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { ShoppingList } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: Partial<ShoppingList>) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/shopping-lists", data, "shoppingList")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/shopping-lists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Lista salva offline", { description: "Será criada quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<ShoppingList> }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/shopping-lists/${id}`, data, "shoppingList", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/shopping-lists/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Lista atualizada offline", { description: "Será sincronizada quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/shopping-lists/${id}`, {}, "shoppingList", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/shopping-lists/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Lista excluída offline", { description: "Será sincronizada quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ listId, item }: { listId: string; item: any }) => {
			if (!isOnline) {
				await addToQueue("POST", `/api/shopping-lists/${listId}/items`, item, "shoppingListItem", listId)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/shopping-lists/${listId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(item),
			})
		},
		onSuccess: (result: any, variables) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Item adicionado offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			queryClient.invalidateQueries({ queryKey: ["shopping-lists"] })
			queryClient.invalidateQueries({ queryKey: ["shopping-list", variables.listId] })
		},
	})
}


