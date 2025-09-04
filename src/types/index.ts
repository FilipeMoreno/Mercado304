export interface Market {
  id: string
  name: string
  location?: string
  createdAt: Date
  updatedAt: Date
}

export interface Brand {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    products: number
  }
}

export interface Category {
  id: string
  name: string
  icon?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  barcode?: string
  categoryId?: string
  brandId?: string
  unit: string
  // Controle de estoque
  hasStock?: boolean
  minStock?: number
  maxStock?: number
  // Controle de validade
  hasExpiration?: boolean
  defaultShelfLifeDays?: number
  createdAt: Date
  updatedAt: Date
  category?: Category
  brand?: Brand
}

export interface Purchase {
  id: string
  marketId: string
  totalAmount: number
  purchaseDate: Date
  createdAt: Date
  updatedAt: Date
  market?: Market
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  productId?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  productName?: string
  productUnit?: string
  productCategory?: string
  brandName?: string
  createdAt: Date
  product?: Product
}

export interface ShoppingList {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  items?: ShoppingListItem[]
}

export interface ShoppingListItem {
  id: string
  listId: string
  productId: string
  quantity: number
  isChecked: boolean
  createdAt: Date
  product?: Product
}

export interface MarketStats {
  marketId: string
  marketName: string
  totalPurchases: number
  totalSpent: number
  averagePrice: number
}

export interface ProductStats {
  productId: string
  productName: string
  totalPurchases: number
  totalQuantity: number
  averagePrice: number
  lastPurchaseDate: Date
}