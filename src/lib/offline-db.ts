/**
 * Sistema de cache offline usando IndexedDB
 * Armazena dados estruturados para acesso offline
 */

const DB_NAME = "mercado304-offline"
const DB_VERSION = 2 // Incrementado para adicionar nova store

export interface CachedData {
  key: string
  data: unknown
  timestamp: number
  expiresAt: number | null
}

export interface PendingSync {
  id: string
  method: string
  url: string
  data: unknown
  timestamp: number
  retries: number
  entityType: string // 'product', 'purchase', 'shopping-list', etc.
  entityId?: string
}

class OfflineDB {
  private db: IDBDatabase | null = null
  private readonly storeName = "cache"
  private readonly syncStoreName = "pending-sync"

  async init(): Promise<void> {
    if (typeof window === "undefined") return
    if (this.db) return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Criar store para cache
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "key" })
          store.createIndex("timestamp", "timestamp", { unique: false })
          store.createIndex("expiresAt", "expiresAt", { unique: false })
        }

        // Criar store para sincronização pendente
        if (!db.objectStoreNames.contains(this.syncStoreName)) {
          const syncStore = db.createObjectStore(this.syncStoreName, { keyPath: "id" })
          syncStore.createIndex("timestamp", "timestamp", { unique: false })
          syncStore.createIndex("entityType", "entityType", { unique: false })
          syncStore.createIndex("retries", "retries", { unique: false })
        }
      }
    })
  }

  async set(
    key: string,
    data: unknown,
    expiresInSeconds?: number
  ): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    const timestamp = Date.now()
    const expiresAt = expiresInSeconds
      ? timestamp + expiresInSeconds * 1000
      : null

    const cachedData: CachedData = {
      key,
      data,
      timestamp,
      expiresAt,
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.put(cachedData)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result as CachedData | undefined

        if (!result) {
          resolve(null)
          return
        }

        // Verificar se expirou
        if (result.expiresAt && Date.now() > result.expiresAt) {
          // Remover item expirado
          this.delete(key)
          resolve(null)
          return
        }

        resolve(result.data as T)
      }

      request.onerror = () => reject(request.error)
    })
  }

  async delete(key: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clear(): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAllKeys(): Promise<string[]> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  }

  async cleanExpired(): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.storeName], "readwrite")
      const store = transaction.objectStore(this.storeName)
      const index = store.index("expiresAt")
      const now = Date.now()

      const request = index.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue

        if (cursor) {
          const data = cursor.value as CachedData
          if (data.expiresAt && data.expiresAt < now) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  async getSize(): Promise<number> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.storeName], "readonly")
      const store = transaction.objectStore(this.storeName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // ===== Métodos para gerenciar fila de sincronização =====

  async addToSyncQueue(sync: Omit<PendingSync, "id" | "timestamp" | "retries">): Promise<string> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    const id = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const pendingSync: PendingSync = {
      ...sync,
      id,
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.syncStoreName], "readwrite")
      const store = transaction.objectStore(this.syncStoreName)
      const request = store.add(pendingSync)

      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueue(): Promise<PendingSync[]> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.syncStoreName], "readonly")
      const store = transaction.objectStore(this.syncStoreName)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result as PendingSync[])
      request.onerror = () => reject(request.error)
    })
  }

  async removeSyncItem(id: string): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.syncStoreName], "readwrite")
      const store = transaction.objectStore(this.syncStoreName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async updateSyncItem(id: string, updates: Partial<PendingSync>): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.syncStoreName], "readwrite")
      const store = transaction.objectStore(this.syncStoreName)
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const existing = getRequest.result as PendingSync
        if (!existing) {
          reject(new Error("Sync item not found"))
          return
        }

        const updated: PendingSync = {
          ...existing,
          ...updates,
        }

        const putRequest = store.put(updated)
        putRequest.onsuccess = () => resolve()
        putRequest.onerror = () => reject(putRequest.error)
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async clearSyncQueue(): Promise<void> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.syncStoreName], "readwrite")
      const store = transaction.objectStore(this.syncStoreName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSyncQueueSize(): Promise<number> {
    await this.init()
    if (!this.db) throw new Error("Database not initialized")

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"))
        return
      }
      const transaction = this.db.transaction([this.syncStoreName], "readonly")
      const store = transaction.objectStore(this.syncStoreName)
      const request = store.count()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Instância singleton
export const offlineDB = new OfflineDB()

// Tipos genéricos para dados do cache
type Product = Record<string, unknown>
type StockItem = Record<string, unknown>
type ShoppingList = Record<string, unknown>
type Purchase = Record<string, unknown>
type Brand = Record<string, unknown>
type Category = Record<string, unknown>
type Market = Record<string, unknown>
type DashboardStats = Record<string, unknown>

// Helpers para tipos específicos de dados
export const offlineCache = {
  // Produtos
  async setProducts(products: Product[]): Promise<void> {
    await offlineDB.set("products-list", products, 60 * 60 * 24 * 7) // 7 dias
  },

  async getProducts(): Promise<Product[] | null> {
    return offlineDB.get<Product[]>("products-list")
  },

  async setProduct(id: string, product: Product): Promise<void> {
    await offlineDB.set(`product-${id}`, product, 60 * 60 * 24 * 7) // 7 dias
  },

  async getProduct(id: string): Promise<Product | null> {
    return offlineDB.get<Product>(`product-${id}`)
  },

  // Estoque
  async setStock(stock: StockItem[]): Promise<void> {
    await offlineDB.set("stock-list", stock, 60 * 60 * 24 * 2) // 2 dias
  },

  async getStock(): Promise<StockItem[] | null> {
    return offlineDB.get<StockItem[]>("stock-list")
  },

  async setStockItem(id: string, item: StockItem): Promise<void> {
    await offlineDB.set(`stock-${id}`, item, 60 * 60 * 24 * 2) // 2 dias
  },

  async getStockItem(id: string): Promise<StockItem | null> {
    return offlineDB.get<StockItem>(`stock-${id}`)
  },

  // Listas de compras
  async setShoppingLists(lists: ShoppingList[]): Promise<void> {
    await offlineDB.set("shopping-lists", lists, 60 * 60 * 24 * 2) // 2 dias
  },

  async getShoppingLists(): Promise<ShoppingList[] | null> {
    return offlineDB.get<ShoppingList[]>("shopping-lists")
  },

  async setShoppingList(id: string, list: ShoppingList): Promise<void> {
    await offlineDB.set(`shopping-list-${id}`, list, 60 * 60 * 24 * 2) // 2 dias
  },

  async getShoppingList(id: string): Promise<ShoppingList | null> {
    return offlineDB.get<ShoppingList>(`shopping-list-${id}`)
  },

  // Compras
  async setPurchases(purchases: Purchase[]): Promise<void> {
    await offlineDB.set("purchases-list", purchases, 60 * 60 * 24 * 7) // 7 dias
  },

  async getPurchases(): Promise<Purchase[] | null> {
    return offlineDB.get<Purchase[]>("purchases-list")
  },

  async setPurchase(id: string, purchase: Purchase): Promise<void> {
    await offlineDB.set(`purchase-${id}`, purchase, 60 * 60 * 24 * 7) // 7 dias
  },

  async getPurchase(id: string): Promise<Purchase | null> {
    return offlineDB.get<Purchase>(`purchase-${id}`)
  },

  // Marcas
  async setBrands(brands: Brand[]): Promise<void> {
    await offlineDB.set("brands-list", brands, 60 * 60 * 24 * 7) // 7 dias
  },

  async getBrands(): Promise<Brand[] | null> {
    return offlineDB.get<Brand[]>("brands-list")
  },

  // Categorias
  async setCategories(categories: Category[]): Promise<void> {
    await offlineDB.set("categories-list", categories, 60 * 60 * 24 * 7) // 7 dias
  },

  async getCategories(): Promise<Category[] | null> {
    return offlineDB.get<Category[]>("categories-list")
  },

  // Mercados
  async setMarkets(markets: Market[]): Promise<void> {
    await offlineDB.set("markets-list", markets, 60 * 60 * 24 * 7) // 7 dias
  },

  async getMarkets(): Promise<Market[] | null> {
    return offlineDB.get<Market[]>("markets-list")
  },

  // Dashboard stats
  async setDashboardStats(stats: DashboardStats): Promise<void> {
    await offlineDB.set("dashboard-stats", stats, 60 * 60 * 24) // 1 dia
  },

  async getDashboardStats(): Promise<DashboardStats | null> {
    return offlineDB.get<DashboardStats>("dashboard-stats")
  },

  // Limpar todos os caches
  async clearAll(): Promise<void> {
    await offlineDB.clear()
  },
}

// Inicializar ao carregar
if (typeof window !== "undefined") {
  offlineDB.init().catch(console.error)
  
  // Limpar dados expirados a cada hora
  setInterval(() => {
    offlineDB.cleanExpired().catch(console.error)
  }, 60 * 60 * 1000)
}

