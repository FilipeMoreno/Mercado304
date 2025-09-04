"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { Product, Market, Brand, Category } from '@/types'

interface AppDataContextType {
  // Data
  products: Product[]
  markets: Market[]
  brands: Brand[]
  categories: Category[]
  
  // Loading states
  isLoading: boolean
  productsLoading: boolean
  marketsLoading: boolean
  brandsLoading: boolean
  categoriesLoading: boolean
  
  // Actions
  refreshProducts: () => Promise<void>
  refreshMarkets: () => Promise<void>
  refreshBrands: () => Promise<void>
  refreshCategories: () => Promise<void>
  refreshAll: () => Promise<void>
  
  // Add new items to local state
  addProduct: (product: Product) => void
  addMarket: (market: Market) => void
  addBrand: (brand: Brand) => void
  addCategory: (category: Category) => void
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined)

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [markets, setMarkets] = useState<Market[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  
  const [productsLoading, setProductsLoading] = useState(false)
  const [marketsLoading, setMarketsLoading] = useState(false)
  const [brandsLoading, setBrandsLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  
  const isLoading = productsLoading || marketsLoading || brandsLoading || categoriesLoading

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const response = await fetch('/api/products')
      if (response.ok) {
        const data = await response.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const refreshMarkets = useCallback(async () => {
    setMarketsLoading(true)
    try {
      const response = await fetch('/api/markets')
      if (response.ok) {
        const data = await response.json()
        setMarkets(data)
      }
    } catch (error) {
      console.error('Erro ao buscar mercados:', error)
    } finally {
      setMarketsLoading(false)
    }
  }, [])

  const refreshBrands = useCallback(async () => {
    setBrandsLoading(true)
    try {
      const response = await fetch('/api/brands')
      if (response.ok) {
        const data = await response.json()
        setBrands(data)
      }
    } catch (error) {
      console.error('Erro ao buscar marcas:', error)
    } finally {
      setBrandsLoading(false)
    }
  }, [])

  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshProducts(),
      refreshMarkets(), 
      refreshBrands(),
      refreshCategories()
    ])
  }, [refreshProducts, refreshMarkets, refreshBrands, refreshCategories])

  // Add new items to local state (optimistic updates)
  const addProduct = useCallback((product: Product) => {
    setProducts(prev => [...prev, product])
  }, [])

  const addMarket = useCallback((market: Market) => {
    setMarkets(prev => [...prev, market])
  }, [])

  const addBrand = useCallback((brand: Brand) => {
    setBrands(prev => [...prev, brand])
  }, [])

  const addCategory = useCallback((category: Category) => {
    setCategories(prev => [...prev, category])
  }, [])

  // Initial data load
  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const value: AppDataContextType = {
    products,
    markets,
    brands,
    categories,
    isLoading,
    productsLoading,
    marketsLoading,
    brandsLoading,
    categoriesLoading,
    refreshProducts,
    refreshMarkets,
    refreshBrands,
    refreshCategories,
    refreshAll,
    addProduct,
    addMarket,
    addBrand,
    addCategory
  }

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  )
}

export function useAppData() {
  const context = useContext(AppDataContext)
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider')
  }
  return context
}