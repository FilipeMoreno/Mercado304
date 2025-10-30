"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Brand } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

export const useBrandsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.brands(params),
		queryFn: () => fetchWithErrorHandling(`/api/brands?${params?.toString() || ""}`),
		staleTime: 0,
	})
}

export const useBrandQuery = (id: string) => {
	return useQuery({
		queryKey: ["brands", id],
		queryFn: () => fetchWithErrorHandling(`/api/brands/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useAllBrandsQuery = () => {
	return useQuery({
		queryKey: queryKeys.allBrands(),
		queryFn: () => fetchWithErrorHandling("/api/brands/all"),
		staleTime: 5 * 60 * 1000,
	})
}

export const useCreateBrandMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Omit<Brand, "id" | "createdAt" | "updatedAt">) =>
			fetchWithErrorHandling("/api/brands", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (newBrand: Brand) => {
			await invalidateRefetchFamily(queryClient, ["brands"]) 
			toast.success("Marca criada com sucesso!")
			return newBrand
		},
		onError: (error) => {
			toast.error(`Erro ao criar marca: ${error.message}`)
		},
	})
}

export const useUpdateBrandMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) =>
			fetchWithErrorHandling(`/api/brands/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["brands"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.allBrands() })
			await invalidateRefetchFamily(queryClient, ["products"]) 
			toast.success("Marca atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar marca: ${error.message}`)
		},
	})
}

export const useDeleteBrandMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/brands/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["brands"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.allBrands() })
			await invalidateRefetchFamily(queryClient, ["products"]) 
			toast.success("Marca excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir marca: ${error.message}`)
		},
	})
}


