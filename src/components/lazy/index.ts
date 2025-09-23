import { lazy } from "react"

// Lazy loading de componentes pesados
export const LazyProductList = lazy(() => import("@/components/products/product-list"))
export const LazyProductCard = lazy(() => import("@/components/products/product-card"))
export const LazyProductStats = lazy(() => import("@/components/products/product-stats"))
export const LazyProductPagination = lazy(() => import("@/components/products/product-pagination"))

export const LazyBarcodeScanner = lazy(() => import("@/components/barcode-scanner"))
export const LazyAIAssistantChat = lazy(() => import("@/components/ai-assistant-chat"))
export const LazyRecipeSearch = lazy(() => import("@/components/recipe-search"))
export const LazyNutritionScanner = lazy(() => import("@/components/nutritional-scanner"))

// Lazy loading de páginas completas
export const LazyAnalyticsPage = lazy(() => import("@/app/analytics/page"))
export const LazyReportsPage = lazy(() => import("@/app/relatorios/page"))
export const LazySettingsPage = lazy(() => import("@/app/configuracoes/page"))

// Lazy loading de componentes de UI pesados
export const LazyDataTable = lazy(() => import("@/components/ui/data-table"))
export const LazyChart = lazy(() => import("@/components/ui/chart"))
export const LazyCalendar = lazy(() => import("@/components/ui/calendar"))
