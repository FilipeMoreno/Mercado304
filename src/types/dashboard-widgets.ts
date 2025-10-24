import type { Layout, Layouts } from "react-grid-layout"

/**
 * Tipos de widgets disponíveis no dashboard
 */
export type WidgetType =
	| "total-purchases"
	| "total-spent"
	| "total-products"
	| "total-markets"
	| "price-records"
	| "ai-summary"
	| "monthly-chart"
	| "monthly-stats"
	| "category-stats"
	| "top-products"
	| "market-compare"
	| "recent-purchases"
	| "expiration-alerts"
	| "replenishment-alerts"
	| "savings-card"
	| "discount-stats"
	| "temporal-comparison"
	| "nutrition-summary"
	| "payment-stats"
	| "payment-transactions"
	| "payment-total-amount"
	| "payment-average-ticket"
	| "payment-most-used"
	| "payment-distribution"
	| "payment-details"
	| "payment-insights"
	| "install-pwa"

/**
 * Configuração de um widget individual
 */
export interface WidgetConfig {
	id: WidgetType
	label: string
	description: string
	icon?: string
	defaultSize: {
		w: number // largura em colunas
		h: number // altura em linhas
		minW?: number // largura mínima
		minH?: number // altura mínima
		maxW?: number // largura máxima
		maxH?: number // altura máxima
	}
	category: "stats" | "charts" | "lists" | "alerts" | "analytics" | "tools"
	requiresData?: boolean // se precisa de dados da API
	allowNesting?: boolean // se permite widgets dentro dele
}

/**
 * Layout de widget com posicionamento
 */
export interface WidgetLayout extends Layout {
	i: WidgetType // ID do widget
	x: number // posição X no grid
	y: number // posição Y no grid
	w: number // largura em colunas
	h: number // altura em linhas
	minW?: number
	minH?: number
	maxW?: number
	maxH?: number
	isResizable?: boolean
	isDraggable?: boolean
	static?: boolean // se o widget é estático (não pode ser movido/redimensionado)
	nested?: WidgetLayout[] // widgets aninhados (grid dentro de grid)
}

/**
 * Layouts responsivos por breakpoint
 */
export interface ResponsiveWidgetLayouts {
	lg: WidgetLayout[] // desktop large (1200px+)
	md: WidgetLayout[] // desktop (996px+)
	sm: WidgetLayout[] // tablet (768px+)
	xs: WidgetLayout[] // mobile (480px+)
	xxs: WidgetLayout[] // mobile small (0px+)
}

/**
 * Configuração do grid
 */
export interface GridConfig {
	cols: {
		lg: number
		md: number
		sm: number
		xs: number
		xxs: number
	}
	rowHeight: number
	breakpoints: {
		lg: number
		md: number
		sm: number
		xs: number
		xxs: number
	}
	margin: [number, number] // [horizontal, vertical]
	containerPadding: [number, number]
}

/**
 * Preferências do dashboard estendidas
 */
export interface DashboardWidgetPreferences {
	// Configurações antigas (mantidas para compatibilidade)
	cardOrder: string[]
	hiddenCards: string[]
	layoutStyle: "grid" | "list" | "compact" | "custom"
	cardsPerRow: number

	// Novas configurações de widgets
	widgetLayouts: ResponsiveWidgetLayouts
	gridColumns: number
	enabledWidgets: WidgetType[]

	// Configurações de visualização
	showSummaryCard: boolean
	showMonthlyChart: boolean
	showCategoryStats: boolean
	showTopProducts: boolean
	showMarketCompare: boolean
	showRecentBuys: boolean
	showExpirationAlerts: boolean
	showReplenishment: boolean
	showSavingsCard: boolean
	showDiscountStats: boolean
	showTemporalComp: boolean
	showNutritionCard: boolean
	showPaymentStats: boolean
	showMonthlyStats: boolean

	// Personalização
	customTitle?: string
	customSubtitle?: string
}

/**
 * Props base para componentes de widget
 */
export interface WidgetProps {
	widgetId: WidgetType
	isEditing?: boolean
	onRemove?: (id: WidgetType) => void
	onConfigure?: (id: WidgetType) => void
	nested?: boolean // se o widget está dentro de outro widget
}

/**
 * Contexto de edição do dashboard
 */
export interface DashboardEditContext {
	isEditing: boolean
	setIsEditing: (editing: boolean) => void
	layouts: ResponsiveWidgetLayouts
	setLayouts: (layouts: ResponsiveWidgetLayouts) => void
	enabledWidgets: WidgetType[]
	toggleWidget: (id: WidgetType) => void
	addWidget: (id: WidgetType, position?: { x: number; y: number }) => void
	removeWidget: (id: WidgetType) => void
	saveLayouts: () => Promise<void>
	resetLayouts: () => Promise<void>
}
