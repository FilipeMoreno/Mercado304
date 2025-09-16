import { create } from "zustand"
import * as brandService from "@/services/brandService"
import * as categoryService from "@/services/categoryService"
import * as marketService from "@/services/marketService"
import * as productService from "@/services/productService"
import * as shoppingListService from "@/services/shoppingListService"
import type { Brand, Category, Market, Product, ShoppingList } from "@/types"

// Define a estrutura do nosso estado
interface DataState {
	products: Product[]
	markets: Market[]
	brands: Brand[]
	categories: Category[]
	shoppingLists: ShoppingList[]
	loading: {
		products: boolean
		markets: boolean
		brands: boolean
		categories: boolean
		shoppingLists: boolean
	}

	// Define as ações que podemos executar no estado
	fetchProducts: (force?: boolean) => Promise<void>
	fetchMarkets: (force?: boolean) => Promise<void>
	fetchBrands: (force?: boolean) => Promise<void>
	fetchCategories: (force?: boolean) => Promise<void>
	fetchShoppingLists: (force?: boolean) => Promise<void>
	addBrand: (brand: Brand) => void
	addCategory: (category: Category) => void
	addMarket: (market: Market) => void
}

export const useDataStore = create<DataState>((set, get) => ({
	// Estado inicial
	products: [],
	markets: [],
	brands: [],
	categories: [],
	shoppingLists: [],
	loading: {
		products: false,
		markets: false,
		brands: false,
		categories: false,
		shoppingLists: false,
	},

	// Ações para buscar os dados
	fetchProducts: async (force = false) => {
		// CORREÇÃO: Não fazer cache de um array vazio
		if (!force && get().products.length > 0) return
		set((state) => ({ loading: { ...state.loading, products: true } }))
		try {
			const { products } = await productService.getProducts()
			set({ products })
		} catch (error) {
			console.error("Erro ao buscar produtos:", error)
		} finally {
			set((state) => ({ loading: { ...state.loading, products: false } }))
		}
	},

	fetchMarkets: async (force = false) => {
		if (!force && get().markets.length > 0) return
		set((state) => ({ loading: { ...state.loading, markets: true } }))
		try {
			const { markets } = await marketService.getMarkets()
			set({ markets })
		} catch (error) {
			console.error("Erro ao buscar mercados:", error)
		} finally {
			set((state) => ({ loading: { ...state.loading, markets: false } }))
		}
	},

	fetchBrands: async (force = false) => {
		if (!force && get().brands.length > 0) return
		set((state) => ({ loading: { ...state.loading, brands: true } }))
		try {
			const { brands } = await brandService.getBrands()
			set({ brands })
		} catch (error) {
			console.error("Erro ao buscar marcas:", error)
		} finally {
			set((state) => ({ loading: { ...state.loading, brands: false } }))
		}
	},

	fetchCategories: async (force = false) => {
		// Só busca se forçado ou se não há categorias carregadas
		if (!force && get().categories.length > 0) return

		set((state) => ({ loading: { ...state.loading, categories: true } }))
		try {
			const categories = await categoryService.getAllCategories()
			set({ categories })
		} catch (error) {
			console.error("Erro ao buscar categorias:", error)
		} finally {
			set((state) => ({ loading: { ...state.loading, categories: false } }))
		}
	},

	fetchShoppingLists: async (force = false) => {
		if (!force && get().shoppingLists.length > 0) return
		set((state) => ({ loading: { ...state.loading, shoppingLists: true } }))
		try {
			const { lists } = await shoppingListService.getShoppingLists()
			set({ shoppingLists: lists })
		} catch (error) {
			console.error("Erro ao buscar listas de compras:", error)
		} finally {
			set((state) => ({ loading: { ...state.loading, shoppingLists: false } }))
		}
	},

	// Ações para adicionar novos itens ao estado sem precisar buscar tudo de novo
	addBrand: (brand) => set((state) => ({ brands: [...state.brands, brand] })),
	addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
	addMarket: (market) => set((state) => ({ markets: [...state.markets, market] })),
}))
