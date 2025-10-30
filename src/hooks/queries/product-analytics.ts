"use client"
import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "./query-keys"
import { fetchWithErrorHandling } from "./fetch"

export const useProductRecentPurchasesQuery = (productId: string) => {
	return useQuery({
		queryKey: queryKeys.productAnalytics.recentPurchases(productId),
		queryFn: () => fetchWithErrorHandling(`/api/products/${productId}/recent-purchases`),
		staleTime: 2 * 60 * 1000,
		enabled: !!productId,
	})
}

export const useProductBestDayToBuyQuery = (productId: string) => {
	return useQuery({
		queryKey: queryKeys.productAnalytics.bestDayToBuy(productId),
		queryFn: () =>
			fetchWithErrorHandling("/api/products/best-day-to-buy", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId }),
			}),
		staleTime: 5 * 60 * 1000,
		enabled: !!productId,
	})
}

export const useProductBestDayAiAnalysisQuery = (productId: string, enabled = false) => {
	return useQuery({
		queryKey: queryKeys.productAnalytics.bestDayAiAnalysis(productId),
		queryFn: () =>
			fetchWithErrorHandling("/api/products/best-day-to-buy/ai-analysis", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId }),
			}),
		staleTime: 10 * 60 * 1000,
		enabled: enabled && !!productId,
	})
}

export const useProductWasteUsageQuery = (productId: string) => {
	return useQuery({
		queryKey: queryKeys.productAnalytics.wasteUsage(productId),
		queryFn: async () => {
			const wasteResponse = await fetch(`/api/stock/waste?productId=${productId}`)
			const wasteData = wasteResponse.ok ? await wasteResponse.json() : { wasteRecords: [] }
			const stockResponse = await fetch(`/api/stock/history?productId=${productId}`)
			const stockData = stockResponse.ok ? await stockResponse.json() : { movements: [] }
			const wasteRecords = wasteData.wasteRecords || []
			const stockMovements = stockData.movements || []
			const totalWasteValue = wasteRecords.reduce((sum: number, record: any) => sum + (record.totalValue || 0), 0)
			const totalWasteQuantity = wasteRecords.reduce((sum: number, record: any) => sum + (record.quantity || 0), 0)
			const thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
			const recentWasteCount = wasteRecords.filter((record: any) => new Date(record.wasteDate) >= thirtyDaysAgo).length
			const recentUsageCount = stockMovements.filter(
				(movement: any) => movement.type === "USO" && new Date(movement.date) >= thirtyDaysAgo,
			).length
			return {
				wasteRecords: wasteRecords.slice(0, 5),
				stockMovements: stockMovements.filter((m: any) => m.type === "USO").slice(0, 5),
				totalWasteValue,
				totalWasteQuantity,
				recentWasteCount,
				recentUsageCount,
			}
		},
		staleTime: 2 * 60 * 1000,
		enabled: !!productId,
	})
}

export const useRelatedProductsQuery = (productId: string) => {
	return useQuery({
		queryKey: queryKeys.productAnalytics.relatedProducts(productId),
		queryFn: () =>
			fetchWithErrorHandling("/api/products/related", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId }),
			}),
		staleTime: 5 * 60 * 1000,
		enabled: !!productId,
	})
}


