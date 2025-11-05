"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useOfflineSync } from "./use-offline-sync"

interface OfflineMutationOptions<TData, TVariables> {
	mutationFn: (variables: TVariables) => Promise<TData>
	onSuccess?: (data: TData, variables: TVariables) => void
	onError?: (error: Error, variables: TVariables) => void
	invalidateQueries?: string[][]
	entityType: string // 'product', 'market', 'purchase', etc.
	method: "POST" | "PUT" | "PATCH" | "DELETE"
	getUrl: (variables: TVariables) => string
}

/**
 * Hook que estende useMutation para suportar operações offline
 * Quando offline, adiciona à fila de sincronização em vez de executar imediatamente
 */
export function useOfflineMutation<TData = unknown, TVariables = unknown>({
	mutationFn,
	onSuccess,
	onError,
	invalidateQueries = [],
	entityType,
	method,
	getUrl,
}: OfflineMutationOptions<TData, TVariables>) {
	const queryClient = useQueryClient()
	const { isOnline, addToQueue } = useOfflineSync()

	return useMutation({
		mutationFn: async (variables: TVariables) => {
			// Se estiver offline, adicionar à fila
			if (!isOnline) {
				const url = getUrl(variables)

				await addToQueue(
					method,
					url,
					variables,
					entityType,
					// Extrair ID se existir
					typeof variables === "object" && variables !== null && "id" in variables
						? String((variables as any).id)
						: undefined
				)

				// Retornar resposta mock
				return {
					success: true,
					queued: true,
					message: "Ação salva para sincronização",
				} as TData
			}

			// Se online, executar normalmente
			return mutationFn(variables)
		},
		onSuccess: (data, variables) => {
			// Verificar se foi enfileirado
			const isQueued = typeof data === "object" && data !== null && "queued" in data

			if (isQueued) {
				toast.success("Ação salva offline", {
					description: "Será sincronizada quando voltar online",
				})
			} else {
				// Invalidar queries relacionadas
				for (const queryKey of invalidateQueries) {
					queryClient.invalidateQueries({ queryKey })
				}

				// Chamar callback de sucesso
				onSuccess?.(data, variables)
			}
		},
		onError: (error: Error, variables) => {
			toast.error("Erro ao salvar", {
				description: error.message,
			})
			onError?.(error, variables)
		},
	})
}

/**
 * Helpers pré-configurados para operações comuns
 */

// CREATE
export function useOfflineCreate<TData = unknown, TVariables = unknown>(
	entityType: string,
	url: string,
	invalidateQueries: string[][] = []
) {
	return useOfflineMutation<TData, TVariables>({
		mutationFn: async (data: TVariables) => {
			const response = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
			if (!response.ok) throw new Error("Erro ao criar")
			return response.json()
		},
		method: "POST",
		getUrl: () => url,
		entityType,
		invalidateQueries,
	})
}

// UPDATE
export function useOfflineUpdate<TData = unknown, TVariables = { id: string }>(
	entityType: string,
	getUrl: (id: string) => string,
	invalidateQueries: string[][] = []
) {
	return useOfflineMutation<TData, TVariables>({
		mutationFn: async (data: TVariables) => {
			const id = (data as any).id
			const response = await fetch(getUrl(id), {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			})
			if (!response.ok) throw new Error("Erro ao atualizar")
			return response.json()
		},
		method: "PATCH",
		getUrl: (variables) => getUrl((variables as any).id),
		entityType,
		invalidateQueries,
	})
}

// DELETE
export function useOfflineDelete<TData = unknown>(
	entityType: string,
	getUrl: (id: string) => string,
	invalidateQueries: string[][] = []
) {
	return useOfflineMutation<TData, { id: string }>({
		mutationFn: async ({ id }: { id: string }) => {
			const response = await fetch(getUrl(id), {
				method: "DELETE",
			})
			if (!response.ok) throw new Error("Erro ao deletar")
			return response.json()
		},
		method: "DELETE",
		getUrl: (variables) => getUrl(variables.id),
		entityType,
		invalidateQueries,
	})
}
