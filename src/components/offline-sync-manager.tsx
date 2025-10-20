"use client"

import { useEffect } from "react"
import { useOffline } from "@/hooks/use-offline"
import { registerBackgroundSync } from "@/lib/background-sync"
import { offlineCache } from "@/lib/offline-db"

/**
 * Componente que gerencia a sincronização de dados em background
 * Armazena automaticamente dados das APIs principais no cache offline
 */
export function OfflineSyncManager() {
	const { isOnline } = useOffline()

	useEffect(() => {
		// Registrar Background Sync ao montar
		registerBackgroundSync().catch(console.error)

		if (!isOnline) return

		// Sincronizar dados em background quando online
		const syncData = async () => {
			try {
				// Salvar timestamp da última sincronização
				const now = new Date().toLocaleString("pt-BR")
				localStorage.setItem("mercado304-last-sync", now)

				// Produtos
				const productsRes = await fetch("/api/products/all")
				if (productsRes.ok) {
					const products = await productsRes.json()
					await offlineCache.setProducts(products)
				}

				// Estoque
				const stockRes = await fetch("/api/stock")
				if (stockRes.ok) {
					const stock = await stockRes.json()
					await offlineCache.setStock(stock)
				}

				// Listas de compras
				const listsRes = await fetch("/api/shopping-lists")
				if (listsRes.ok) {
					const lists = await listsRes.json()
					await offlineCache.setShoppingLists(lists)
				}

				// Compras recentes (últimas 30)
				const purchasesRes = await fetch("/api/purchases?limit=30")
				if (purchasesRes.ok) {
					const purchases = await purchasesRes.json()
					await offlineCache.setPurchases(purchases)
				}

				// Marcas
				const brandsRes = await fetch("/api/brands/all")
				if (brandsRes.ok) {
					const brands = await brandsRes.json()
					await offlineCache.setBrands(brands)
				}

				// Categorias
				const categoriesRes = await fetch("/api/categories/all")
				if (categoriesRes.ok) {
					const categories = await categoriesRes.json()
					await offlineCache.setCategories(categories)
				}

				// Mercados
				const marketsRes = await fetch("/api/markets")
				if (marketsRes.ok) {
					const markets = await marketsRes.json()
					await offlineCache.setMarkets(markets)
				}

				// Dashboard stats
				const statsRes = await fetch("/api/dashboard/stats")
				if (statsRes.ok) {
					const stats = await statsRes.json()
					await offlineCache.setDashboardStats(stats)
				}

				console.log("✅ Dados sincronizados offline com sucesso")
			} catch (error) {
				console.error("❌ Erro ao sincronizar dados offline:", error)
			}
		}

		// Sincronizar imediatamente
		syncData()

		// Sincronizar a cada 5 minutos quando online
		const intervalId = setInterval(syncData, 5 * 60 * 1000)

		return () => clearInterval(intervalId)
	}, [isOnline])

	// Este componente não renderiza nada visualmente
	return null
}

/**
 * Hook para pré-carregar dados específicos no cache
 */
export function useOfflinePreload() {
	const preloadProduct = async (productId: string) => {
		try {
			const res = await fetch(`/api/products/${productId}`)
			if (res.ok) {
				const product = await res.json()
				await offlineCache.setProduct(productId, product)
			}
		} catch (error) {
			console.error("Erro ao pré-carregar produto:", error)
		}
	}

	const preloadShoppingList = async (listId: string) => {
		try {
			const res = await fetch(`/api/shopping-lists/${listId}`)
			if (res.ok) {
				const list = await res.json()
				await offlineCache.setShoppingList(listId, list)
			}
		} catch (error) {
			console.error("Erro ao pré-carregar lista:", error)
		}
	}

	const preloadPurchase = async (purchaseId: string) => {
		try {
			const res = await fetch(`/api/purchases/${purchaseId}`)
			if (res.ok) {
				const purchase = await res.json()
				await offlineCache.setPurchase(purchaseId, purchase)
			}
		} catch (error) {
			console.error("Erro ao pré-carregar compra:", error)
		}
	}

	const preloadStockItem = async (stockId: string) => {
		try {
			const res = await fetch(`/api/stock/${stockId}`)
			if (res.ok) {
				const stockItem = await res.json()
				await offlineCache.setStockItem(stockId, stockItem)
			}
		} catch (error) {
			console.error("Erro ao pré-carregar item de estoque:", error)
		}
	}

	return {
		preloadProduct,
		preloadShoppingList,
		preloadPurchase,
		preloadStockItem,
	}
}

/**
 * Hook para limpar cache offline
 */
export function useOfflineCache() {
	const clearCache = async () => {
		try {
			await offlineCache.clearAll()
			console.log("✅ Cache offline limpo com sucesso")
			return true
		} catch (error) {
			console.error("❌ Erro ao limpar cache offline:", error)
			return false
		}
	}

	const getCacheSize = async () => {
		try {
			const keys = await offlineCache.getProducts()
			// Calcular tamanho aproximado
			const sizeInBytes = JSON.stringify(keys).length
			const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2)
			return sizeInMB
		} catch (error) {
			console.error("Erro ao calcular tamanho do cache:", error)
			return "0"
		}
	}

	return {
		clearCache,
		getCacheSize,
	}
}
