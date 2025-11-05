"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Category } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

export const useCategoriesQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.categories(params),
		queryFn: () => fetchWithErrorHandling(`/api/categories?${params?.toString() || ""}`),
		staleTime: 0,
	})
}

export const useCategoryQuery = (id: string) => {
	return useQuery({
		queryKey: ["categories", id],
		queryFn: () => fetchWithErrorHandling(`/api/categories/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useAllCategoriesQuery = () => {
	return useQuery({
		queryKey: queryKeys.allCategories(),
		queryFn: () => fetchWithErrorHandling("/api/categories/all"),
		staleTime: 5 * 60 * 1000,
	})
}

export const useCreateCategoryMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/categories", data, "category")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Categoria salva offline", { description: "Será criada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["categories"])
			toast.success("Categoria criada com sucesso!")
			return result
		},
		onError: (error) => {
			toast.error(`Erro ao criar categoria: ${error.message}`)
		},
	})
}

export const useUpdateCategoryMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/categories/${id}`, data, "category", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/categories/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Categoria atualizada offline", { description: "Será sincronizada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["categories"])
			queryClient.invalidateQueries({ queryKey: queryKeys.allCategories() })
			await invalidateRefetchFamily(queryClient, ["products"])
			toast.success("Categoria atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar categoria: ${error.message}`)
		},
	})
}

export const useDeleteCategoryMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, transferData }: { id: string; transferData?: any }) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/categories/${id}`, { transferData }, "category", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/categories/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ transferData }),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Categoria excluída offline", { description: "Será sincronizada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["categories"])
			queryClient.invalidateQueries({ queryKey: queryKeys.allCategories() })
			await invalidateRefetchFamily(queryClient, ["products"])
			toast.success(result.message || "Categoria excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir categoria: ${error.message}`)
		},
	})
}


