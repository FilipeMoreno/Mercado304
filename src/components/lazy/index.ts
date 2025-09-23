import { lazy } from "react"

// Lazy loading de componentes pesados
export const LazyProductList = lazy(() =>
	import("@/components/products/product-list").then((module) => ({
		default: module.ProductList,
	})),
)
export const LazyProductCard = lazy(() =>
	import("@/components/products/product-card").then((module) => ({
		default: module.ProductCard,
	})),
)
export const LazyProductStats = lazy(() =>
	import("@/components/products/product-stats").then((module) => ({
		default: module.ProductStats,
	})),
)
export const LazyProductPagination = lazy(() =>
	import("@/components/products/product-pagination").then((module) => ({
		default: module.ProductPagination,
	})),
)

export const LazyBarcodeScanner = lazy(() =>
	import("@/components/barcode-scanner").then((module) => ({
		default: module.BarcodeScanner,
	})),
)
export const LazyAIAssistantChat = lazy(() =>
	import("@/components/ai-assistant-chat").then((module) => ({
		default: module.AiAssistantChat,
	})),
)
export const LazyRecipeSearch = lazy(() =>
	import("@/components/recipe-search").then((module) => ({
		default: module.RecipeSearch,
	})),
)
export const LazyNutritionScanner = lazy(() =>
	import("@/components/nutritional-scanner").then((module) => ({
		default: module.NutritionalScanner,
	})),
)
