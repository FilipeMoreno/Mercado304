// Next.js 15 Cache Tags system for better cache invalidation
export const CACHE_TAGS = {
	// Product related
	products: "products",
	product: (id: string) => `product-${id}`,

	// Market related
	markets: "markets",
	market: (id: string) => `market-${id}`,

	// Category related
	categories: "categories",
	category: (id: string) => `category-${id}`,

	// Brand related
	brands: "brands",
	brand: (id: string) => `brand-${id}`,

	// Stock related
	stock: "stock",
	stockItem: (id: string) => `stock-item-${id}`,

	// Purchase related
	purchases: "purchases",
	purchase: (id: string) => `purchase-${id}`,

	// Shopping list related
	shoppingLists: "shopping-lists",
	shoppingList: (id: string) => `shopping-list-${id}`,

	// Dashboard related
	dashboard: "dashboard",
	dashboardStats: "dashboard-stats",

	// Waste related
	waste: "waste",
	wasteItem: (id: string) => `waste-${id}`,

	// User specific
	user: (id: string) => `user-${id}`,
	userPreferences: (id: string) => `user-preferences-${id}`,
} as const

export type CacheTag =
	| (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]
	| ReturnType<(typeof CACHE_TAGS)[keyof typeof CACHE_TAGS]>
