// src/hooks/use-react-query.ts
"use client"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
// Types
import type { Brand, Budget, Category, Market, Product, ShoppingList } from "@/types"

// Query Keys
export const queryKeys = {
	categories: (params?: URLSearchParams) => ["categories", params?.toString()],
	allCategories: () => ["categories", "all"],
	brands: (params?: URLSearchParams) => ["brands", params?.toString()],
	allBrands: () => ["brands", "all"],
	markets: (params?: URLSearchParams) => ["markets", params?.toString()],
	products: (params?: URLSearchParams) => ["products", params?.toString()],
	product: (id: string) => ["products", id],
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
	// Quotes (novo)
	quotes: (params?: URLSearchParams) => ["quotes", params?.toString()],
	quote: (id: string) => ["quotes", id],
	quoteComparison: (quoteIds: string[]) => ["quotes", "compare", ...quoteIds],
	quoteStats: () => ["quotes", "stats"],
} as const

// API Functions
const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
	const response = await fetch(url, options)
	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(errorData.error || `Erro ao buscar dados: ${response.status}`)
	}
	return response.json()
}

// Categories
export const useCategoriesQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.categories(params),
		queryFn: () => fetchWithErrorHandling(`/api/categories?${params?.toString() || ""}`),
		staleTime: 0, // Sempre refetch quando invalidado
	})
}

export const useCategoryQuery = (id: string) => {
	return useQuery({
		queryKey: ["categories", id],
		queryFn: () => fetchWithErrorHandling(`/api/categories/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useAllCategoriesQuery = () => {
	return useQuery({
		queryKey: queryKeys.allCategories(),
		queryFn: () => fetchWithErrorHandling("/api/categories/all"),
		staleTime: 5 * 60 * 1000,
	})
}

export const useCreateCategoryMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Omit<Category, "id" | "createdAt" | "updatedAt">) =>
			fetchWithErrorHandling("/api/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (newCategory: Category) => {
			// Invalida todas as queries de categories (incluindo infinite queries)
			await queryClient.invalidateQueries({
				queryKey: ["categories"],
				exact: false, // Isso invalida ["categories", "infinite", ...] também
			})

			// Aguarda refetch de todas as queries de categories
			await queryClient.refetchQueries({
				queryKey: ["categories"],
				exact: false,
			})

			toast.success("Categoria criada com sucesso!")

			// Retorna a nova categoria para ser usada no onSuccess do componente
			return newCategory
		},
		onError: (error) => {
			toast.error(`Erro ao criar categoria: ${error.message}`)
		},
	})
}

export const useUpdateCategoryMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
			fetchWithErrorHandling(`/api/categories/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.allCategories() })
			queryClient.invalidateQueries({ queryKey: ["products"] })
			toast.success("Categoria atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar categoria: ${error.message}`)
		},
	})
}

export const useDeleteCategoryMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, transferData }: { id: string; transferData?: any }) =>
			fetchWithErrorHandling(`/api/categories/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ transferData }),
			}),
		onSuccess: (data: { message?: string }) => {
			queryClient.invalidateQueries({ queryKey: ["categories"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.allCategories() })
			queryClient.invalidateQueries({ queryKey: ["products"] })
			toast.success(data.message || "Categoria excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir categoria: ${error.message}`)
		},
	})
}

// Brands
export const useBrandsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.brands(params),
		queryFn: () => fetchWithErrorHandling(`/api/brands?${params?.toString() || ""}`),
		staleTime: 0, // Sempre refetch quando invalidado
	})
}

export const useBrandQuery = (id: string) => {
	return useQuery({
		queryKey: ["brands", id],
		queryFn: () => fetchWithErrorHandling(`/api/brands/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useAllBrandsQuery = () => {
	return useQuery({
		queryKey: queryKeys.allBrands(),
		// CORREÇÃO: A rota correta agora é /api/brands/all
		queryFn: () => fetchWithErrorHandling("/api/brands/all"),
		staleTime: 5 * 60 * 1000,
	})
}

export const useCreateBrandMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Omit<Brand, "id" | "createdAt" | "updatedAt">) =>
			fetchWithErrorHandling("/api/brands", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (newBrand: Brand) => {
			console.log("[useCreateBrandMutation] Brand created, invalidating queries...")

			// Invalida todas as queries de brands (incluindo infinite queries)
			await queryClient.invalidateQueries({
				queryKey: ["brands"],
				exact: false, // Isso invalida ["brands", "infinite", ...] também
			})

			console.log("[useCreateBrandMutation] Queries invalidated, refetching...")

			// Aguarda refetch de todas as queries de brands
			await queryClient.refetchQueries({
				queryKey: ["brands"],
				exact: false,
			})

			console.log("[useCreateBrandMutation] Refetch completed")

			toast.success("Marca criada com sucesso!")

			// Retorna a nova marca para ser usada no onSuccess do componente
			return newBrand
		},
		onError: (error) => {
			toast.error(`Erro ao criar marca: ${error.message}`)
		},
	})
}

export const useUpdateBrandMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Brand> }) =>
			fetchWithErrorHandling(`/api/brands/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["brands"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.allBrands() })
			queryClient.invalidateQueries({ queryKey: ["products"] })
			toast.success("Marca atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar marca: ${error.message}`)
		},
	})
}

export const useDeleteBrandMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/brands/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["brands"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.allBrands() })
			queryClient.invalidateQueries({ queryKey: ["products"] })
			toast.success("Marca excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir marca: ${error.message}`)
		},
	})
}

// Markets
export const useMarketsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.markets(params),
		queryFn: () => fetchWithErrorHandling(`/api/markets?${params?.toString() || ""}`),
		staleTime: 0, // Sempre refetch quando invalidado
	})
}

export const useMarketQuery = (id: string) => {
	return useQuery({
		queryKey: ["markets", id],
		queryFn: () => fetchWithErrorHandling(`/api/markets/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateMarketMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Omit<Market, "id" | "createdAt" | "updatedAt">) =>
			fetchWithErrorHandling("/api/markets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async (newMarket: Market) => {
			// Invalida todas as queries de markets (incluindo infinite queries se houver)
			await queryClient.invalidateQueries({
				queryKey: ["markets"],
				exact: false,
			})

			// Aguarda refetch de todas as queries de markets
			await queryClient.refetchQueries({
				queryKey: ["markets"],
				exact: false,
			})

			toast.success("Mercado criado com sucesso!")

			// Retorna o novo mercado para ser usado no onSuccess do componente
			return newMarket
		},
		onError: (error) => {
			toast.error(`Erro ao criar mercado: ${error.message}`)
		},
	})
}

export const useUpdateMarketMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Market> }) =>
			fetchWithErrorHandling(`/api/markets/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, variables) => {
			// Invalidar a query do mercado específico
			queryClient.invalidateQueries({ queryKey: ["market", variables.id] })
			// Invalidar a lista de mercados
			queryClient.invalidateQueries({ queryKey: ["markets"] })
			// Invalidar estatísticas do dashboard
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Mercado atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar mercado: ${error.message}`)
		},
	})
}

export const useDeleteMarketMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/markets/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["markets"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Mercado excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir mercado: ${error.message}`)
		},
	})
}

// Products
export const useProductsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.products(params),
		queryFn: () => fetchWithErrorHandling(`/api/products?${params?.toString() || ""}`),
		staleTime: 0, // Sempre refetch quando invalidado
	})
}

export const useProductQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.product(id),
		queryFn: () => fetchWithErrorHandling(`/api/products/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useAllProductsQuery = (options?: { excludeKits?: boolean }) => {
	const { excludeKits = false } = options || {}

	return useQuery({
		queryKey: ["products", "all", { excludeKits }],
		queryFn: () => {
			const params = new URLSearchParams()
			if (excludeKits) params.set("excludeKits", "true")
			return fetchWithErrorHandling(`/api/products/all?${params.toString()}`)
		},
		staleTime: 2 * 60 * 1000, // 2 minutos
		gcTime: 5 * 60 * 1000, // 5 minutos
	})
}

export const useAllMarketsQuery = () => {
	return useQuery({
		queryKey: ["markets", "all"],
		queryFn: () => fetchWithErrorHandling("/api/markets"),
		staleTime: 5 * 60 * 1000, // 5 minutos - mercados não mudam com frequência
		gcTime: 10 * 60 * 1000, // 10 minutos
	})
}

export const useCreateProductMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Omit<Product, "id" | "createdAt" | "updatedAt" | "barcodes"> & { barcodes?: string[] }) =>
			fetchWithErrorHandling("/api/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			toast.success("Produto criado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar produto: ${error.message}`)
		},
	})
}

export const useUpdateProductMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
			fetchWithErrorHandling(`/api/products/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["products"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.product(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			toast.success("Produto atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar produto: ${error.message}`)
		},
	})
}

export const useDeleteProductMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/products/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["purchases"] })
			toast.success("Produto excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir produto: ${error.message}`)
		},
	})
}

// Purchases
export const usePurchasesQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.purchases(params),
		queryFn: () => fetchWithErrorHandling(`/api/purchases?${params?.toString() || ""}`),
		staleTime: 0, // Sempre refetch quando invalidado
	})
}

export const usePurchaseQuery = (id: string, options?: { enabled: boolean }) => {
	return useQuery({
		queryKey: queryKeys.purchase(id),
		queryFn: () => fetchWithErrorHandling(`/api/purchases/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: options?.enabled ?? !!id,
	})
}

export const useCreatePurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/purchases", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["purchases"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			toast.success("Compra registrada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao registrar compra: ${error.message}`)
		},
	})
}

export const useUpdatePurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/purchases/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["purchases"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.purchase(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Compra atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar compra: ${error.message}`)
		},
	})
}

export const useDeletePurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/purchases/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["purchases"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Compra excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir compra: ${error.message}`)
		},
	})
}

// Stock
export const useStockQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.stock(params),
		queryFn: () => fetchWithErrorHandling(`/api/stock?${params?.toString() || ""}`),
		staleTime: 1 * 60 * 1000,
	})
}

export const useStockItemQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.stockItem(id),
		queryFn: () => fetchWithErrorHandling(`/api/stock/${id}`),
		staleTime: 1 * 60 * 1000,
		enabled: !!id,
	})
}

export const useStockHistoryQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.stockHistory(params),
		queryFn: () => fetchWithErrorHandling(`/api/stock/history?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000, // 2 minutes
	})
}

export const useCreateStockMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/stock", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockHistory() })
			queryClient.invalidateQueries({
				queryKey: queryKeys.expiration.alerts(),
			})
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			// Invalidate all stock-related queries
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["stock-history"] })
			toast.success("Item adicionado ao estoque!")
		},
		onError: (error) => {
			toast.error(`Erro ao adicionar item ao estoque: ${error.message}`)
		},
	})
}

export const useUpdateStockMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/stock/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockItem(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockHistory() })
			queryClient.invalidateQueries({
				queryKey: queryKeys.expiration.alerts(),
			})
			// Invalidate all stock-related queries
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["stock-history"] })
			toast.success("Estoque atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar estoque: ${error.message}`)
		},
	})
}

export const useDeleteStockMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/stock/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockHistory() })
			queryClient.invalidateQueries({
				queryKey: queryKeys.expiration.alerts(),
			})
			// Invalidate all stock-related queries
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["stock-history"] })
			toast.success("Item removido do estoque!")
		},
		onError: (error) => {
			toast.error(`Erro ao remover item do estoque: ${error.message}`)
		},
	})
}

export const useResetStockMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () =>
			fetchWithErrorHandling("/api/stock/reset", {
				method: "DELETE",
			}),
		onSuccess: (data: { message: string; deletedCount: number }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockHistory() })
			queryClient.invalidateQueries({
				queryKey: queryKeys.expiration.alerts(),
			})
			// Invalidate all stock-related queries
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["stock-history"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success(data.message || "Estoque resetado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao resetar estoque: ${error.message}`)
		},
	})
}

// Waste Management
export const useWasteQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.waste(params),
		queryFn: () => fetchWithErrorHandling(`/api/waste?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000,
	})
}

export const useWasteItemQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.wasteItem(id),
		queryFn: () => fetchWithErrorHandling(`/api/waste/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateWasteMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/waste", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.waste() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockHistory() })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			// Invalidate all waste and stock-related queries
			queryClient.invalidateQueries({ queryKey: ["waste"] })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["stock-history"] })
			toast.success("Desperdício registrado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao registrar desperdício: ${error.message}`)
		},
	})
}

export const useUpdateWasteMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/waste/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["waste"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.wasteItem(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			toast.success("Desperdício atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar desperdício: ${error.message}`)
		},
	})
}

export const useDeleteWasteMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/waste/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.waste() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockHistory() })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			// Invalidate all waste and stock-related queries
			queryClient.invalidateQueries({ queryKey: ["waste"] })
			queryClient.invalidateQueries({ queryKey: ["stock"] })
			queryClient.invalidateQueries({ queryKey: ["stock-history"] })
			toast.success("Desperdício excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir desperdício: ${error.message}`)
		},
	})
}

// Recipes
export const useRecipesQuery = () => {
	return useQuery({
		queryKey: queryKeys.recipes(),
		queryFn: () => fetchWithErrorHandling("/api/recipes"),
		staleTime: 5 * 60 * 1000,
	})
}

export const useRecipeQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.recipe(id),
		queryFn: () => fetchWithErrorHandling(`/api/recipes/${id}`),
		staleTime: 5 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateRecipeMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/recipes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.recipes() })
			toast.success("Receita salva com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao salvar receita: ${error.message}`)
		},
	})
}

export const useDeleteRecipeMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/recipes/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.recipes() })
			toast.success("Receita excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir receita: ${error.message}`)
		},
	})
}

// Dashboard
export const useDashboardStatsQuery = () => {
	return useQuery({
		queryKey: queryKeys.dashboard.stats(),
		queryFn: () => fetchWithErrorHandling("/api/dashboard/stats"),
		staleTime: 5 * 60 * 1000, // 5 minutos - dados não mudam com frequência
		gcTime: 10 * 60 * 1000, // 10 minutos - mantém em cache
	})
}

export const useDashboardAISummaryQuery = () => {
	return useQuery({
		queryKey: queryKeys.dashboard.aiSummary(),
		queryFn: () => fetchWithErrorHandling("/api/dashboard/ai-summary"),
		staleTime: 5 * 60 * 1000,
	})
}

export const usePaymentStatsQuery = () => {
	return useQuery({
		queryKey: queryKeys.dashboard.paymentStats(),
		queryFn: () => fetchWithErrorHandling("/api/dashboard/payment-stats"),
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	})
}

// Expiration Alerts
export const useExpirationAlertsQuery = () => {
	return useQuery({
		queryKey: queryKeys.expiration.alerts(),
		queryFn: () => fetchWithErrorHandling("/api/stock/expiration-alerts"),
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	})
}

// Nutrition Analysis
export const useNutritionAnalysisQuery = () => {
	return useQuery({
		queryKey: queryKeys.nutrition.analysis(),
		queryFn: () => fetchWithErrorHandling("/api/nutrition/analysis"),
		staleTime: 5 * 60 * 1000,
	})
}

// Additional Dashboard Queries
export const useSavingsQuery = () => {
	return useQuery({
		queryKey: ["savings"],
		queryFn: () => fetchWithErrorHandling("/api/savings"),
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	})
}

export const useTemporalComparisonQuery = () => {
	return useQuery({
		queryKey: ["temporal-comparison"],
		queryFn: () => fetchWithErrorHandling("/api/temporal-comparison"),
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 10 * 60 * 1000, // 10 minutos
	})
}

export const useConsumptionPatternsQuery = () => {
	return useQuery({
		queryKey: ["consumption-patterns"],
		queryFn: () => fetchWithErrorHandling("/api/predictions/consumption-patterns"),
		staleTime: 5 * 60 * 1000,
	})
}

// Shopping Lists
export const useShoppingListsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.shoppingLists(params),
		queryFn: () => fetchWithErrorHandling(`/api/shopping-lists?${params?.toString() || ""}`),
		staleTime: 0, // Sempre refetch quando invalidado
	})
}

export const useShoppingListQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.shoppingList(id),
		queryFn: () => fetchWithErrorHandling(`/api/shopping-lists/${id}`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Partial<ShoppingList>) =>
			fetchWithErrorHandling("/api/shopping-lists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopping-lists"] })
			toast.success("Lista criada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar lista: ${error.message}`)
		},
	})
}

export const useUpdateShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<ShoppingList> }) =>
			fetchWithErrorHandling(`/api/shopping-lists/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["shopping-lists"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.shoppingList(id) })
			toast.success("Lista atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar lista: ${error.message}`)
		},
	})
}

export const useDeleteShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/shopping-lists/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shopping-lists"] })
			toast.success("Lista excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir lista: ${error.message}`)
		},
	})
}

export const useAddToShoppingListMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ listId, item }: { listId: string; item: any }) =>
			fetchWithErrorHandling(`/api/shopping-lists/${listId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(item),
			}),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ["shopping-lists"] })
			queryClient.invalidateQueries({ queryKey: ["shopping-list", variables.listId] })
		},
	})
}

// Dashboard Preferences
export interface DashboardPreferences {
	cardOrder: string[]
	hiddenCards: string[]
	layoutStyle: "grid" | "list" | "compact"
	cardsPerRow: number
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
	customTitle?: string
	customSubtitle?: string
}

export const useDashboardPreferencesQuery = () => {
	return useQuery({
		queryKey: queryKeys.dashboard.preferences(),
		queryFn: () => fetchWithErrorHandling("/api/dashboard/preferences"),
		staleTime: 10 * 60 * 1000, // 10 minutos - preferências mudam raramente
		gcTime: 30 * 60 * 1000, // 30 minutos - mantém em cache por mais tempo
	})
}

export const useUpdateDashboardPreferencesMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Partial<DashboardPreferences>) =>
			fetchWithErrorHandling("/api/dashboard/preferences", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.preferences() })
			toast.success("Preferências salvas com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao salvar preferências: ${error.message}`)
		},
	})
}

export const useCreateDashboardPreferencesMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Partial<DashboardPreferences>) =>
			fetchWithErrorHandling("/api/dashboard/preferences", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.preferences() })
			toast.success("Preferências criadas com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar preferências: ${error.message}`)
		},
	})
}

// Infinite Products Query
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
			params.set("limit", "50") // Aumentar limite para infinite scroll

			if (search?.trim()) params.set("search", search.trim())
			if (category && category !== "all") params.set("category", category)
			if (brand && brand !== "all") params.set("brand", brand)
			if (sort) params.set("sort", sort)

			return fetchWithErrorHandling(`/api/products?${params.toString()}`)
		},
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined
		},
		staleTime: 30 * 1000, // Reduzir para 30 segundos para melhor reatividade na busca
		gcTime: 5 * 60 * 1000, // Cache de 5 minutos no garbage collector
		initialPageParam: 1,
		enabled,
		// Manter dados anteriores durante novas queries para evitar flickering
		placeholderData: (previousData) => previousData,
	})
}

// Infinite Brands Query
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
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined
		},
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
		initialPageParam: 1,
		enabled,
		placeholderData: (previousData) => previousData,
	})
}

// Infinite Categories Query
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
		getNextPageParam: (lastPage) => {
			return lastPage.pagination.hasMore ? lastPage.pagination.currentPage + 1 : undefined
		},
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
		initialPageParam: 1,
		enabled,
		placeholderData: (previousData) => previousData,
	})
}

export const useResetDashboardPreferencesMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: () =>
			fetchWithErrorHandling("/api/dashboard/preferences", {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.preferences() })
			toast.success("Preferências resetadas para o padrão!")
		},
		onError: (error) => {
			toast.error(`Erro ao resetar preferências: ${error.message}`)
		},
	})
}

// Product Kits
export const useProductKitsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.productKits.all(params),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000, // 2 minutos
		gcTime: 5 * 60 * 1000, // 5 minutos
	})
}

export const useProductKitQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.detail(id),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits/${id}`),
		staleTime: 3 * 60 * 1000,
		enabled: !!id,
	})
}

export const useProductKitNutritionQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.nutrition(id),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits/${id}/nutrition`),
		staleTime: 5 * 60 * 1000, // Informações nutricionais mudam raramente
		enabled: !!id,
	})
}

export const useProductKitStockQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.stock(id),
		queryFn: () => fetchWithErrorHandling(`/api/product-kits/${id}/stock`),
		staleTime: 30 * 1000, // 30 segundos - estoque muda mais frequentemente
		enabled: !!id,
	})
}

export const useProductKitPriceQuery = (id: string, marketId?: string) => {
	return useQuery({
		queryKey: queryKeys.productKits.price(id, marketId),
		queryFn: () => {
			const url = marketId ? `/api/product-kits/${id}/price?marketId=${marketId}` : `/api/product-kits/${id}/price`
			return fetchWithErrorHandling(url)
		},
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useCreateProductKitMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: any) =>
			fetchWithErrorHandling("/api/product-kits", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: async () => {
			// Invalidar e refetch imediatamente
			await queryClient.invalidateQueries({ queryKey: ["product-kits"] })
			await queryClient.refetchQueries({ queryKey: ["product-kits"] })
			queryClient.invalidateQueries({ queryKey: ["products"] })
			toast.success("Kit criado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar kit: ${error.message}`)
		},
	})
}

export const useUpdateProductKitMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: any }) =>
			fetchWithErrorHandling(`/api/product-kits/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["product-kits"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.productKits.detail(id) })
			toast.success("Kit atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar kit: ${error.message}`)
		},
	})
}

export const useConsumeKitStockMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, quantity, reason }: { id: string; quantity: number; reason?: string }) =>
			fetchWithErrorHandling(`/api/product-kits/${id}/stock/consume`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quantity, reason }),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: queryKeys.productKits.stock(id) })
			queryClient.invalidateQueries({ queryKey: queryKeys.stock() })
			queryClient.invalidateQueries({ queryKey: queryKeys.stockHistory() })
			toast.success("Kit consumido do estoque com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao consumir kit: ${error.message}`)
		},
	})
}

export const useDeleteProductKitMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/product-kits/${id}`, {
				method: "DELETE",
			}),
		onSuccess: async () => {
			// Invalidar e refetch imediatamente
			await queryClient.invalidateQueries({ queryKey: ["product-kits"] })
			await queryClient.refetchQueries({ queryKey: ["product-kits"] })
			queryClient.invalidateQueries({ queryKey: ["products"] })
			toast.success("Kit excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir kit: ${error.message}`)
		},
	})
}

// ============================================
// BUDGETS (Orçamentos)
// ============================================

// Deprecated: budgets → useQuotesQuery
export const useBudgetsQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.budgets(params),
		queryFn: () => fetchWithErrorHandling(`/api/budgets?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000, // 2 minutos
	})
}

// Deprecated: budget → useQuoteQuery
export const useBudgetQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.budget(id),
		queryFn: () => fetchWithErrorHandling(`/api/budgets/${id}`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

// Deprecated: budget comparison → useQuoteComparisonQuery
export const useBudgetComparisonQuery = (budgetIds: string[]) => {
	return useQuery({
		queryKey: queryKeys.budgetComparison(budgetIds),
		queryFn: () =>
			fetchWithErrorHandling("/api/budgets/compare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ budgetIds }),
			}),
		staleTime: 1 * 60 * 1000, // 1 minuto
		enabled: budgetIds.length >= 2,
	})
}

export const useCreateBudgetMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (data: Partial<Budget>) =>
			fetchWithErrorHandling("/api/budgets", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["budgets"] })
			toast.success("Orçamento criado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao criar orçamento: ${error.message}`)
		},
	})
}

export const useUpdateBudgetMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<Budget> }) =>
			fetchWithErrorHandling(`/api/budgets/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["budgets"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) })
			toast.success("Orçamento atualizado com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar orçamento: ${error.message}`)
		},
	})
}

export const useDeleteBudgetMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/budgets/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["budgets"] })
			toast.success("Orçamento excluído com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir orçamento: ${error.message}`)
		},
	})
}

export const useConvertBudgetToPurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, paymentMethod, purchaseDate }: { id: string; paymentMethod?: string; purchaseDate?: string }) =>
			fetchWithErrorHandling(`/api/budgets/${id}/convert`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentMethod, purchaseDate }),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["budgets"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.budget(id) })
			queryClient.invalidateQueries({ queryKey: ["purchases"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: queryKeys.budgetStats() })
			toast.success("Orçamento convertido em compra com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao converter orçamento: ${error.message}`)
		},
	})
}

export const useBudgetStatsQuery = () => {
	return useQuery({
		queryKey: queryKeys.budgetStats(),
		queryFn: () => fetchWithErrorHandling("/api/budgets/stats"),
		staleTime: 2 * 60 * 1000, // 2 minutos
	})
}

// ==============================
// QUOTES (substitui budgets)
// ==============================

export const useQuotesQuery = (params?: URLSearchParams) => {
	return useQuery({
		queryKey: queryKeys.quotes(params),
		queryFn: () => fetchWithErrorHandling(`/api/quotes?${params?.toString() || ""}`),
		staleTime: 2 * 60 * 1000,
	})
}

export const useQuoteQuery = (id: string) => {
	return useQuery({
		queryKey: queryKeys.quote(id),
		queryFn: () => fetchWithErrorHandling(`/api/quotes/${id}`),
		staleTime: 2 * 60 * 1000,
		enabled: !!id,
	})
}

export const useQuoteComparisonQuery = (quoteIds: string[]) => {
	return useQuery({
		queryKey: queryKeys.quoteComparison(quoteIds),
		queryFn: () =>
			fetchWithErrorHandling("/api/quotes/compare", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ quoteIds }),
			}),
		staleTime: 1 * 60 * 1000,
		enabled: quoteIds.length >= 2,
	})
}

export const useQuoteStatsQuery = () => {
	return useQuery({
		queryKey: queryKeys.quoteStats(),
		queryFn: () => fetchWithErrorHandling("/api/quotes/stats"),
		staleTime: 2 * 60 * 1000,
	})
}

export const useUpdateQuoteMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
			fetchWithErrorHandling(`/api/quotes/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["quotes"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.quote(id) })
			toast.success("Cotação atualizada com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao atualizar cotação: ${error.message}`)
		},
	})
}

export const useDeleteQuoteMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: (id: string) =>
			fetchWithErrorHandling(`/api/quotes/${id}`, {
				method: "DELETE",
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["quotes"] })
			toast.success("Cotação excluída com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao excluir cotação: ${error.message}`)
		},
	})
}

export const useConvertQuoteToPurchaseMutation = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: ({ id, paymentMethod, purchaseDate }: { id: string; paymentMethod?: string; purchaseDate?: string }) =>
			fetchWithErrorHandling(`/api/quotes/${id}/convert`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paymentMethod, purchaseDate }),
			}),
		onSuccess: (_, { id }) => {
			queryClient.invalidateQueries({ queryKey: ["quotes"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.quote(id) })
			queryClient.invalidateQueries({ queryKey: ["purchases"] })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
			queryClient.invalidateQueries({ queryKey: queryKeys.quoteStats() })
			toast.success("Cotação convertida em compra com sucesso!")
		},
		onError: (error) => {
			toast.error(`Erro ao converter cotação: ${error.message}`)
		},
	})
}
