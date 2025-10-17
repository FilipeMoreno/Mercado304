// src/hooks/use-nota-parana.ts

import { useState } from "react"
import { toast } from "sonner"
import type {
	NotaParanaCategoriaResponse,
	NotaParanaProdutosResponse,
} from "@/types"

interface NotaParanaParams {
	termo: string
	local?: string // Código geográfico (default: Maringá)
	raio?: number // Raio em km
}

interface NotaParanaProdutosParams extends NotaParanaParams {
	categoria: number
	offset?: number
	ordem?: 0 | 1 | 2 // 0: relevância, 1: menor preço, 2: maior desconto
	data?: -1 | 0 | 1 | 7 | 30 // -1: todos, 0: hoje, 1: ontem, 7: última semana, 30: último mês
}

export function useNotaParana() {
	const [loadingCategorias, setLoadingCategorias] = useState(false)
	const [loadingProdutos, setLoadingProdutos] = useState(false)
	const [categoriasData, setCategoriasData] = useState<NotaParanaCategoriaResponse | null>(null)
	const [produtosData, setProdutosData] = useState<NotaParanaProdutosResponse | null>(null)

	/**
	 * Busca categorias de produtos baseado no termo de busca
	 * @param params - Parâmetros de busca (termo, local, raio)
	 * @returns Dados das categorias encontradas
	 */
	const buscarCategorias = async (params: NotaParanaParams): Promise<NotaParanaCategoriaResponse | null> => {
		setLoadingCategorias(true)
		try {
			const queryParams = new URLSearchParams({
				termo: params.termo,
				...(params.local && { local: params.local }),
				...(params.raio && { raio: params.raio.toString() }),
			})

			const response = await fetch(`/api/nota-parana/categorias?${queryParams}`)
			
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || "Erro ao buscar categorias")
			}

			const data: NotaParanaCategoriaResponse = await response.json()
			setCategoriasData(data)
			return data
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Erro ao buscar categorias"
			console.error("Erro ao buscar categorias:", error)
			toast.error(errorMessage)
			return null
		} finally {
			setLoadingCategorias(false)
		}
	}

	/**
	 * Busca produtos baseado no termo de busca e categoria
	 * @param params - Parâmetros de busca (termo, categoria, local, raio, etc)
	 * @returns Dados dos produtos encontrados
	 */
	const buscarProdutos = async (params: NotaParanaProdutosParams): Promise<NotaParanaProdutosResponse | null> => {
		setLoadingProdutos(true)
		try {
			const queryParams = new URLSearchParams({
				termo: params.termo,
				categoria: params.categoria.toString(),
				...(params.local && { local: params.local }),
				...(params.raio && { raio: params.raio.toString() }),
				...(params.offset !== undefined && { offset: params.offset.toString() }),
				...(params.ordem !== undefined && { ordem: params.ordem.toString() }),
				...(params.data !== undefined && { data: params.data.toString() }),
			})

			const response = await fetch(`/api/nota-parana/produtos?${queryParams}`)
			
			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || "Erro ao buscar produtos")
			}

			const data: NotaParanaProdutosResponse = await response.json()
			setProdutosData(data)
			return data
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Erro ao buscar produtos"
			console.error("Erro ao buscar produtos:", error)
			toast.error(errorMessage)
			return null
		} finally {
			setLoadingProdutos(false)
		}
	}

	/**
	 * Busca completa: primeiro busca categorias e depois produtos da categoria mais relevante
	 * @param params - Parâmetros de busca
	 * @returns Dados dos produtos encontrados na categoria mais relevante
	 */
	const buscarCompleto = async (params: NotaParanaParams): Promise<NotaParanaProdutosResponse | null> => {
		// Primeiro, buscar categorias
		const categorias = await buscarCategorias(params)
		
		if (!categorias || categorias.categorias.length === 0) {
			toast.error("Nenhuma categoria encontrada para este produto")
			return null
		}

		// Pegar a categoria com mais produtos (primeira da lista)
		const categoriaPrincipal = categorias.categorias[0]
		
		// Buscar produtos da categoria principal
		const produtos = await buscarProdutos({
			...params,
			categoria: categoriaPrincipal.id,
		})

		return produtos
	}

	/**
	 * Limpa os dados armazenados
	 */
	const limparDados = () => {
		setCategoriasData(null)
		setProdutosData(null)
	}

	return {
		// Estados
		loadingCategorias,
		loadingProdutos,
		loading: loadingCategorias || loadingProdutos,
		categoriasData,
		produtosData,
		
		// Funções
		buscarCategorias,
		buscarProdutos,
		buscarCompleto,
		limparDados,
	}
}

