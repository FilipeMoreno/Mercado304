"use client"

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"

// Configurações otimizadas para React Query
export const queryConfig = {
	defaultStaleTime: 5 * 60 * 1000, // 5 minutos
	defaultCacheTime: 10 * 60 * 1000, // 10 minutos
	retry: 3,
	retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
	refetchOnWindowFocus: false,
	refetchOnMount: false,
	refetchOnReconnect: true,
}

// Hook para queries com paginação otimizada
export function useOptimizedInfiniteQuery<T>(
	queryKey: string[],
	queryFn: (pageParam: number) => Promise<{ data: T[]; nextPage?: number }>,
	options: {
		enabled?: boolean
		staleTime?: number
		cacheTime?: number
		pageSize?: number
	} = {},
) {
	const {
		enabled = true,
		staleTime = queryConfig.defaultStaleTime,
		cacheTime = queryConfig.defaultCacheTime,
		pageSize = 20,
	} = options

	return useInfiniteQuery({
		queryKey,
		queryFn: ({ pageParam = 0 }) => queryFn(pageParam),
		getNextPageParam: (lastPage) => lastPage.nextPage,
		enabled,
		staleTime,
		cacheTime,
		retry: queryConfig.retry,
		retryDelay: queryConfig.retryDelay,
		refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
		refetchOnMount: queryConfig.refetchOnMount,
		refetchOnReconnect: queryConfig.refetchOnReconnect,
	})
}

// Hook para queries simples otimizadas
export function useOptimizedQuery<T>(
	queryKey: string[],
	queryFn: () => Promise<T>,
	options: {
		enabled?: boolean
		staleTime?: number
		cacheTime?: number
		refetchInterval?: number
	} = {},
) {
	const {
		enabled = true,
		staleTime = queryConfig.defaultStaleTime,
		cacheTime = queryConfig.defaultCacheTime,
		refetchInterval,
	} = options

	return useQuery({
		queryKey,
		queryFn,
		enabled,
		staleTime,
		cacheTime,
		retry: queryConfig.retry,
		retryDelay: queryConfig.retryDelay,
		refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
		refetchOnMount: queryConfig.refetchOnMount,
		refetchOnReconnect: queryConfig.refetchOnReconnect,
		refetchInterval,
	})
}

// Hook para prefetch inteligente
export function useSmartPrefetch() {
	const queryClient = useQueryClient()

	const prefetchPage = useCallback(
		async (pageNumber: number, queryKey: string[], queryFn: () => Promise<any>) => {
			const nextPageKey = [...queryKey, { page: pageNumber }]

			// Só prefetch se não estiver no cache
			if (!queryClient.getQueryData(nextPageKey)) {
				await queryClient.prefetchQuery({
					queryKey: nextPageKey,
					queryFn,
					staleTime: queryConfig.defaultStaleTime,
				})
			}
		},
		[queryClient],
	)

	const prefetchRelated = useCallback(
		async (entityType: string, entityId: string) => {
			// Prefetch dados relacionados baseado no tipo de entidade
			const prefetchMap = {
				product: [
					["products", entityId],
					["products", entityId, "prices"],
					["products", entityId, "history"],
				],
				market: [
					["markets", entityId],
					["markets", entityId, "purchases"],
				],
				category: [
					["categories", entityId],
					["categories", entityId, "products"],
				],
				brand: [
					["brands", entityId],
					["brands", entityId, "products"],
				],
			}

			const queriesToPrefetch = prefetchMap[entityType as keyof typeof prefetchMap] || []

			for (const queryKey of queriesToPrefetch) {
				if (!queryClient.getQueryData(queryKey)) {
					queryClient.prefetchQuery({
						queryKey,
						queryFn: () => fetch(`/api/${queryKey.join("/")}`).then((res) => res.json()),
						staleTime: queryConfig.defaultStaleTime,
					})
				}
			}
		},
		[queryClient],
	)

	return { prefetchPage, prefetchRelated }
}

// Hook para cache inteligente
export function useSmartCache() {
	const queryClient = useQueryClient()

	const invalidateRelated = useCallback(
		(entityType: string, entityId?: string) => {
			const invalidationMap = {
				product: [["products"], ["products", entityId], ["categories"], ["brands"], ["dashboard", "stats"]],
				market: [["markets"], ["markets", entityId], ["purchases"], ["dashboard", "stats"]],
				category: [["categories"], ["categories", entityId], ["products"], ["dashboard", "stats"]],
				brand: [["brands"], ["brands", entityId], ["products"], ["dashboard", "stats"]],
				purchase: [["purchases"], ["purchases", entityId], ["markets"], ["dashboard", "stats"]],
			}

			const queriesToInvalidate = invalidationMap[entityType as keyof typeof invalidationMap] || []

			queriesToInvalidate.forEach((queryKey) => {
				queryClient.invalidateQueries({ queryKey })
			})
		},
		[queryClient],
	)

	const clearOldCache = useCallback(() => {
		// Limpar cache antigo baseado em timestamp
		const now = Date.now()
		const maxAge = 24 * 60 * 60 * 1000 // 24 horas

		queryClient
			.getQueryCache()
			.getAll()
			.forEach((query) => {
				const queryAge = now - (query.state.dataUpdatedAt || 0)
				if (queryAge > maxAge) {
					queryClient.removeQueries({ queryKey: query.queryKey })
				}
			})
	}, [queryClient])

	return { invalidateRelated, clearOldCache }
}

// Hook para queries com debounce
export function useDebouncedQuery<T>(
	queryKey: string[],
	queryFn: () => Promise<T>,
	debounceMs: number = 300,
	options: {
		enabled?: boolean
		staleTime?: number
	} = {},
) {
	const [debouncedQueryKey, setDebouncedQueryKey] = useState<string[]>(queryKey)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQueryKey(queryKey)
		}, debounceMs)

		return () => clearTimeout(timer)
	}, [queryKey, debounceMs])

	return useOptimizedQuery(debouncedQueryKey, queryFn, options)
}

// Hook para queries com retry inteligente
export function useResilientQuery<T>(
	queryKey: string[],
	queryFn: () => Promise<T>,
	options: {
		enabled?: boolean
		maxRetries?: number
		backoffMultiplier?: number
	} = {},
) {
	const { enabled = true, maxRetries = 5, backoffMultiplier = 2 } = options

	return useOptimizedQuery(queryKey, queryFn, {
		enabled,
		retry: (failureCount, error) => {
			// Não retry para erros 4xx (client errors)
			if (error instanceof Error && error.message.includes("4")) {
				return false
			}
			return failureCount < maxRetries
		},
		retryDelay: (attemptIndex) => Math.min(1000 * backoffMultiplier ** attemptIndex, 30000),
	})
}
