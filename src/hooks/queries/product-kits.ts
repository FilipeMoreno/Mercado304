"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

export const useProductKitsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.productKits.all(params),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	})
}

export const useProductKitQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.detail(id),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useProductKitNutritionQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.nutrition(id),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits/${id}/nutrition`),
		staleTime: 5 * 60 * 1000,
		enabled: !!id,
	})
}

export const useProductKitStockQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.stock(id),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits/${id}/stock`),
		staleTime: 30 * 1000,
		enabled: !!id,
	})
}

export const useProductKitPriceQuery = (id: string, marketId?: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.price(id, marketId),
		queryFn: () => {
			const url = marketId ? `/api/product-kits/${id}/price?marketId=${marketId}` : `/api/product-kits/${id}/price`
			return fetchWithErrorHandling(url)
		},
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateProductKitMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/product-kits", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["product-kits"]) 
			await invalidateRefetchFamily(queryClient, ["products"]) 
			toast.success("Kit criado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar kit: ${error.message}`)
		},
	})
}

export const useUpdateProductKitMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/product-kits/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
			await invalidateRefetchFamily(queryClient, ["product-kits"]) 
			queryClient.invalidateQueries({ queryKey: queryKeys.productKits.detail(id) })
			toast.success("Kit atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar kit: ${error.message}`)
		},
	})
}

export const useConsumeKitStockMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, quantity, reason }: { id: string; quantity: number; reason?: string }) =>
			fetchWithErrorHandling(`/api/product-kits/${id}/stock/consume`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quantity, reason }),
			}),
		onSuccess: async (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.productKits.stock(id) })
			await invalidateRefetchFamily(queryClient, ["stock"]) 
			await invalidateRefetchFamily(queryClient, ["stock-history"]) 
			toast.success("Kit consumido do estoque com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao consumir kit: ${error.message}`)
		},
	})
}

export const useDeleteProductKitMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/product-kits/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await invalidateRefetchFamily(queryClient, ["product-kits"]) 
			await invalidateRefetchFamily(queryClient, ["products"]) 
			toast.success("Kit excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir kit: ${error.message}`)
		},
	})
}


