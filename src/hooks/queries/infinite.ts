"use client"
import { useInfiniteQuery } from "@tanstack/react-query"
import { fetchWithErrorHandling } from "./fetch"

export const useInfiniteProductsQuery = (options?: {
	search?: string
	category?: string
	brand?: string
	sort?: string
	enabled?: boolean
}) => {
	const { search, category, brand, sort, enabled = true } = options || {}

	return useInfiniteQuery({
		queryKey: ["products", "infinite", { search, category, brand, sort }],
		queryFn: async ({ pageParam = 1 }) => {
			const params = new URLSearchParams()
			params.set("page", pageParam.toString())
			params.set("limit", "50")
			if (search?.trim()) params.set("search", search.trim())
			if (category && category !== "all") params.set("category", category)
			if (brand && brand !== "all") params.set("brand", brand)
			if (sort) params.set("sort", sort)
			return fetchWithErrorHandling(`/api/products?${params.toString()}`)
		},
		getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined),
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
		initialPageParam: 1,
		enabled,
		placeholderData: (previousData) => previousData,
	})
}

export const useInfiniteBrandsQuery = (options?: { search?: string; sort?: string; enabled?: boolean }) => {
	const { search, sort, enabled = true } = options || {}
	return useInfiniteQuery({
		queryKey: ["brands", "infinite", { search, sort }],
		queryFn: async ({ pageParam = 1 }) => {
			const params = new URLSearchParams()
			params.set("page", pageParam.toString())
			params.set("limit", "50")
			if (search?.trim()) params.set("search", search.trim())
			if (sort) params.set("sort", sort)
			return fetchWithErrorHandling(`/api/brands?${params.toString()}`)
		},
		getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined),
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
		initialPageParam: 1,
		enabled,
		placeholderData: (previousData) => previousData,
	})
}

export const useInfiniteCategoriesQuery = (options?: { search?: string; sort?: string; enabled?: boolean }) => {
	const { search, sort, enabled = true } = options || {}
	return useInfiniteQuery({
		queryKey: ["categories", "infinite", { search, sort }],
		queryFn: async ({ pageParam = 1 }) => {
			const params = new URLSearchParams()
			params.set("page", pageParam.toString())
			params.set("limit", "50")
			if (search?.trim()) params.set("search", search.trim())
			if (sort) params.set("sort", sort)
			return fetchWithErrorHandling(`/api/categories?${params.toString()}`)
		},
		getNextPageParam: (lastPage) => (lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined),
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
		initialPageParam: 1,
		enabled,
		placeholderData: (previousData) => previousData,
	})
}


