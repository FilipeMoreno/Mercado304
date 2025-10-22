"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"

interface GTINResult {
	gtin: string
	name: string
	brand?: string
	grossWeight?: number
	netWeight?: number
	height?: number
	length?: number
	width?: number
	avgPrice?: number
	maxPrice?: number
	thumbnail?: string
	imageUrl?: string
	gpc?: {
		code: string
		description: string
	}
	ncm?: {
		code: string
		description: string
		fullDescription: string
	}
	cached: boolean
	source: 'cache' | 'api'
}

interface GTINError {
	error: string
}

type GTINResponse = GTINResult | GTINError

// Hook para busca otimizada de GTIN com debounce
export function useGTINSearch() {
	const [searchCode, setSearchCode] = useState<string | null>(null)
	const [isSearching, setIsSearching] = useState(false)
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const lastSearchRef = useRef<string | null>(null)

	const {
		data,
		isLoading,
		error,
		refetch
	} = useQuery({
		queryKey: ["gtin", searchCode],
		queryFn: async (): Promise<GTINResponse> => {
			if (!searchCode) throw new Error("Código não fornecido")
			
			const response = await fetch(`/api/gtin/${searchCode}`)
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || "Erro ao buscar produto")
			}
			
			return response.json()
		},
		enabled: !!searchCode && searchCode !== lastSearchRef.current,
		staleTime: 5 * 60 * 1000, // 5 minutos
		gcTime: 15 * 60 * 1000, // 15 minutos
		retry: (failureCount, error) => {
			// Não tentar novamente se for erro de rate limit ou produto não encontrado
			const errorMessage = error?.message || ""
			if (errorMessage.includes("Limite de consultas") || 
				errorMessage.includes("não encontrado")) {
				return false
			}
			return failureCount < 2
		},
		onSuccess: () => {
			lastSearchRef.current = searchCode
			setIsSearching(false)
		},
		onError: () => {
			setIsSearching(false)
		}
	})

	// Função para buscar com debounce
	const searchGTIN = useCallback((code: string) => {
		// Limpar timeout anterior
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current)
		}

		// Validar código
		const cleanCode = code.replace(/\D/g, '') // Remove caracteres não numéricos
		if (!cleanCode || cleanCode.length < 8 || cleanCode.length > 14) {
			setSearchCode(null)
			setIsSearching(false)
			return
		}

		// Se já pesquisamos esse código, não pesquisar novamente
		if (cleanCode === lastSearchRef.current) {
			return
		}

		setIsSearching(true)

		// Debounce de 1.5 segundos
		debounceTimeoutRef.current = setTimeout(() => {
			setSearchCode(cleanCode)
		}, 1500)
	}, [])

	// Função para buscar imediatamente (quando usuário sai do campo)
	const searchGTINImmediate = useCallback((code: string) => {
		// Limpar timeout do debounce
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current)
		}

		const cleanCode = code.replace(/\D/g, '')
		if (!cleanCode || cleanCode.length < 8 || cleanCode.length > 14) {
			setSearchCode(null)
			setIsSearching(false)
			return
		}

		// Se já pesquisamos esse código, não pesquisar novamente
		if (cleanCode === lastSearchRef.current) {
			setIsSearching(false)
			return
		}

		setIsSearching(true)
		setSearchCode(cleanCode)
	}, [])

	// Limpar timeout ao desmontar
	useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current)
			}
		}
	}, [])

	// Helper para verificar se o resultado é um erro
	const isError = (result: GTINResponse | undefined): result is GTINError => {
		return !!(result && 'error' in result)
	}

	// Helper para verificar se o resultado é um produto válido
	const isValidProduct = (result: GTINResponse | undefined): result is GTINResult => {
		return !!(result && 'gtin' in result && 'name' in result)
	}

	return {
		// Dados
		product: isValidProduct(data) ? data : null,
		error: isError(data) ? data.error : (error?.message || null),
		
		// Estados
		isLoading: isLoading || isSearching,
		isSearching,
		
		// Funções
		searchGTIN,
		searchGTINImmediate,
		refetch,
		
		// Helpers
		isError,
		isValidProduct,
		
		// Info sobre cache
		isCached: isValidProduct(data) ? data.cached : false,
		source: isValidProduct(data) ? data.source : null,
	}
}

// Hook para obter dados de um GTIN específico (sem debounce)
export function useGTINQuery(gtin: string | null) {
	return useQuery({
		queryKey: ["gtin", gtin],
		queryFn: async (): Promise<GTINResponse> => {
			if (!gtin) throw new Error("GTIN não fornecido")
			
			const response = await fetch(`/api/gtin/${gtin}`)
			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.error || "Erro ao buscar produto")
			}
			
			return response.json()
		},
		enabled: !!gtin && /^\d{8,14}$/.test(gtin),
		staleTime: 10 * 60 * 1000, // 10 minutos
		gcTime: 30 * 60 * 1000, // 30 minutos
	})
}