/**
 * Background Sync API
 * Permite sincronização real em background, mesmo quando o usuário fecha a aplicação
 */

export interface SyncTask {
	id: string
	method: string
	url: string
	data: unknown
	timestamp: number
	retries: number
}

const SYNC_TAG = "mercado304-sync"
const MAX_RETRIES = 3

/**
 * Registrar Background Sync
 * Solicita permissão para sincronizar em background
 */
export async function registerBackgroundSync(): Promise<boolean> {
	if (typeof window === "undefined") return false

	try {
		// Verificar se Background Sync é suportado
		if (!("serviceWorker" in navigator)) {
			console.warn("Service Worker não é suportado neste navegador")
			return false
		}

		// Verificar se sync está disponível
		const registration = await navigator.serviceWorker.ready

		// Type assertion para sync (experimental API)
		const syncManager = (registration as any).sync
		if (!syncManager) {
			console.warn("Background Sync não é suportado neste navegador")
			return false
		}

		// Registrar sync
		await syncManager.register(SYNC_TAG)
		console.log("✅ Background Sync registrado com sucesso")
		return true
	} catch (error) {
		console.error("❌ Erro ao registrar Background Sync:", error)
		return false
	}
}

/**
 * Adicionar tarefa à fila de Background Sync
 */
export async function addToBackgroundSyncQueue(task: Omit<SyncTask, "id" | "timestamp" | "retries">): Promise<void> {
	const syncTask: SyncTask = {
		...task,
		id: `${Date.now()}-${Math.random()}`,
		timestamp: Date.now(),
		retries: 0,
	}

	// Salvar no IndexedDB
	const queue = await getBackgroundSyncQueue()
	queue.push(syncTask)
	await saveBackgroundSyncQueue(queue)

	// Registrar sync
	await registerBackgroundSync()
}

/**
 * Obter fila de sincronização
 */
export async function getBackgroundSyncQueue(): Promise<SyncTask[]> {
	try {
		const stored = localStorage.getItem("mercado304-background-sync-queue")
		if (stored) {
			return JSON.parse(stored)
		}
	} catch (error) {
		console.error("Erro ao carregar fila de background sync:", error)
	}
	return []
}

/**
 * Salvar fila de sincronização
 */
export async function saveBackgroundSyncQueue(queue: SyncTask[]): Promise<void> {
	localStorage.setItem("mercado304-background-sync-queue", JSON.stringify(queue))
}

/**
 * Processar fila de Background Sync
 */
export async function processBackgroundSyncQueue(): Promise<void> {
	const queue = await getBackgroundSyncQueue()
	if (queue.length === 0) return

	console.log(`🔄 Processando ${queue.length} tarefa(s) de background sync...`)

	const successIds: string[] = []
	const failedTasks: SyncTask[] = []

	for (const task of queue) {
		try {
			const response = await fetch(task.url, {
				method: task.method,
				headers: {
					"Content-Type": "application/json",
				},
				body: task.data ? JSON.stringify(task.data) : undefined,
			})

			if (response.ok) {
				successIds.push(task.id)
				console.log(`✅ Tarefa ${task.id} sincronizada com sucesso`)
			} else {
				// Incrementar retries
				if (task.retries < MAX_RETRIES) {
					failedTasks.push({
						...task,
						retries: task.retries + 1,
					})
					console.warn(`⚠️ Tarefa ${task.id} falhou, tentativa ${task.retries + 1}/${MAX_RETRIES}`)
				} else {
					console.error(`❌ Tarefa ${task.id} falhou após ${MAX_RETRIES} tentativas`)
				}
			}
		} catch (error) {
			// Incrementar retries em caso de erro
			if (task.retries < MAX_RETRIES) {
				failedTasks.push({
					...task,
					retries: task.retries + 1,
				})
			}
			console.error(`❌ Erro ao processar tarefa ${task.id}:`, error)
		}
	}

	// Atualizar fila com tarefas que falharam
	await saveBackgroundSyncQueue([...failedTasks])

	console.log(`✅ ${successIds.length} tarefa(s) concluída(s), ${failedTasks.length} para retry`)
}

/**
 * Limpar fila de Background Sync
 */
export async function clearBackgroundSyncQueue(): Promise<void> {
	localStorage.removeItem("mercado304-background-sync-queue")
	console.log("✅ Fila de background sync limpa")
}

/**
 * Obter estatísticas de Background Sync
 */
export async function getBackgroundSyncStats(): Promise<{
	queueSize: number
	oldestTask: number | null
	tasksWithRetries: number
}> {
	const queue = await getBackgroundSyncQueue()

	const oldestTask = queue.length > 0 ? Math.min(...queue.map((t) => t.timestamp)) : null

	const tasksWithRetries = queue.filter((t) => t.retries > 0).length

	return {
		queueSize: queue.length,
		oldestTask,
		tasksWithRetries,
	}
}

/**
 * Hook para usar Background Sync em componentes
 */
export function useBackgroundSync() {
	const register = async () => {
		return await registerBackgroundSync()
	}

	const addTask = async (method: string, url: string, data: unknown) => {
		await addToBackgroundSyncQueue({ method, url, data })
	}

	const processQueue = async () => {
		await processBackgroundSyncQueue()
	}

	const clearQueue = async () => {
		await clearBackgroundSyncQueue()
	}

	const getStats = async () => {
		return await getBackgroundSyncStats()
	}

	return {
		register,
		addTask,
		processQueue,
		clearQueue,
		getStats,
	}
}
