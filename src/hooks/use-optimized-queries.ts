"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"

// Configurações otimizadas para React Query
export const queryConfig = {
	defaultStaleTime: 5 * 60 * 1000, // 5 minutos
	defaultCacheTime: 10 * 60 * 1000, // 10 minutos
	refetchOnWindowFocus: false, // Desativa refetching automático ao focar na janela
	refetchOnMount: false, // Desativa refetching automático ao montar
	retry: 1, // Tenta novamente 1 vez em caso de falha
}

// Hook para queries otimizadas
export function useOptimizedQuery<TData, TError = unknown>(
	queryKey: string[],
	queryFn: () => Promise<TData>,
	options?: {
		enabled?: boolean
		staleTime?: number
		gcTime?: number
		refetchInterval?: number
	},
) {
	const {
		enabled = true,
		staleTime = queryConfig.defaultStaleTime,
		gcTime = queryConfig.defaultCacheTime,
		refetchInterval,
	} = options || {}

	return useQuery<TData, TError>({
		queryKey,
		queryFn,
		enabled,
		staleTime,
		gcTime,
		refetchInterval,
		refetchOnWindowFocus: queryConfig.refetchOnWindowFocus,
		refetchOnMount: queryConfig.refetchOnMount,
		retry: queryConfig.retry,
	})
}

// Hook para prefetching inteligente (ex: para navegação)
export function useSmartPrefetch(queryKey: string[], queryFn: () => Promise<any>) {
	const queryClient = useQueryClient()

    const prefetch = () => {
        queryClient.prefetchQuery({
            queryKey,
            queryFn,
            staleTime: queryConfig.defaultStaleTime,
        })
    }

    return { prefetch }
}

// Hook para monitorar e otimizar re-renders de componentes
export function useComponentRenderMonitor(componentName: string) {
	const renderCount = useRef(0)
	renderCount.current++

	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			console.log(`${componentName} rendered: ${renderCount.current} times`)
		}
	})

	return { renderCount: renderCount.current }
}

// Hook para invalidação inteligente de cache
export function useSmartCache() {
	const queryClient = useQueryClient()

    const invalidateRelated = (
        entityType: string,
        _entityId?: string,
    ) => {
			const invalidationMap = {
				product: [["products"], ["categories"], ["brands"], ["dashboard", "stats"]],
				market: [["markets"], ["purchases"], ["dashboard", "stats"]],
				category: [["categories"], ["products"], ["dashboard", "stats"]],
				brand: [["brands"], ["products"], ["dashboard", "stats"]],
				purchase: [["purchases"], ["markets"], ["dashboard", "stats"]],
			}

			const queriesToInvalidate = invalidationMap[entityType as keyof typeof invalidationMap] || []

			queriesToInvalidate.forEach((queryKey) => {
				queryClient.invalidateQueries({ queryKey })
			})
        }

    const clearOldCache = () => {
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
    }

	return { invalidateRelated, clearOldCache }
}

// Hook para queries com debounce
export function useDebouncedQuery<TData>(
	queryKey: string[],
	queryFn: () => Promise<TData>,
	delay: number = 500,
	options: {
		enabled?: boolean
		staleTime?: number
	} = {},
) {
	const [debouncedQueryKey, setDebouncedQueryKey] = useState<string[]>(queryKey)

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQueryKey(queryKey)
		}, delay)

		return () => clearTimeout(timer)
	}, [queryKey, delay])

	return useOptimizedQuery(debouncedQueryKey, queryFn, options)
}
