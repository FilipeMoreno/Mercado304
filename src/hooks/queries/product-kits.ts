"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: any) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/product-kits", data, "productKit")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/product-kits", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Kit salvo offline", { description: "Será criado quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: any }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/product-kits/${id}`, data, "productKit", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/product-kits/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Kit atualizado offline", { description: "Será sincronizado quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, quantity, reason }: { id: string; quantity: number; reason?: string }) => {
			if (!isOnline) {
				await addToQueue("POST", `/api/product-kits/${id}/stock/consume`, { quantity, reason }, "kitStock", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/product-kits/${id}/stock/consume`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quantity, reason }),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Consumo registrado offline", { description: "Será sincronizado quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/product-kits/${id}`, {}, "productKit", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/product-kits/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Kit excluído offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["product-kits"])
			await invalidateRefetchFamily(queryClient, ["products"])
			toast.success("Kit excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir kit: ${error.message}`)
		},
	})
}


