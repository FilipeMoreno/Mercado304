"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { offlineDB } from "@/lib/offline-db"
import type { PendingSync } from "@/lib/offline-db"

const MAX_RETRIES = 3

/**
 * Hook melhorado para gerenciar sincronização offline
 * Usa IndexedDB para persistência robusta
 */
export function useOfflineSync() {
	const [isOnline, setIsOnline] = useState(
		typeof navigator !== "undefined" ? navigator.onLine : true
	)
	const [isSyncing, setIsSyncing] = useState(false)
	const [syncQueue, setSyncQueue] = useState<PendingSync[]>([])

	// Atualizar fila do IndexedDB
	const refreshQueue = async () => {
		try {
			const queue = await offlineDB.getSyncQueue()
			setSyncQueue(queue)
		} catch (error) {
			console.error("❌ Erro ao carregar fila de sincronização:", error)
		}
	}

	// Adicionar item à fila de sincronização
	const addToQueue = async (
		method: string,
		url: string,
		data: unknown,
		entityType: string,
		entityId?: string
	) => {
		try {
			const id = await offlineDB.addToSyncQueue({
				method,
				url,
				data,
				entityType,
				entityId,
			})

			await refreshQueue()

			toast.info("Ação salva", {
				description: "Será sincronizada quando voltar online",
				duration: 3000,
			})

			return id
		} catch (error) {
			console.error("❌ Erro ao adicionar à fila:", error)
			toast.error("Erro ao salvar ação offline")
			throw error
		}
	}

	// Processar fila de sincronização
	const processQueue = async () => {
		if (isSyncing || !isOnline) return

		setIsSyncing(true)

		try {
			const queue = await offlineDB.getSyncQueue()

			if (queue.length === 0) {
				setIsSyncing(false)
				return
			}

			console.log(`🔄 Sincronizando ${queue.length} ação(ões) pendente(s)...`)

			let successCount = 0
			let failCount = 0

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
						// Sucesso - remover da fila
						await offlineDB.removeSyncItem(item.id)
						successCount++
						console.log(`✅ Item ${item.id} sincronizado com sucesso`)
					} else {
						// Erro HTTP - verificar retries
						if (item.retries < MAX_RETRIES) {
							await offlineDB.updateSyncItem(item.id, {
								retries: item.retries + 1,
							})
							console.warn(
								`⚠️ Falha ao sincronizar ${item.id}, retry ${item.retries + 1}/${MAX_RETRIES}`
							)
						} else {
							// Máximo de retries atingido - remover e registrar erro
							await offlineDB.removeSyncItem(item.id)
							failCount++
							console.error(
								`❌ Item ${item.id} falhou após ${MAX_RETRIES} tentativas`
							)
						}
					}
				} catch (error) {
					// Erro de rede - verificar retries
					if (item.retries < MAX_RETRIES) {
						await offlineDB.updateSyncItem(item.id, {
							retries: item.retries + 1,
						})
						console.warn(`⚠️ Erro ao sincronizar ${item.id}, retry ${item.retries + 1}`)
					} else {
						await offlineDB.removeSyncItem(item.id)
						failCount++
					}
					console.error(`❌ Erro ao processar item ${item.id}:`, error)
				}
			}

			await refreshQueue()

			// Notificações
			if (successCount > 0) {
				toast.success(`${successCount} ação(ões) sincronizada(s)!`)
			}

			if (failCount > 0) {
				toast.error(`${failCount} ação(ões) falharam`, {
					description: "Verifique sua conexão e tente novamente",
				})
			}

			const remainingCount = await offlineDB.getSyncQueueSize()
			if (remainingCount > 0) {
				toast.warning(`${remainingCount} ação(ões) ainda pendente(s)`)
			}
		} catch (error) {
			console.error("❌ Erro ao processar fila de sincronização:", error)
			toast.error("Erro na sincronização")
		} finally {
			setIsSyncing(false)
		}
	}

	// Limpar fila
	const clearQueue = async () => {
		try {
			await offlineDB.clearSyncQueue()
			await refreshQueue()
			toast.success("Fila de sincronização limpa")
		} catch (error) {
			console.error("❌ Erro ao limpar fila:", error)
			toast.error("Erro ao limpar fila")
		}
	}

	// Handlers de eventos online/offline
	useEffect(() => {
		const handleOnline = async () => {
			setIsOnline(true)
			console.log("🌐 Conexão restaurada")

			toast.success("Conexão restaurada!", {
				description: "Sincronizando dados...",
			})

			// Processar fila automaticamente
			await processQueue()
		}

		const handleOffline = () => {
			setIsOnline(false)
			console.log("📴 Sem conexão com a internet")

			toast.warning("Você está offline", {
				description: "Suas ações serão sincronizadas quando voltar online",
				duration: 5000,
			})
		}

		// Adicionar listeners
		window.addEventListener("online", handleOnline)
		window.addEventListener("offline", handleOffline)

		// Verificar periodicamente a conexão
		const intervalId = setInterval(() => {
			if (navigator.onLine !== isOnline) {
				if (navigator.onLine) {
					handleOnline()
				} else {
					handleOffline()
				}
			}
		}, 5000)

		// Carregar fila inicial
		refreshQueue()

		return () => {
			window.removeEventListener("online", handleOnline)
			window.removeEventListener("offline", handleOffline)
			clearInterval(intervalId)
		}
	}, [isOnline])

	return {
		isOnline,
		isSyncing,
		syncQueue,
		syncQueueCount: syncQueue.length,
		addToQueue,
		processQueue,
		clearQueue,
		refreshQueue,
	}
}
