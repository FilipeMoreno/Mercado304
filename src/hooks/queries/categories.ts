"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Category } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

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
	return useMutation({
		mutationFn: (data: Omit<Category, "id" | "createdAt" | "updatedAt">) =>
			fetchWithErrorHandling("/api/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (newCategory: Category) => {
			await invalidateRefetchFamily(queryClient, ["categories"]) 
			toast.success("Categoria criada com sucesso!")
			return newCategory
		},
		onError: (error) => {
			toast.error(`Erro ao criar categoria: ${error.message}`)
		},
	})
}

export const useUpdateCategoryMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
			fetchWithErrorHandling(`/api/categories/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
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
	return useMutation({
		mutationFn: ({ id, transferData }: { id: string; transferData?: any }) =>
			fetchWithErrorHandling(`/api/categories/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ transferData }),
			}),
		onSuccess: async (data: { message?: string }) => {
			await invalidateRefetchFamily(queryClient, ["categories"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.allCategories() })
			await invalidateRefetchFamily(queryClient, ["products"]) 
			toast.success(data.message || "Categoria excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir categoria: ${error.message}`)
		},
	})
}


