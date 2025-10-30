"use client"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"

export const usePriceAnalysisQuery = (params?: { productId?: string; marketId?: string; days?: number }) => {
	const searchParams = new URLSearchParams()
	if (params?.productId) searchParams.append("productId", params.productId)
	if (params?.marketId) searchParams.append("marketId", params.marketId)
	if (params?.days) searchParams.append("days", params.days.toString())

	return useQuery({
		queryKey: queryKeys.priceAnalysis(searchParams),
		queryFn: () => fetchWithErrorHandling(`/api/prices/analysis?${searchParams.toString()}`),
		staleTime: 2 * 60 * 1000,
		enabled: !!(params?.productId || params?.marketId),
	})
}


