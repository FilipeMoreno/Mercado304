import type { WidgetConfig, WidgetLayout, } from "@/types/dashboard-widgets"

/**
 * Configurações de todos os widgets disponíveis no dashboard
 */
export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
	"total-purchases": {
		id: "total-purchases",
		label: "Total de Compras",
		description: "Número total de compras realizadas",
		category: "stats",
		defaultSize: { w: 2, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"total-spent": {
		id: "total-spent",
		label: "Total Gasto",
		description: "Valor total gasto em compras",
		category: "stats",
		defaultSize: { w: 2, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"total-products": {
		id: "total-products",
		label: "Produtos Cadastrados",
		description: "Número de produtos no sistema",
		category: "stats",
		defaultSize: { w: 2, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"total-markets": {
		id: "total-markets",
		label: "Mercados Cadastrados",
		description: "Número de mercados cadastrados",
		category: "stats",
		defaultSize: { w: 2, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"price-records": {
		id: "price-records",
		label: "Preços Registrados",
		description: "Total de registros de preços",
		category: "stats",
		defaultSize: { w: 2, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"ai-summary": {
		id: "ai-summary",
		label: "Resumo IA",
		description: "Resumo inteligente gerado por IA",
		category: "analytics",
		defaultSize: { w: 12, h: 5, minW: 6, minH: 3, maxW: 12, maxH: 7 },
		requiresData: true,
	},
	"monthly-chart": {
		id: "monthly-chart",
		label: "Gráfico Mensal",
		description: "Gráfico de gastos mensais",
		category: "charts",
		defaultSize: { w: 12, h: 6, minW: 6, minH: 4, maxW: 12, maxH: 9 },
		requiresData: true,
	},
	"monthly-stats": {
		id: "monthly-stats",
		label: "Estatísticas Mensais",
		description: "Análise detalhada dos gastos mensais",
		category: "analytics",
		defaultSize: { w: 12, h: 6, minW: 6, minH: 4, maxW: 12, maxH: 9 },
		requiresData: true,
	},
	"category-stats": {
		id: "category-stats",
		label: "Gastos por Categoria",
		description: "Distribuição de gastos por categoria",
		category: "charts",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"top-products": {
		id: "top-products",
		label: "Produtos Mais Comprados",
		description: "Ranking de produtos frequentes",
		category: "lists",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"market-compare": {
		id: "market-compare",
		label: "Comparação de Mercados",
		description: "Estatísticas por mercado",
		category: "analytics",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"recent-purchases": {
		id: "recent-purchases",
		label: "Compras Recentes",
		description: "Últimas compras registradas",
		category: "lists",
		defaultSize: { w: 12, h: 8, minW: 6, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"expiration-alerts": {
		id: "expiration-alerts",
		label: "Alertas de Validade",
		description: "Produtos próximos ao vencimento",
		category: "alerts",
		defaultSize: { w: 6, h: 6, minW: 4, minH: 4, maxW: 12, maxH: 9 },
		requiresData: true,
	},
	"replenishment-alerts": {
		id: "replenishment-alerts",
		label: "Alertas de Reposição",
		description: "Produtos que precisam ser repostos",
		category: "alerts",
		defaultSize: { w: 6, h: 6, minW: 4, minH: 4, maxW: 12, maxH: 9 },
		requiresData: true,
	},
	"savings-card": {
		id: "savings-card",
		label: "Economias",
		description: "Análise de economias e oportunidades",
		category: "analytics",
		defaultSize: { w: 4, h: 5, minW: 3, minH: 3, maxW: 6, maxH: 6 },
		requiresData: true,
	},
	"discount-stats": {
		id: "discount-stats",
		label: "Estatísticas de Descontos",
		description: "Análise dos descontos obtidos",
		category: "analytics",
		defaultSize: { w: 12, h: 6, minW: 6, minH: 4, maxW: 12, maxH: 9 },
		requiresData: true,
	},
	"temporal-comparison": {
		id: "temporal-comparison",
		label: "Comparação Temporal",
		description: "Comparação entre períodos",
		category: "analytics",
		defaultSize: { w: 4, h: 5, minW: 3, minH: 3, maxW: 6, maxH: 6 },
		requiresData: true,
	},
	"nutrition-summary": {
		id: "nutrition-summary",
		label: "Resumo Nutricional",
		description: "Informações nutricionais dos produtos",
		category: "analytics",
		defaultSize: { w: 4, h: 5, minW: 3, minH: 3, maxW: 6, maxH: 6 },
		requiresData: true,
	},
	"payment-stats": {
		id: "payment-stats",
		label: "Métodos de Pagamento",
		description: "Estatísticas de formas de pagamento",
		category: "charts",
		defaultSize: { w: 6, h: 6, minW: 4, minH: 4, maxW: 12, maxH: 9 },
		requiresData: true,
	},
	"payment-transactions": {
		id: "payment-transactions",
		label: "Total de Transações",
		description: "Total de transações de pagamento",
		category: "stats",
		defaultSize: { w: 3, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"payment-total-amount": {
		id: "payment-total-amount",
		label: "Valor Total em Pagamentos",
		description: "Soma total de todos os pagamentos",
		category: "stats",
		defaultSize: { w: 3, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"payment-average-ticket": {
		id: "payment-average-ticket",
		label: "Ticket Médio",
		description: "Valor médio de transações",
		category: "stats",
		defaultSize: { w: 3, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"payment-most-used": {
		id: "payment-most-used",
		label: "Método Mais Usado",
		description: "Forma de pagamento mais utilizada",
		category: "stats",
		defaultSize: { w: 3, h: 3, minW: 2, minH: 2, maxW: 4, maxH: 5 },
		requiresData: true,
	},
	"payment-distribution": {
		id: "payment-distribution",
		label: "Distribuição de Pagamentos",
		description: "Distribuição por método de pagamento",
		category: "charts",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"payment-details": {
		id: "payment-details",
		label: "Detalhes de Pagamentos",
		description: "Estatísticas detalhadas por método",
		category: "analytics",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"payment-insights": {
		id: "payment-insights",
		label: "Insights de Pagamentos",
		description: "Análises e insights sobre pagamentos",
		category: "analytics",
		defaultSize: { w: 12, h: 5, minW: 6, minH: 3, maxW: 12, maxH: 7 },
		requiresData: true,
	},
	"install-pwa": {
		id: "install-pwa",
		label: "Instalar App",
		description: "Instalar aplicativo PWA",
		category: "tools",
		defaultSize: { w: 12, h: 3, minW: 6, minH: 2, maxW: 12, maxH: 5 },
		requiresData: false,
	},
	"quote-overview": {
		id: "quote-overview",
		label: "Visão Geral de Cotações",
		description: "Resumo das cotações de compras",
		category: "stats",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"quote-trend": {
		id: "quote-trend",
		label: "Tendência de Cotações",
		description: "Evolução das cotações nos últimos meses",
		category: "charts",
		defaultSize: { w: 12, h: 8, minW: 6, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"quote-by-market": {
		id: "quote-by-market",
		label: "Cotações por Mercado",
		description: "Distribuição de cotações entre mercados",
		category: "charts",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"quote-top-quotes": {
		id: "quote-top-quotes",
		label: "Maiores Cotações",
		description: "Top 5 cotações por valor",
		category: "lists",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"quote-savings": {
		id: "quote-savings",
		label: "Economia em Cotações",
		description: "Análise de descontos e economia",
		category: "analytics",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"quote-by-type": {
		id: "quote-by-type",
		label: "Cotações por Tipo",
		description: "Distribuição de cotações por tipo (Itens, Categoria, Mercado)",
		category: "charts",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"budget-overview": {
		id: "budget-overview",
		label: "Visão Geral de Orçamentos",
		description: "Resumo dos orçamentos e gastos",
		category: "stats",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"budget-alerts": {
		id: "budget-alerts",
		label: "Alertas de Orçamento",
		description: "Orçamentos próximos ou acima do limite",
		category: "alerts",
		defaultSize: { w: 6, h: 8, minW: 4, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
	"budget-progress": {
		id: "budget-progress",
		label: "Progresso dos Orçamentos",
		description: "Acompanhamento do progresso de todos os orçamentos",
		category: "charts",
		defaultSize: { w: 12, h: 8, minW: 6, minH: 5, maxW: 12, maxH: 12 },
		requiresData: true,
	},
}

/**
 * Layout padrão para desktop (lg)
 */
export const DEFAULT_LAYOUT_LG: WidgetLayout[] = [
	{ i: "total-purchases", x: 0, y: 0, w: 2, h: 8 },
	{ i: "total-spent", x: 2, y: 0, w: 2, h: 8 },
	{ i: "total-products", x: 4, y: 0, w: 2, h: 8 },
	{ i: "total-markets", x: 6, y: 0, w: 2, h: 8 },
	{ i: "price-records", x: 8, y: 0, w: 2, h: 8 },
	{ i: "ai-summary", x: 0, y: 3, w: 12, h: 8 },
	{ i: "install-pwa", x: 0, y: 8, w: 12, h: 8 },
	{ i: "monthly-chart", x: 0, y: 11, w: 12, h: 6 },
	{ i: "monthly-stats", x: 0, y: 17, w: 12, h: 6 },
	{ i: "savings-card", x: 0, y: 23, w: 4, h: 8 },
	{ i: "temporal-comparison", x: 4, y: 23, w: 4, h: 8 },
	{ i: "nutrition-summary", x: 8, y: 23, w: 4, h: 8 },
	{ i: "discount-stats", x: 0, y: 28, w: 12, h: 6 },
	{ i: "payment-stats", x: 0, y: 34, w: 6, h: 6 },
	{ i: "category-stats", x: 6, y: 34, w: 6, h: 8 },
	{ i: "top-products", x: 0, y: 42, w: 6, h: 8 },
	{ i: "market-compare", x: 6, y: 42, w: 6, h: 8 },
	{ i: "recent-purchases", x: 0, y: 50, w: 12, h: 8 },
	{ i: "expiration-alerts", x: 0, y: 58, w: 6, h: 6 },
	{ i: "replenishment-alerts", x: 6, y: 58, w: 6, h: 6 },
	{ i: "quote-overview", x: 0, y: 64, w: 6, h: 8 },
	{ i: "quote-savings", x: 6, y: 64, w: 6, h: 8 },
	{ i: "quote-trend", x: 0, y: 72, w: 12, h: 8 },
	{ i: "quote-by-market", x: 0, y: 80, w: 6, h: 8 },
	{ i: "quote-top-quotes", x: 6, y: 80, w: 6, h: 8 },
]

/**
 * Layout padrão para tablet (md)
 */
export const DEFAULT_LAYOUT_MD: WidgetLayout[] = [
	{ i: "total-purchases", x: 0, y: 0, w: 2, h: 8 },
	{ i: "total-spent", x: 2, y: 0, w: 2, h: 8 },
	{ i: "total-products", x: 4, y: 0, w: 2, h: 8 },
	{ i: "total-markets", x: 6, y: 0, w: 2, h: 8 },
	{ i: "price-records", x: 8, y: 0, w: 2, h: 8 },
	{ i: "ai-summary", x: 0, y: 2, w: 10, h: 8 },
	{ i: "install-pwa", x: 0, y: 5, w: 10, h: 8 },
	{ i: "monthly-chart", x: 0, y: 7, w: 10, h: 6 },
	{ i: "monthly-stats", x: 0, y: 11, w: 10, h: 6 },
	{ i: "savings-card", x: 0, y: 15, w: 5, h: 8 },
	{ i: "temporal-comparison", x: 5, y: 15, w: 5, h: 8 },
	{ i: "nutrition-summary", x: 0, y: 18, w: 5, h: 8 },
	{ i: "discount-stats", x: 0, y: 21, w: 10, h: 6 },
	{ i: "payment-stats", x: 0, y: 25, w: 10, h: 6 },
	{ i: "category-stats", x: 0, y: 29, w: 10, h: 8 },
	{ i: "top-products", x: 0, y: 34, w: 10, h: 8 },
	{ i: "market-compare", x: 0, y: 39, w: 10, h: 8 },
	{ i: "recent-purchases", x: 0, y: 44, w: 10, h: 8 },
	{ i: "expiration-alerts", x: 0, y: 49, w: 10, h: 6 },
	{ i: "replenishment-alerts", x: 0, y: 53, w: 10, h: 6 },
]

/**
 * Layout padrão para mobile (sm)
 */
export const DEFAULT_LAYOUT_SM: WidgetLayout[] = [
	{ i: "total-purchases", x: 0, y: 0, w: 3, h: 8 },
	{ i: "total-spent", x: 3, y: 0, w: 3, h: 8 },
	{ i: "total-products", x: 0, y: 2, w: 3, h: 8 },
	{ i: "total-markets", x: 3, y: 2, w: 3, h: 8 },
	{ i: "price-records", x: 0, y: 4, w: 3, h: 8 },
	{ i: "ai-summary", x: 0, y: 6, w: 6, h: 8 },
	{ i: "install-pwa", x: 0, y: 9, w: 6, h: 8 },
	{ i: "monthly-chart", x: 0, y: 11, w: 6, h: 6 },
	{ i: "monthly-stats", x: 0, y: 15, w: 6, h: 6 },
	{ i: "savings-card", x: 0, y: 19, w: 6, h: 8 },
	{ i: "temporal-comparison", x: 0, y: 22, w: 6, h: 8 },
	{ i: "nutrition-summary", x: 0, y: 25, w: 6, h: 8 },
	{ i: "discount-stats", x: 0, y: 28, w: 6, h: 6 },
	{ i: "payment-stats", x: 0, y: 32, w: 6, h: 6 },
	{ i: "category-stats", x: 0, y: 36, w: 6, h: 8 },
	{ i: "top-products", x: 0, y: 41, w: 6, h: 8 },
	{ i: "market-compare", x: 0, y: 46, w: 6, h: 8 },
	{ i: "recent-purchases", x: 0, y: 51, w: 6, h: 8 },
	{ i: "expiration-alerts", x: 0, y: 56, w: 6, h: 6 },
	{ i: "replenishment-alerts", x: 0, y: 60, w: 6, h: 6 },
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
	rowHeight: 40, // Reduzido de 60 para 40 para ajustes mais refinados
	breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
	margin: [12, 12] as [number, number], // Reduzido de 16 para 12
	containerPadding: [0, 0] as [number, number],
}

/**
 * Widgets habilitados por padrão
 */
export const DEFAULT_ENABLED_WIDGETS = Object.keys(WIDGET_CONFIGS)
