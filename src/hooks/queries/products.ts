"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Product } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"

export const useProductsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.products(params),
		queryFn: () => fetchWithErrorHandling(`/api/products?${params?.toString() || ""}`),
		staleTime: 0,
	})
}

export const useProductQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.product(id),
		queryFn: () => fetchWithErrorHandling(`/api/products/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useProductDetailsQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productDetails(id),
		queryFn: () => fetchWithErrorHandling(`/api/products/${id}?includeStats=true`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useProductNutritionalInfoQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productNutritionalInfo(id),
		queryFn: () => fetchWithErrorHandling(`/api/products/${id}/scan-nutrition`),
		staleTime: 5 * 60 * 1000,
		enabled: !!id,
		retry: false,
	})
}

export const useAllProductsQuery = (options?: { excludeKits?: boolean }) => {
	const { excludeKits = false } = options || {}
	return useQuery({
		queryKey: ["products", "all", { excludeKits }],
		queryFn: () => {
			const params = new URLSearchParams()
			if (excludeKits) params.set("excludeKits", "true")
			return fetchWithErrorHandling(`/api/products/all?${params.toString()}`)
		},
		staleTime: 2 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	})
}

export const useCreateProductMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Omit<Product, "id" | "createdAt" | "updatedAt" | "barcodes"> & { barcodes?: string[] }) =>
			fetchWithErrorHandling("/api/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			// Invalida todas as variações de queries de produtos (lista, filtros, infinite, etc.)
			await queryClient.invalidateQueries({ queryKey: ["products"], exact: false })
			// Refaz o fetch imediatamente para refletir na página /produtos após redirecionar
			await queryClient.refetchQueries({ queryKey: ["products"], exact: false })
			// Outras dependências
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			// Lista "all"
			queryClient.invalidateQueries({ queryKey: ["products", "all"], exact: false })
			toast.success("Produto criado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar produto: ${error.message}`)
		},
	})
}

export const useUpdateProductMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
			fetchWithErrorHandling(`/api/products/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
			// Invalida e refaz fetch de todas as variações de listas de produtos
			await queryClient.invalidateQueries({ queryKey: ["products"], exact: false })
			await queryClient.refetchQueries({ queryKey: ["products"], exact: false })
			// Item específico e dependências
			queryClient.invalidateQueries({ queryKey: queryKeys.product(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			toast.success("Produto atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar produto: ${error.message}`)
		},
	})
}

export const useDeleteProductMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/products/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["products"], exact: false })
			await queryClient.refetchQueries({ queryKey: ["products"], exact: false })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["purchases"] })
			toast.success("Produto excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir produto: ${error.message}`)
		},
	})
}


