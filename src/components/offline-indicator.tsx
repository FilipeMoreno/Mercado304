"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, CloudOff, RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useOffline } from "@/hooks/use-offline"
import { cn } from "@/lib/utils"

export function OfflineIndicator() {
	const { isOnline, wasOffline, syncQueueCount, processSyncQueue, clearSyncQueue } = useOffline()

	// Não mostrar nada se estiver online e nunca ficou offline
	if (isOnline && !wasOffline && syncQueueCount === 0) {
		return null
	}

	return (
		<div className="fixed top-4 right-4 z-50 max-w-md">
			<AnimatePresence mode="wait">
				{isOnline && syncQueueCount > 0 && (
					<motion.div
						key="syncing"
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						transition={{ duration: 0.2 }}
					>
						<Alert className="shadow-lg border-2 border-blue-500 bg-blue-50">
							<RefreshCw className="size-4 animate-spin text-blue-600" />
							<AlertTitle className="font-bold text-blue-900">Sincronizando</AlertTitle>
							<AlertDescription className="space-y-2">
								<p className="text-sm text-blue-800">{syncQueueCount} ação(ões) na fila de sincronização.</p>
								<div className="flex gap-2">
									<Button
										size="sm"
										variant="default"
										className="bg-blue-600 hover:bg-blue-700"
										onClick={() => processSyncQueue()}
									>
										Sincronizar Agora
									</Button>
									<Button
										size="sm"
										variant="outline"
										className="border-blue-600 text-blue-600"
										onClick={() => clearSyncQueue()}
									>
										Limpar Fila
									</Button>
								</div>
							</AlertDescription>
						</Alert>
					</motion.div>
				)}

				{isOnline && wasOffline && syncQueueCount === 0 && (
					<motion.div
						key="online"
						initial={{ opacity: 0, y: -20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -20, scale: 0.95 }}
						transition={{ duration: 0.2 }}
					>
						<Alert className="shadow-lg border-2 border-green-500 bg-green-50">
							<Wifi className="size-4 text-green-600" />
							<AlertTitle className="font-bold text-green-900">Online</AlertTitle>
							<AlertDescription className="text-sm text-green-800">
								Conexão restaurada! Todos os dados estão sincronizados.
							</AlertDescription>
						</Alert>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

// Componente compacto para a barra de status
export function OfflineStatusBar() {
	const { isOnline, syncQueueCount } = useOffline()

	if (isOnline && syncQueueCount === 0) {
		return null
	}

	return (
		<div
			className={cn(
				"fixed bottom-0 left-0 right-0 z-40 px-4 py-2 text-sm font-medium text-center transition-colors",
				!isOnline ? "bg-red-600 text-white" : syncQueueCount > 0 ? "bg-blue-600 text-white" : "bg-green-600 text-white",
			)}
		>
			<div className="flex items-center justify-center gap-2">
				{!isOnline ? (
					<>
						<CloudOff className="size-4" />
						<span>Modo Offline</span>
						{syncQueueCount > 0 && (
							<Badge variant="secondary" className="bg-red-800 text-white">
								{syncQueueCount}
							</Badge>
						)}
					</>
				) : syncQueueCount > 0 ? (
					<>
						<RefreshCw className="size-4 animate-spin" />
						<span>Sincronizando {syncQueueCount} item(s)...</span>
					</>
				) : (
					<>
						<CheckCircle2 className="size-4" />
						<span>Sincronizado</span>
					</>
				)}
			</div>
		</div>
	)
}

// Hook para usar offline indicator programaticamente
export function useOfflineIndicator() {
	const { isOnline, syncQueueCount } = useOffline()

	const getStatus = () => {
		if (!isOnline) return "offline"
		if (syncQueueCount > 0) return "syncing"
		return "online"
	}

	const getStatusColor = () => {
		const status = getStatus()
		if (status === "offline") return "red"
		if (status === "syncing") return "blue"
		return "green"
	}

	const getStatusIcon = () => {
		const status = getStatus()
		if (status === "offline") return WifiOff
		if (status === "syncing") return RefreshCw
		return Wifi
	}

	return {
		status: getStatus(),
		statusColor: getStatusColor(),
		StatusIcon: getStatusIcon(),
		isOnline,
		syncQueueCount,
	}
}
