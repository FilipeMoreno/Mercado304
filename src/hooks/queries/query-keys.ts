"use client"
// Query Keys centralizados para evitar duplicação

export const queryKeys = {
  categories: (params?: URLSearchParams) => ["categories", params?.toString()],
  allCategories: () => ["categories", "all"],
  brands: (params?: URLSearchParams) => ["brands", params?.toString()],
  allBrands: () => ["brands", "all"],
  markets: (params?: URLSearchParams) => ["markets", params?.toString()],
  marketStats: (id: string) => ["markets", id, "stats"],
  products: (params?: URLSearchParams) => ["products", params?.toString()],
  product: (id: string) => ["products", id],
  productDetails: (id: string) => ["products", id, "details"],
  productNutritionalInfo: (id: string) => ["products", id, "nutritional-info"],
  purchases: (params?: URLSearchParams) => ["purchases", params?.toString()],
  purchase: (id: string) => ["purchases", id],
  shoppingLists: (params?: URLSearchParams) => ["shopping-lists", params?.toString()],
  shoppingList: (id: string) => ["shopping-lists", id],
  stock: (params?: URLSearchParams) => ["stock", params?.toString()],
  stockItem: (id: string) => ["stock", id],
  stockHistory: (params?: URLSearchParams) => ["stock-history", params?.toString()],
  waste: (params?: URLSearchParams) => ["waste", params?.toString()],
  wasteItem: (id: string) => ["waste", id],
  recipes: () => ["recipes"],
  recipe: (id: string) => ["recipes", id],
  dashboard: {
    stats: () => ["dashboard", "stats"],
    aiSummary: () => ["dashboard", "ai-summary"],
    paymentStats: () => ["dashboard", "payment-stats"],
    preferences: () => ["dashboard", "preferences"],
  },
  expiration: {
    alerts: () => ["expiration", "alerts"],
  },
  nutrition: {
    analysis: () => ["nutrition", "analysis"],
  },
  productKits: {
    all: (params?: URLSearchParams) => ["product-kits", params?.toString()],
    detail: (id: string) => ["product-kits", id],
    nutrition: (id: string) => ["product-kits", id, "nutrition"],
    stock: (id: string) => ["product-kits", id, "stock"],
    price: (id: string, marketId?: string) => ["product-kits", id, "price", marketId],
  },
  budgets: (params?: URLSearchParams) => ["budgets", params?.toString()],
  budget: (id: string) => ["budgets", id],
  budgetComparison: (ids: string[]) => ["budgets", "compare", ids.sort().join(",")],
  budgetStats: () => ["budgets", "stats"],
  quotes: (params?: URLSearchParams) => ["quotes", params?.toString()],
  quote: (id: string) => ["quotes", id],
  quoteComparison: (quoteIds: string[]) => ["quotes", "compare", ...quoteIds],
  quoteStats: () => ["quotes", "stats"],
  productAnalytics: {
    recentPurchases: (productId: string) => ["products", productId, "recent-purchases"],
    bestDayToBuy: (productId: string) => ["products", productId, "best-day-to-buy"],
    bestDayAiAnalysis: (productId: string) => ["products", productId, "best-day-ai-analysis"],
    wasteUsage: (productId: string) => ["products", productId, "waste-usage"],
    relatedProducts: (productId: string) => ["products", productId, "related"],
  },
  priceAnalysis: (params?: URLSearchParams) => ["prices", "analysis", params?.toString()],
  nutritionSummary: (period?: string) => ["nutrition", "summary", period],
} as const

export type QueryKeys = typeof queryKeys


