"use client"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"

export const useDashboardStatsQuery = () => {
	return useQuery({
		queryKey: queryKeys.dashboard.stats(),
		queryFn: () => fetchWithErrorHandling("/api/dashboard/stats"),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}

export const useDashboardAISummaryQuery = () => {
	return useQuery({
		queryKey: queryKeys.dashboard.aiSummary(),
		queryFn: () => fetchWithErrorHandling("/api/dashboard/ai-summary"),
		staleTime: 5 * 60 * 1000,
	})
}

export const usePaymentStatsQuery = (params?: { dateFrom?: string; dateTo?: string }) => {
	const search = new URLSearchParams()
	if (params?.dateFrom) search.set("dateFrom", params.dateFrom)
	if (params?.dateTo) search.set("dateTo", params.dateTo)

	return useQuery({
		queryKey: [...queryKeys.dashboard.paymentStats(), search.toString()],
		queryFn: () => fetchWithErrorHandling(`/api/dashboard/payment-stats?${search.toString()}`),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		refetchOnWindowFocus: false,
	})
}

export const useExpirationAlertsQuery = () => {
	return useQuery({
		queryKey: queryKeys.expiration.alerts(),
		queryFn: () => fetchWithErrorHandling("/api/stock/expiration-alerts"),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}

export const useSavingsQuery = () => {
	return useQuery({
		queryKey: ["savings"],
		queryFn: () => fetchWithErrorHandling("/api/savings"),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}

export const useTemporalComparisonQuery = () => {
	return useQuery({
		queryKey: ["temporal-comparison"],
		queryFn: () => fetchWithErrorHandling("/api/temporal-comparison"),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}

export const useConsumptionPatternsQuery = () => {
	return useQuery({
		queryKey: ["consumption-patterns"],
		queryFn: () => fetchWithErrorHandling("/api/predictions/consumption-patterns"),
		staleTime: 5 * 60 * 1000,
	})
}


