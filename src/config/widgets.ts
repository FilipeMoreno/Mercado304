import type { WidgetConfig, WidgetLayout, WidgetType } from "@/types/dashboard-widgets"

/**
 * Configurações de todos os widgets disponíveis no dashboard
 */
export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
	"total-purchases": {
		id: "total-purchases",
		label: "Total de Compras",
		description: "Número total de compras realizadas",
		category: "stats",
		defaultSize: { w: 2, h: 2, minW: 2, minH: 2, maxW: 4, maxH: 3 },
		requiresData: true,
	},
	"total-spent": {
		id: "total-spent",
		label: "Total Gasto",
		description: "Valor total gasto em compras",
		category: "stats",
		defaultSize: { w: 2, h: 2, minW: 2, minH: 2, maxW: 4, maxH: 3 },
		requiresData: true,
	},
	"total-products": {
		id: "total-products",
		label: "Produtos Cadastrados",
		description: "Número de produtos no sistema",
		category: "stats",
		defaultSize: { w: 2, h: 2, minW: 2, minH: 2, maxW: 4, maxH: 3 },
		requiresData: true,
	},
	"total-markets": {
		id: "total-markets",
		label: "Mercados Cadastrados",
		description: "Número de mercados cadastrados",
		category: "stats",
		defaultSize: { w: 2, h: 2, minW: 2, minH: 2, maxW: 4, maxH: 3 },
		requiresData: true,
	},
	"price-records": {
		id: "price-records",
		label: "Preços Registrados",
		description: "Total de registros de preços",
		category: "stats",
		defaultSize: { w: 2, h: 2, minW: 2, minH: 2, maxW: 4, maxH: 3 },
		requiresData: true,
	},
	"ai-summary": {
		id: "ai-summary",
		label: "Resumo IA",
		description: "Resumo inteligente gerado por IA",
		category: "analytics",
		defaultSize: { w: 12, h: 3, minW: 6, minH: 2, maxW: 12, maxH: 5 },
		requiresData: true,
	},
	"monthly-chart": {
		id: "monthly-chart",
		label: "Gráfico Mensal",
		description: "Gráfico de gastos mensais",
		category: "charts",
		defaultSize: { w: 12, h: 4, minW: 6, minH: 3, maxW: 12, maxH: 6 },
		requiresData: true,
	},
	"monthly-stats": {
		id: "monthly-stats",
		label: "Estatísticas Mensais",
		description: "Análise detalhada dos gastos mensais",
		category: "analytics",
		defaultSize: { w: 12, h: 4, minW: 6, minH: 3, maxW: 12, maxH: 6 },
		requiresData: true,
	},
	"category-stats": {
		id: "category-stats",
		label: "Gastos por Categoria",
		description: "Distribuição de gastos por categoria",
		category: "charts",
		defaultSize: { w: 6, h: 5, minW: 4, minH: 4, maxW: 12, maxH: 8 },
		requiresData: true,
	},
	"top-products": {
		id: "top-products",
		label: "Produtos Mais Comprados",
		description: "Ranking de produtos frequentes",
		category: "lists",
		defaultSize: { w: 6, h: 5, minW: 4, minH: 4, maxW: 12, maxH: 8 },
		requiresData: true,
	},
	"market-compare": {
		id: "market-compare",
		label: "Comparação de Mercados",
		description: "Estatísticas por mercado",
		category: "analytics",
		defaultSize: { w: 6, h: 5, minW: 4, minH: 4, maxW: 12, maxH: 8 },
		requiresData: true,
	},
	"recent-purchases": {
		id: "recent-purchases",
		label: "Compras Recentes",
		description: "Últimas compras registradas",
		category: "lists",
		defaultSize: { w: 12, h: 5, minW: 6, minH: 4, maxW: 12, maxH: 8 },
		requiresData: true,
	},
	"expiration-alerts": {
		id: "expiration-alerts",
		label: "Alertas de Validade",
		description: "Produtos próximos ao vencimento",
		category: "alerts",
		defaultSize: { w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6 },
		requiresData: true,
	},
	"replenishment-alerts": {
		id: "replenishment-alerts",
		label: "Alertas de Reposição",
		description: "Produtos que precisam ser repostos",
		category: "alerts",
		defaultSize: { w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6 },
		requiresData: true,
	},
	"savings-card": {
		id: "savings-card",
		label: "Economias",
		description: "Análise de economias e oportunidades",
		category: "analytics",
		defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 4 },
		requiresData: true,
	},
	"discount-stats": {
		id: "discount-stats",
		label: "Estatísticas de Descontos",
		description: "Análise dos descontos obtidos",
		category: "analytics",
		defaultSize: { w: 12, h: 4, minW: 6, minH: 3, maxW: 12, maxH: 6 },
		requiresData: true,
	},
	"temporal-comparison": {
		id: "temporal-comparison",
		label: "Comparação Temporal",
		description: "Comparação entre períodos",
		category: "analytics",
		defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 4 },
		requiresData: true,
	},
	"nutrition-summary": {
		id: "nutrition-summary",
		label: "Resumo Nutricional",
		description: "Informações nutricionais dos produtos",
		category: "analytics",
		defaultSize: { w: 4, h: 3, minW: 3, minH: 2, maxW: 6, maxH: 4 },
		requiresData: true,
	},
	"payment-stats": {
		id: "payment-stats",
		label: "Métodos de Pagamento",
		description: "Estatísticas de formas de pagamento",
		category: "charts",
		defaultSize: { w: 6, h: 4, minW: 4, minH: 3, maxW: 12, maxH: 6 },
		requiresData: true,
	},
	"install-pwa": {
		id: "install-pwa",
		label: "Instalar App",
		description: "Instalar aplicativo PWA",
		category: "tools",
		defaultSize: { w: 12, h: 2, minW: 6, minH: 2, maxW: 12, maxH: 3 },
		requiresData: false,
	},
}

/**
 * Layout padrão para desktop (lg)
 */
export const DEFAULT_LAYOUT_LG: WidgetLayout[] = [
	{ i: "total-purchases", x: 0, y: 0, w: 2, h: 2 },
	{ i: "total-spent", x: 2, y: 0, w: 2, h: 2 },
	{ i: "total-products", x: 4, y: 0, w: 2, h: 2 },
	{ i: "total-markets", x: 6, y: 0, w: 2, h: 2 },
	{ i: "price-records", x: 8, y: 0, w: 2, h: 2 },
	{ i: "ai-summary", x: 0, y: 2, w: 12, h: 3 },
	{ i: "install-pwa", x: 0, y: 5, w: 12, h: 2 },
	{ i: "monthly-chart", x: 0, y: 7, w: 12, h: 4 },
	{ i: "monthly-stats", x: 0, y: 11, w: 12, h: 4 },
	{ i: "savings-card", x: 0, y: 15, w: 4, h: 3 },
	{ i: "temporal-comparison", x: 4, y: 15, w: 4, h: 3 },
	{ i: "nutrition-summary", x: 8, y: 15, w: 4, h: 3 },
	{ i: "discount-stats", x: 0, y: 18, w: 12, h: 4 },
	{ i: "payment-stats", x: 0, y: 22, w: 6, h: 4 },
	{ i: "category-stats", x: 6, y: 22, w: 6, h: 5 },
	{ i: "top-products", x: 0, y: 27, w: 6, h: 5 },
	{ i: "market-compare", x: 6, y: 27, w: 6, h: 5 },
	{ i: "recent-purchases", x: 0, y: 32, w: 12, h: 5 },
	{ i: "expiration-alerts", x: 0, y: 37, w: 6, h: 4 },
	{ i: "replenishment-alerts", x: 6, y: 37, w: 6, h: 4 },
]

/**
 * Layout padrão para tablet (md)
 */
export const DEFAULT_LAYOUT_MD: WidgetLayout[] = [
	{ i: "total-purchases", x: 0, y: 0, w: 2, h: 2 },
	{ i: "total-spent", x: 2, y: 0, w: 2, h: 2 },
	{ i: "total-products", x: 4, y: 0, w: 2, h: 2 },
	{ i: "total-markets", x: 6, y: 0, w: 2, h: 2 },
	{ i: "price-records", x: 8, y: 0, w: 2, h: 2 },
	{ i: "ai-summary", x: 0, y: 2, w: 10, h: 3 },
	{ i: "install-pwa", x: 0, y: 5, w: 10, h: 2 },
	{ i: "monthly-chart", x: 0, y: 7, w: 10, h: 4 },
	{ i: "monthly-stats", x: 0, y: 11, w: 10, h: 4 },
	{ i: "savings-card", x: 0, y: 15, w: 5, h: 3 },
	{ i: "temporal-comparison", x: 5, y: 15, w: 5, h: 3 },
	{ i: "nutrition-summary", x: 0, y: 18, w: 5, h: 3 },
	{ i: "discount-stats", x: 0, y: 21, w: 10, h: 4 },
	{ i: "payment-stats", x: 0, y: 25, w: 10, h: 4 },
	{ i: "category-stats", x: 0, y: 29, w: 10, h: 5 },
	{ i: "top-products", x: 0, y: 34, w: 10, h: 5 },
	{ i: "market-compare", x: 0, y: 39, w: 10, h: 5 },
	{ i: "recent-purchases", x: 0, y: 44, w: 10, h: 5 },
	{ i: "expiration-alerts", x: 0, y: 49, w: 10, h: 4 },
	{ i: "replenishment-alerts", x: 0, y: 53, w: 10, h: 4 },
]

/**
 * Layout padrão para mobile (sm)
 */
export const DEFAULT_LAYOUT_SM: WidgetLayout[] = [
	{ i: "total-purchases", x: 0, y: 0, w: 3, h: 2 },
	{ i: "total-spent", x: 3, y: 0, w: 3, h: 2 },
	{ i: "total-products", x: 0, y: 2, w: 3, h: 2 },
	{ i: "total-markets", x: 3, y: 2, w: 3, h: 2 },
	{ i: "price-records", x: 0, y: 4, w: 3, h: 2 },
	{ i: "ai-summary", x: 0, y: 6, w: 6, h: 3 },
	{ i: "install-pwa", x: 0, y: 9, w: 6, h: 2 },
	{ i: "monthly-chart", x: 0, y: 11, w: 6, h: 4 },
	{ i: "monthly-stats", x: 0, y: 15, w: 6, h: 4 },
	{ i: "savings-card", x: 0, y: 19, w: 6, h: 3 },
	{ i: "temporal-comparison", x: 0, y: 22, w: 6, h: 3 },
	{ i: "nutrition-summary", x: 0, y: 25, w: 6, h: 3 },
	{ i: "discount-stats", x: 0, y: 28, w: 6, h: 4 },
	{ i: "payment-stats", x: 0, y: 32, w: 6, h: 4 },
	{ i: "category-stats", x: 0, y: 36, w: 6, h: 5 },
	{ i: "top-products", x: 0, y: 41, w: 6, h: 5 },
	{ i: "market-compare", x: 0, y: 46, w: 6, h: 5 },
	{ i: "recent-purchases", x: 0, y: 51, w: 6, h: 5 },
	{ i: "expiration-alerts", x: 0, y: 56, w: 6, h: 4 },
	{ i: "replenishment-alerts", x: 0, y: 60, w: 6, h: 4 },
]

/**
 * Layout padrão para mobile pequeno (xs e xxs)
 */
export const DEFAULT_LAYOUT_XS: WidgetLayout[] = DEFAULT_LAYOUT_SM.map((item) => ({
	...item,
	w: Math.min(item.w, 4),
}))

/**
 * Configuração do grid responsivo
 */
export const GRID_CONFIG = {
	cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
	rowHeight: 60,
	breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
	margin: [16, 16] as [number, number],
	containerPadding: [0, 0] as [number, number],
}

/**
 * Widgets habilitados por padrão
 */
export const DEFAULT_ENABLED_WIDGETS = Object.keys(WIDGET_CONFIGS)
