"use client"

import { useState } from "react"

interface CacheEntry {
	query: string
	response: string
	timestamp: number
	frequency: number
	lastAccessed: number
}

interface CacheStats {
	hits: number
	misses: number
	totalQueries: number
}

const CACHE_KEY = "ai-assistant-cache"
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 dias
const MAX_CACHE_SIZE = 100
const MIN_FREQUENCY_FOR_CACHE = 2 // Mínimo 2 acessos para cachear

export function useAiCache() {
	const [cacheStats, setCacheStats] = useState<CacheStats>({
		hits: 0,
		misses: 0,
		totalQueries: 0,
	})

	// Normalizar query para comparação
	const normalizeQuery = (query: string): string => {
		return query
			.toLowerCase()
			.trim()
			.replace(/[^\w\s]/g, "") // Remove pontuação
			.replace(/\s+/g, " ") // Normaliza espaços
	}

	// Calcular similaridade entre queries
	const calculateSimilarity = (query1: string, query2: string): number => {
		const words1 = query1.split(" ")
		const words2 = query2.split(" ")

		const intersection = words1.filter((word) => words2.includes(word))
		const allWords = words1.concat(words2)
		const union = allWords.filter((word, index) => allWords.indexOf(word) === index)

		return intersection.length / union.length
	}

	// Carregar cache do localStorage
	const loadCache = (): Map<string, CacheEntry> => {
		try {
			const cached = localStorage.getItem(CACHE_KEY)
			if (cached) {
				const data = JSON.parse(cached)
				return new Map(Object.entries(data))
			}
		} catch (error) {
			console.error("Erro ao carregar cache:", error)
		}
		return new Map()
	}

	// Salvar cache no localStorage
	const saveCache = (cache: Map<string, CacheEntry>) => {
		try {
			const data = Object.fromEntries(cache)
			localStorage.setItem(CACHE_KEY, JSON.stringify(data))
		} catch (error) {
			console.error("Erro ao salvar cache:", error)
		}
	}

	// Limpar entradas expiradas
	const cleanExpiredEntries = (cache: Map<string, CacheEntry>): Map<string, CacheEntry> => {
		const now = Date.now()
		const cleaned = new Map()

		cache.forEach((entry, key) => {
			if (now - entry.timestamp < CACHE_EXPIRY) {
				cleaned.set(key, entry)
			}
		})

		return cleaned
	}

	// Gerenciar tamanho do cache (LRU)
	const manageCacheSize = (cache: Map<string, CacheEntry>): Map<string, CacheEntry> => {
		if (cache.size <= MAX_CACHE_SIZE) return cache

		// Ordenar por frequência e último acesso
		const entries = Array.from(cache.entries()).sort((a, b) => {
			const scoreA = a[1].frequency * 0.7 + (Date.now() - a[1].lastAccessed) * 0.3
			const scoreB = b[1].frequency * 0.7 + (Date.now() - b[1].lastAccessed) * 0.3
			return scoreA - scoreB
		})

		// Manter apenas as mais relevantes
		const managed = new Map()
		for (let i = 0; i < MAX_CACHE_SIZE; i++) {
			const entry = entries[i]
			if (entry && entry[0] !== undefined && entry[1] !== undefined) {
				managed.set(entry[0], entry[1])
			}
		}

		return managed
	}

	// Buscar resposta no cache
	const getCachedResponse = (query: string): string | null => {
		const normalizedQuery = normalizeQuery(query)
		let cache = loadCache()
		cache = cleanExpiredEntries(cache)

		// Busca exata
		if (cache.has(normalizedQuery)) {
			const entry = cache.get(normalizedQuery)!
			entry.lastAccessed = Date.now()
			entry.frequency++
			cache.set(normalizedQuery, entry)
			saveCache(cache)

			setCacheStats((prev) => ({
				...prev,
				hits: prev.hits + 1,
				totalQueries: prev.totalQueries + 1,
			}))

			return entry.response
		}

		// Busca por similaridade (threshold 0.8)
		let similarResponse: string | null = null
		cache.forEach((entry, cachedQuery) => {
			if (similarResponse) return // Já encontrou

			const similarity = calculateSimilarity(normalizedQuery, cachedQuery)
			if (similarity >= 0.8) {
				entry.lastAccessed = Date.now()
				entry.frequency++
				cache.set(cachedQuery, entry)
				saveCache(cache)

				setCacheStats((prev) => ({
					...prev,
					hits: prev.hits + 1,
					totalQueries: prev.totalQueries + 1,
				}))

				similarResponse = entry.response
			}
		})

		if (similarResponse) {
			return similarResponse
		}

		setCacheStats((prev) => ({
			...prev,
			misses: prev.misses + 1,
			totalQueries: prev.totalQueries + 1,
		}))

		return null
	}

	// Armazenar resposta no cache
	const setCachedResponse = (query: string, response: string) => {
		const normalizedQuery = normalizeQuery(query)
		let cache = loadCache()
		cache = cleanExpiredEntries(cache)

		const now = Date.now()
		const existingEntry = cache.get(normalizedQuery)

		if (existingEntry) {
			// Atualizar entrada existente
			existingEntry.response = response
			existingEntry.timestamp = now
			existingEntry.lastAccessed = now
			existingEntry.frequency++
		} else {
			// Nova entrada
			cache.set(normalizedQuery, {
				query: normalizedQuery,
				response,
				timestamp: now,
				frequency: 1,
				lastAccessed: now,
			})
		}

		cache = manageCacheSize(cache)
		saveCache(cache)
	}

	// Verificar se query deve ser cacheada
	const shouldCache = (query: string): boolean => {
		const normalizedQuery = normalizeQuery(query)
		const cache = loadCache()
		const entry = cache.get(normalizedQuery)

		// Cachear se já foi acessada antes ou se é uma query comum
		if (entry && entry.frequency >= MIN_FREQUENCY_FOR_CACHE) {
			return true
		}

		// Queries comuns que devem ser sempre cacheadas
		const commonQueries = [
			"preço",
			"price",
			"custo",
			"quanto custa",
			"lista",
			"compras",
			"shopping",
			"mercado",
			"supermercado",
			"onde comprar",
			"produto",
			"item",
			"encontrar",
			"churrasco",
			"bbq",
			"calcular",
		]

		return commonQueries.some((common) => normalizedQuery.includes(common))
	}

	// Limpar cache
	const clearCache = () => {
		try {
			localStorage.removeItem(CACHE_KEY)
			setCacheStats({ hits: 0, misses: 0, totalQueries: 0 })
		} catch (error) {
			console.error("Erro ao limpar cache:", error)
		}
	}

	// Obter estatísticas do cache
	const getCacheInfo = () => {
		const cache = loadCache()
		const hitRate = cacheStats.totalQueries > 0 ? ((cacheStats.hits / cacheStats.totalQueries) * 100).toFixed(1) : "0"

		return {
			size: cache.size,
			maxSize: MAX_CACHE_SIZE,
			hitRate: `${hitRate}%`,
			stats: cacheStats,
		}
	}

	return {
		getCachedResponse,
		setCachedResponse,
		shouldCache,
		clearCache,
		getCacheInfo,
		cacheStats,
	}
}
