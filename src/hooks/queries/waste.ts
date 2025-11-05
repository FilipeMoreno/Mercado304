"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"
import { useOfflineSync } from "../use-offline-sync"

export const useWasteQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.waste(params),
		queryFn: () => fetchWithErrorHandling(`/api/waste?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000,
	})
}

export const useWasteItemQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.wasteItem(id),
		queryFn: () => fetchWithErrorHandling(`/api/waste/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateWasteMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (data: any) => {
			if (!isOnline) {
				await addToQueue("POST", "/api/waste", data, "waste")
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling("/api/waste", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Desperdício salvo offline", { description: "Será registrado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["waste"])
			await invalidateRefetchFamily(queryClient, ["stock"])
			await invalidateRefetchFamily(queryClient, ["stock-history"])
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Desperdício registrado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao registrar desperdício: ${error.message}`)
		},
	})
}

export const useUpdateWasteMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async ({ id, data }: { id: string; data: any }) => {
			if (!isOnline) {
				await addToQueue("PUT", `/api/waste/${id}`, data, "waste", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/waste/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
		},
		onSuccess: async (result: any, { id }) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Desperdício atualizado offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["waste"])
			queryClient.invalidateQueries({ queryKey: queryKeys.wasteItem(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Desperdício atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar desperdício: ${error.message}`)
		},
	})
}

export const useDeleteWasteMutation = () => {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (id: string) => {
			if (!isOnline) {
				await addToQueue("DELETE", `/api/waste/${id}`, {}, "waste", id)
				return { success: true, queued: true }
			}
			return fetchWithErrorHandling(`/api/waste/${id}`, {
				method: "DELETE",
			})
		},
		onSuccess: async (result: any) => {
			if (result?.queued || ('queued' in result && result.queued)) {
				toast.info("Desperdício excluído offline", { description: "Será sincronizado quando voltar online" })
				return
			}
			await invalidateRefetchFamily(queryClient, ["waste"])
			await invalidateRefetchFamily(queryClient, ["stock"])
			await invalidateRefetchFamily(queryClient, ["stock-history"])
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Desperdício excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir desperdício: ${error.message}`)
		},
	})
}


