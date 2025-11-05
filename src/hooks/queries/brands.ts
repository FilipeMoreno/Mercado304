"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { Brand } from "@/types"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: Omit<Brand, "id" | "createdAt" | "updatedAt">) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/brands", data, "brand")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/brands", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Marca salva offline", { description: "Será criada quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["brands"])
			toast.success("Marca criada com sucesso!")
			return result
		},
		onError: (error) => {
			toast.error(`Erro ao criar marca: ${error.message}`)
		},
	})
}

export const useUpdateBrandMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: Partial<Brand> }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/brands/${id}`, data, "brand", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/brands/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Marca atualizada offline", { description: "Será sincronizada quando voltar online" })
				return
			}
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
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/brands/${id}`, {}, "brand", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/brands/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Marca excluída offline", { description: "Será sincronizada quando voltar online" })
				return
			}
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


