"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

interface OfflineState {
  isOnline: boolean
  wasOffline: boolean
  lastOnline: Date | null
  connectionSpeed: string | null
}

interface SyncQueueItem {
  id: string
  method: string
  url: string
  data: unknown
  timestamp: number
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
    lastOnline: null,
    connectionSpeed: null,
  })

  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([])

  // Processar fila de sincronização
  const processSyncQueue = useCallback(async () => {
    if (syncQueue.length === 0) return

    const queue = [...syncQueue]
    const successIds: string[] = []

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: item.data ? JSON.stringify(item.data) : undefined,
        })

        if (response.ok) {
          successIds.push(item.id)
        }
      } catch (error) {
        console.error("Erro ao sincronizar item:", error)
      }
    }

    // Remover itens sincronizados com sucesso
    const remainingQueue = queue.filter(item => !successIds.includes(item.id))
    setSyncQueue(remainingQueue)
    localStorage.setItem("mercado304-sync-queue", JSON.stringify(remainingQueue))

    if (successIds.length > 0) {
      toast.success(`${successIds.length} ação(ões) sincronizada(s)!`)
    }

    if (remainingQueue.length > 0) {
      toast.warning(`${remainingQueue.length} ação(ões) pendente(s)`)
    }
  }, [syncQueue])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Carregar fila de sincronização do localStorage
    const storedQueue = localStorage.getItem("mercado304-sync-queue")
    if (storedQueue) {
      try {
        setSyncQueue(JSON.parse(storedQueue))
      } catch (e) {
        console.error("Erro ao carregar fila de sincronização:", e)
      }
    }

    const handleOnline = async () => {
      const now = new Date()
      
      setState(prev => ({
        ...prev,
        isOnline: true,
        wasOffline: !prev.isOnline,
        lastOnline: now,
      }))

      // Verificar velocidade da conexão
      if ("connection" in navigator) {
        interface NavigatorConnection {
          effectiveType?: string
        }
        const conn = (navigator as Navigator & { connection?: NavigatorConnection }).connection
        const speed = conn?.effectiveType || "unknown"
        setState(prev => ({ ...prev, connectionSpeed: speed }))
      }

      toast.success("Conexão restaurada!", {
        description: "Sincronizando dados...",
      })

      // Processar fila de sincronização
      await processSyncQueue()
    }

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false,
        wasOffline: true,
        lastOnline: new Date(),
      }))

      toast.error("Você está offline", {
        description: "Seus dados serão salvos e sincronizados quando voltar online.",
        duration: 5000,
      })
    }

    // Adicionar listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Verificar periodicamente a conexão
    const intervalId = setInterval(() => {
      if (navigator.onLine !== state.isOnline) {
        if (navigator.onLine) {
          handleOnline()
        } else {
          handleOffline()
        }
      }
    }, 5000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(intervalId)
    }
  }, [state.isOnline, processSyncQueue])

  // Adicionar à fila de sincronização
  const addToSyncQueue = useCallback((method: string, url: string, data: unknown) => {
    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random()}`,
      method,
      url,
      data,
      timestamp: Date.now(),
    }

    const newQueue = [...syncQueue, item]
    setSyncQueue(newQueue)
    localStorage.setItem("mercado304-sync-queue", JSON.stringify(newQueue))

    toast.info("Ação adicionada à fila", {
      description: "Será sincronizada quando voltar online.",
    })
  }, [syncQueue])

  // Limpar fila
  const clearSyncQueue = () => {
    setSyncQueue([])
    localStorage.removeItem("mercado304-sync-queue")
  }

  return {
    ...state,
    syncQueue,
    syncQueueCount: syncQueue.length,
    addToSyncQueue,
    processSyncQueue,
    clearSyncQueue,
  }
}

// Hook para fazer requisições com suporte offline
export function useOfflineFetch() {
  const { isOnline, addToSyncQueue } = useOffline()

  const offlineFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    // Se estiver online, fazer a requisição normalmente
    if (isOnline) {
      try {
        return await fetch(url, options)
      } catch (error) {
        // Se falhar mesmo online, tentar cache
        const cache = await caches.open("api-data-cache")
        const cachedResponse = await cache.match(url)
        if (cachedResponse) {
          return cachedResponse
        }
        throw error
      }
    }

    // Se estiver offline
    const method = options.method || "GET"

    // Para GET, tentar buscar do cache
    if (method === "GET") {
      const cacheNames = [
        "api-data-cache",
        "dynamic-data-cache",
        "offline-cache",
      ]

      for (const cacheName of cacheNames) {
        try {
          const cache = await caches.open(cacheName)
          const cachedResponse = await cache.match(url)
          if (cachedResponse) {
            // Adicionar header indicando que é do cache
            const clonedResponse = cachedResponse.clone()
            const headers = new Headers(clonedResponse.headers)
            headers.set("X-From-Cache", "true")
            
            return new Response(clonedResponse.body, {
              status: clonedResponse.status,
              statusText: clonedResponse.statusText,
              headers,
            })
          }
        } catch (e) {
          console.error(`Erro ao buscar do cache ${cacheName}:`, e)
        }
      }

      throw new Error("Dados não disponíveis offline")
    }

    // Para POST/PUT/DELETE, adicionar à fila de sincronização
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const body = options.body ? JSON.parse(options.body as string) : null
      addToSyncQueue(method, url, body)

      // Retornar resposta mock para indicar que foi enfileirado
      return new Response(
        JSON.stringify({ 
          success: true, 
          queued: true,
          message: "Ação enfileirada para sincronização" 
        }),
        {
          status: 202,
          headers: {
            "Content-Type": "application/json",
            "X-Queued": "true",
          },
        }
      )
    }

    throw new Error("Método não suportado offline")
  }

  return { offlineFetch }
}

