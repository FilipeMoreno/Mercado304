"use client"

import { RefreshCw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface ServerHealth {
	status: string
	timestamp: string
	services: {
		database: string
		redis: string
	}
}

interface ServerInfo {
	message: string
	status: string
	timestamp: string
	version: string
}

interface ServerStatusBannerProps {
	serverUrl?: string
	refreshInterval?: number
	className?: string
}

export function ServerStatusBanner({ 
	serverUrl = process.env.NEXT_PUBLIC_BACKGROUND_WORKER_SERVER || "http://localhost:3100",
	refreshInterval = 30000,
	className = ""
}: ServerStatusBannerProps) {
	const [serverHealth, setServerHealth] = useState<ServerHealth | null>(null)
	const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
	const [loading, setLoading] = useState(false)

	// Função para buscar status do servidor de background
	const fetchServerHealth = useCallback(async () => {
		setLoading(true)
		try {
			// Buscar informações do servidor (endpoint raiz)
			const serverResponse = await fetch(`${serverUrl}/`)
			if (serverResponse.ok) {
				const serverData = await serverResponse.json()
				setServerInfo(serverData)
			}

			// Buscar status de saúde
			const healthResponse = await fetch(`${serverUrl}/health`)
			if (healthResponse.ok) {
				const health = await healthResponse.json()
				setServerHealth(health)
			} else {
				setServerHealth({
					status: "unhealthy",
					timestamp: new Date().toISOString(),
					services: {
						database: "unknown",
						redis: "unknown",
					},
				})
			}
		} catch (error) {
			console.error("Erro ao buscar status do servidor:", error)
			setServerHealth({
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				services: {
					database: "disconnected",
					redis: "disconnected",
				},
			})
			setServerInfo(null)
		} finally {
			setLoading(false)
		}
	}, [serverUrl])

	// useEffect para health check do servidor
	useEffect(() => {
		fetchServerHealth()
		const healthInterval = setInterval(fetchServerHealth, refreshInterval)
		return () => clearInterval(healthInterval)
	}, [fetchServerHealth, refreshInterval])

	if (!serverHealth && !serverInfo) {
		return null
	}

	return (
		<div className={`mb-6 ${className}`}>
			<div
				className={`p-4 rounded-lg border ${
					serverHealth?.status === "healthy" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
				}`}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div
							className={`w-3 h-3 rounded-full ${
								serverHealth?.status === "healthy" ? "bg-green-500" : "bg-red-500"
							}`}
						/>
						<div>
							<h3
								className={`font-semibold ${
									serverHealth?.status === "healthy" ? "text-green-800" : "text-red-800"
								}`}
							>
								{serverInfo?.message || "Servidor de Background"}:{" "}
								{serverHealth?.status === "healthy" ? "Online" : "Offline"}
							</h3>
							<div className={`text-sm ${serverHealth?.status === "healthy" ? "text-green-600" : "text-red-600"}`}>
								{serverHealth && (
									<span>
										Database: {serverHealth.services.database} • Redis: {serverHealth.services.redis}
									</span>
								)}
								{serverInfo && <span className="ml-2">• Versão: {serverInfo.version}</span>}
							</div>
						</div>
					</div>
					<div className="text-right">
						<p className={`text-xs ${serverHealth?.status === "healthy" ? "text-green-600" : "text-red-600"}`}>
							Última verificação:{" "}
							{new Date(
								serverHealth?.timestamp || serverInfo?.timestamp || new Date().toISOString(),
							).toLocaleTimeString("pt-BR")}
						</p>
						<Button 
							variant="ghost" 
							size="sm" 
							onClick={fetchServerHealth} 
							disabled={loading}
							className="text-xs h-6 px-2"
						>
							<RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
							Atualizar
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
