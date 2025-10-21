"use client"

import { useCallback, useEffect, useState } from "react"
import type {
	AggregatedNutritionalInfo,
	CreateProductKitInput,
	KitStockInfo,
	ProductKitWithItems,
} from "@/types/product-kit"

interface UseProductKitsOptions {
	includeInactive?: boolean
	autoLoad?: boolean
}

export function useProductKits(options: UseProductKitsOptions = {}) {
	const { includeInactive = false, autoLoad = true } = options

	const [kits, setKits] = useState<ProductKitWithItems[]>([])
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Carregar lista de kits
	const loadKits = useCallback(async () => {
		setIsLoading(true)
		setError(null)

		try {
			const url = `/api/product-kits?includeInactive=${includeInactive}`
			const response = await fetch(url)
			const data = await response.json()

			if (data.success) {
				setKits(data.data)
			} else {
				setError(data.error || "Erro ao carregar kits")
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido")
		} finally {
			setIsLoading(false)
		}
	}, [includeInactive])

	// Criar novo kit
	const createKit = useCallback(
		async (input: CreateProductKitInput) => {
			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch("/api/product-kits", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(input),
				})

				const data = await response.json()

				if (data.success) {
					await loadKits() // Recarregar lista
					return data.data
				} else {
					throw new Error(data.error || "Erro ao criar kit")
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
				setError(errorMessage)
				throw err
			} finally {
				setIsLoading(false)
			}
		},
		[loadKits],
	)

	// Atualizar itens de um kit
	const updateKitItems = useCallback(
		async (kitId: string, items: Array<{ productId: string; quantity: number }>) => {
			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch(`/api/product-kits/${kitId}`, {
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ items }),
				})

				const data = await response.json()

				if (data.success) {
					await loadKits() // Recarregar lista
					return data.data
				} else {
					throw new Error(data.error || "Erro ao atualizar kit")
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
				setError(errorMessage)
				throw err
			} finally {
				setIsLoading(false)
			}
		},
		[loadKits],
	)

	// Auto-carregar na montagem se necessário
	useEffect(() => {
		if (autoLoad) {
			loadKits()
		}
	}, [autoLoad, loadKits])

	return {
		kits,
		isLoading,
		error,
		loadKits,
		createKit,
		updateKitItems,
	}
}

// Hook para um kit específico
export function useProductKit(kitProductId: string | null) {
	const [kit, setKit] = useState<ProductKitWithItems | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const loadKit = useCallback(async () => {
		if (!kitProductId) return

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/product-kits/${kitProductId}`)
			const data = await response.json()

			if (data.success) {
				setKit(data.data)
			} else {
				setError(data.error || "Erro ao carregar kit")
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido")
		} finally {
			setIsLoading(false)
		}
	}, [kitProductId])

	useEffect(() => {
		loadKit()
	}, [loadKit])

	return {
		kit,
		isLoading,
		error,
		reload: loadKit,
	}
}

// Hook para informações nutricionais de um kit
export function useKitNutrition(kitProductId: string | null) {
	const [nutrition, setNutrition] = useState<AggregatedNutritionalInfo | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const loadNutrition = useCallback(async () => {
		if (!kitProductId) return

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/product-kits/${kitProductId}/nutrition`)
			const data = await response.json()

			if (data.success) {
				setNutrition(data.data)
			} else {
				setError(data.error || "Erro ao carregar informações nutricionais")
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido")
		} finally {
			setIsLoading(false)
		}
	}, [kitProductId])

	useEffect(() => {
		loadNutrition()
	}, [loadNutrition])

	return {
		nutrition,
		isLoading,
		error,
		reload: loadNutrition,
	}
}

// Hook para informações de estoque de um kit
export function useKitStock(kitProductId: string | null) {
	const [stockInfo, setStockInfo] = useState<KitStockInfo | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const loadStockInfo = useCallback(async () => {
		if (!kitProductId) return

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch(`/api/product-kits/${kitProductId}/stock`)
			const data = await response.json()

			if (data.success) {
				setStockInfo(data.data)
			} else {
				setError(data.error || "Erro ao carregar informações de estoque")
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido")
		} finally {
			setIsLoading(false)
		}
	}, [kitProductId])

	// Função para consumir do estoque
	const consumeFromStock = useCallback(
		async (quantity: number, reason?: string) => {
			if (!kitProductId) throw new Error("Kit ID não fornecido")

			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch(`/api/product-kits/${kitProductId}/stock/consume`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ quantity, reason }),
				})

				const data = await response.json()

				if (data.success) {
					await loadStockInfo() // Recarregar informações
					return data.data
				} else {
					throw new Error(data.error || "Erro ao consumir do estoque")
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : "Erro desconhecido"
				setError(errorMessage)
				throw err
			} finally {
				setIsLoading(false)
			}
		},
		[kitProductId, loadStockInfo],
	)

	useEffect(() => {
		loadStockInfo()
	}, [loadStockInfo])

	return {
		stockInfo,
		isLoading,
		error,
		reload: loadStockInfo,
		consumeFromStock,
	}
}

// Hook para preço de um kit
export function useKitPrice(kitProductId: string | null, marketId?: string) {
	const [priceInfo, setPriceInfo] = useState<{
		totalPrice: number
		itemPrices: Array<{
			productId: string
			productName: string
			quantity: number
			unitPrice: number
			totalPrice: number
		}>
	} | null>(null)
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const loadPriceInfo = useCallback(async () => {
		if (!kitProductId) return

		setIsLoading(true)
		setError(null)

		try {
			const url = marketId
				? `/api/product-kits/${kitProductId}/price?marketId=${marketId}`
				: `/api/product-kits/${kitProductId}/price`

			const response = await fetch(url)
			const data = await response.json()

			if (data.success) {
				setPriceInfo(data.data)
			} else {
				setError(data.error || "Erro ao calcular preço")
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido")
		} finally {
			setIsLoading(false)
		}
	}, [kitProductId, marketId])

	useEffect(() => {
		loadPriceInfo()
	}, [loadPriceInfo])

	return {
		priceInfo,
		isLoading,
		error,
		reload: loadPriceInfo,
	}
}
