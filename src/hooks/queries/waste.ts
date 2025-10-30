"use client"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"
import { invalidateRefetchFamily } from "./utils"

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
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/waste", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
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
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/waste/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (_, { id }) => {
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
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/waste/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
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


