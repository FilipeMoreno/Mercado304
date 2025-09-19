"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

// ==================== INTERFACES ====================

interface FilterState {
	search?: string
	sort?: string
	page?: number
	category?: string
	brand?: string
	market?: string
	dateRange?: {
		from: Date
		to: Date
	}
	priceRange?: {
		min: number
		max: number
	}
	[key: string]: any
}

interface SearchHistoryItem {
	term: string
	timestamp: Date
	page: string
}

interface FiltersStore {
	// Search History
	searchHistory: SearchHistoryItem[]
	maxHistoryItems: number
	
	// Recent Filters (cached per page)
	recentFilters: Record<string, FilterState>
	
	// User Preferences
	preferences: {
		defaultSort: Record<string, string> // page -> sort preference
		itemsPerPage: Record<string, number> // page -> items per page
		favoriteMarkets: string[]
		favoriteCategories: string[]
		favoriteBrands: string[]
	}
	
	// Actions
	addToSearchHistory: (term: string, page: string) => void
	clearSearchHistory: () => void
	removeFromSearchHistory: (index: number) => void
	getSearchHistory: (page?: string) => SearchHistoryItem[]
	
	saveFilterState: (page: string, filters: FilterState) => void
	getFilterState: (page: string) => FilterState | undefined
	clearFilterState: (page: string) => void
	
	setDefaultSort: (page: string, sort: string) => void
	getDefaultSort: (page: string) => string | undefined
	
	setItemsPerPage: (page: string, items: number) => void
	getItemsPerPage: (page: string) => number
	
	addFavoriteMarket: (marketId: string) => void
	removeFavoriteMarket: (marketId: string) => void
	toggleFavoriteMarket: (marketId: string) => void
	
	addFavoriteCategory: (categoryId: string) => void
	removeFavoriteCategory: (categoryId: string) => void
	toggleFavoriteCategory: (categoryId: string) => void
	
	addFavoriteBrand: (brandId: string) => void
	removeFavoriteBrand: (brandId: string) => void
	toggleFavoriteBrand: (brandId: string) => void
	
	clearAllFilters: () => void
	resetPreferences: () => void
}

// ==================== DEFAULT VALUES ====================

const defaultPreferences = {
	defaultSort: {},
	itemsPerPage: {},
	favoriteMarkets: [],
	favoriteCategories: [],
	favoriteBrands: [],
}

// ==================== STORE IMPLEMENTATION ====================

export const useFiltersStore = create<FiltersStore>()(
	persist(
		(set, get) => ({
			// Initial State
			searchHistory: [],
			maxHistoryItems: 50,
			recentFilters: {},
			preferences: defaultPreferences,

			// Search History Actions
			addToSearchHistory: (term, page) => {
				const trimmedTerm = term.trim()
				if (!trimmedTerm) return

				set((state) => {
					// Remove duplicates
					const filtered = state.searchHistory.filter(
						(item) => item.term !== trimmedTerm || item.page !== page
					)
					
					// Add new item at the beginning
					const newHistory = [
						{ term: trimmedTerm, page, timestamp: new Date() },
						...filtered,
					].slice(0, state.maxHistoryItems) // Keep only max items

					return { searchHistory: newHistory }
				})
			},

			clearSearchHistory: () => set({ searchHistory: [] }),

			removeFromSearchHistory: (index) =>
				set((state) => ({
					searchHistory: state.searchHistory.filter((_, i) => i !== index),
				})),

			getSearchHistory: (page) => {
				const { searchHistory } = get()
				if (page) {
					return searchHistory.filter((item) => item.page === page)
				}
				return searchHistory
			},

			// Filter State Actions
			saveFilterState: (page, filters) =>
				set((state) => ({
					recentFilters: { ...state.recentFilters, [page]: filters },
				})),

			getFilterState: (page) => get().recentFilters[page],

			clearFilterState: (page) =>
				set((state) => {
					const { [page]: removed, ...rest } = state.recentFilters
					return { recentFilters: rest }
				}),

			// Default Sort Actions
			setDefaultSort: (page, sort) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						defaultSort: { ...state.preferences.defaultSort, [page]: sort },
					},
				})),

			getDefaultSort: (page) => get().preferences.defaultSort[page],

			// Items Per Page Actions
			setItemsPerPage: (page, items) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						itemsPerPage: { ...state.preferences.itemsPerPage, [page]: items },
					},
				})),

			getItemsPerPage: (page) => get().preferences.itemsPerPage[page] || 12,

			// Favorite Markets Actions
			addFavoriteMarket: (marketId) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						favoriteMarkets: [...state.preferences.favoriteMarkets.filter(id => id !== marketId), marketId],
					},
				})),

			removeFavoriteMarket: (marketId) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						favoriteMarkets: state.preferences.favoriteMarkets.filter(id => id !== marketId),
					},
				})),

			toggleFavoriteMarket: (marketId) => {
				const { preferences } = get()
				const isFavorite = preferences.favoriteMarkets.includes(marketId)
				if (isFavorite) {
					get().removeFavoriteMarket(marketId)
				} else {
					get().addFavoriteMarket(marketId)
				}
			},

			// Favorite Categories Actions
			addFavoriteCategory: (categoryId) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						favoriteCategories: [...state.preferences.favoriteCategories.filter(id => id !== categoryId), categoryId],
					},
				})),

			removeFavoriteCategory: (categoryId) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						favoriteCategories: state.preferences.favoriteCategories.filter(id => id !== categoryId),
					},
				})),

			toggleFavoriteCategory: (categoryId) => {
				const { preferences } = get()
				const isFavorite = preferences.favoriteCategories.includes(categoryId)
				if (isFavorite) {
					get().removeFavoriteCategory(categoryId)
				} else {
					get().addFavoriteCategory(categoryId)
				}
			},

			// Favorite Brands Actions
			addFavoriteBrand: (brandId) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						favoriteBrands: [...state.preferences.favoriteBrands.filter(id => id !== brandId), brandId],
					},
				})),

			removeFavoriteBrand: (brandId) =>
				set((state) => ({
					preferences: {
						...state.preferences,
						favoriteBrands: state.preferences.favoriteBrands.filter(id => id !== brandId),
					},
				})),

			toggleFavoriteBrand: (brandId) => {
				const { preferences } = get()
				const isFavorite = preferences.favoriteBrands.includes(brandId)
				if (isFavorite) {
					get().removeFavoriteBrand(brandId)
				} else {
					get().addFavoriteBrand(brandId)
				}
			},

			// Reset Actions
			clearAllFilters: () =>
				set({
					searchHistory: [],
					recentFilters: {},
				}),

			resetPreferences: () =>
				set((state) => ({
					preferences: defaultPreferences,
				})),
		}),
		{
			name: "mercado304-filters-store",
			partialize: (state) => ({
				searchHistory: state.searchHistory.slice(0, 20), // Only persist latest 20 searches
				preferences: state.preferences,
				// Don't persist recentFilters as they should be session-based
			}),
		}
	)
)

// ==================== SELECTORS ====================

// Search History selectors
export const useSearchHistory = (page?: string) => 
	useFiltersStore((state) => state.getSearchHistory(page))

export const useSearchHistoryActions = () => 
	useFiltersStore((state) => ({
		addToSearchHistory: state.addToSearchHistory,
		clearSearchHistory: state.clearSearchHistory,
		removeFromSearchHistory: state.removeFromSearchHistory,
	}))

// Filter State selectors
export const useFilterState = (page: string) =>
	useFiltersStore((state) => state.getFilterState(page))

export const useFilterActions = () =>
	useFiltersStore((state) => ({
		saveFilterState: state.saveFilterState,
		getFilterState: state.getFilterState,
		clearFilterState: state.clearFilterState,
	}))

// Preferences selectors
export const useFilterPreferences = () =>
	useFiltersStore((state) => state.preferences)

export const useFavoriteMarkets = () =>
	useFiltersStore((state) => state.preferences.favoriteMarkets)

export const useFavoriteCategories = () =>
	useFiltersStore((state) => state.preferences.favoriteCategories)

export const useFavoriteBrands = () =>
	useFiltersStore((state) => state.preferences.favoriteBrands)

export const useDefaultSort = (page: string) =>
	useFiltersStore((state) => state.getDefaultSort(page))

export const useItemsPerPage = (page: string) =>
	useFiltersStore((state) => state.getItemsPerPage(page))

// Preferences Actions
export const useFilterPreferencesActions = () =>
	useFiltersStore((state) => ({
		setDefaultSort: state.setDefaultSort,
		setItemsPerPage: state.setItemsPerPage,
		toggleFavoriteMarket: state.toggleFavoriteMarket,
		toggleFavoriteCategory: state.toggleFavoriteCategory,
		toggleFavoriteBrand: state.toggleFavoriteBrand,
		clearAllFilters: state.clearAllFilters,
		resetPreferences: state.resetPreferences,
	}))