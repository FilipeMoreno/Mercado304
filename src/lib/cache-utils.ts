import { revalidateTag, unstable_cache } from "next/cache"
import { cache } from "react"
import type { CacheTag } from "./cache-tags"

// Next.js 15 optimized cache wrapper
export function createCachedFunction<T extends (...args: any[]) => Promise<any>>(
	fn: T,
	{
		tags,
		revalidate = 300, // 5 minutes default
		keyPrefix = "",
	}: {
		tags: CacheTag[]
		revalidate?: number | false
		keyPrefix?: string
	},
): T {
	// Use React cache for request-level memoization
	const cachedFn = cache(fn)

	// Use Next.js cache for longer-term caching
	return unstable_cache(cachedFn, [keyPrefix, fn.name].filter(Boolean), {
		tags,
		revalidate,
	}) as T
}

// Cache invalidation helper
export async function invalidateCache(tags: CacheTag[]) {
	for (const tag of tags) {
		await revalidateTag(tag, {})
	}
}

// Specific cache invalidation functions
export const cacheInvalidation = {
	products: () => invalidateCache(["products"]),
	product: (id: string) => invalidateCache([`product-${id}`, "products"]),

	markets: () => invalidateCache(["markets"]),
	market: (id: string) => invalidateCache([`market-${id}`, "markets"]),

	categories: () => invalidateCache(["categories"]),
	category: (id: string) => invalidateCache([`category-${id}`, "categories"]),

	brands: () => invalidateCache(["brands"]),
	brand: (id: string) => invalidateCache([`brand-${id}`, "brands"]),

	stock: () => invalidateCache(["stock"]),
	stockItem: (id: string) => invalidateCache([`stock-item-${id}`, "stock"]),

	purchases: () => invalidateCache(["purchases"]),
	purchase: (id: string) => invalidateCache([`purchase-${id}`, "purchases"]),

	shoppingLists: () => invalidateCache(["shopping-lists"]),
	shoppingList: (id: string) => invalidateCache([`shopping-list-${id}`, "shopping-lists"]),

	dashboard: () => invalidateCache(["dashboard", "dashboard-stats"]),

	waste: () => invalidateCache(["waste"]),
	wasteItem: (id: string) => invalidateCache([`waste-${id}`, "waste"]),

	user: (id: string) => invalidateCache([`user-${id}`, `user-preferences-${id}`]),
}

// React 19 concurrent features helper
export function createOptimisticUpdate<T>(data: T, updateFn: (data: T) => T): T {
	// This will work with React 19's concurrent features
	return updateFn(data)
}
