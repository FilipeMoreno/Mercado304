"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, Monitor, Smartphone, Tablet, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { TrustedDevicesSkeleton } from "@/components/skeletons/trusted-devices-skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TrustedDevice {
	id: string
	userId: string
	userAgent: string
	ipAddress: string | null
	createdAt: Date
	updatedAt: Date
}

export function TrustedDevices() {
	const [devices, setDevices] = useState<TrustedDevice[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [removingId, setRemovingId] = useState<string | null>(null)

	useEffect(() => {
		loadDevices()
	}, [loadDevices])

	async function loadDevices() {
		try {
			setIsLoading(true)
			const response = await fetch("/api/auth/trusted-devices")
			if (!response.ok) throw new Error("Erro ao carregar dispositivos")

			const data = await response.json()
			setDevices(data.devices || [])
		} catch (error) {
			console.error("Error loading trusted devices:", error)
			toast.error("Erro ao carregar dispositivos confiáveis")
		} finally {
			setIsLoading(false)
		}
	}

	async function removeDevice(deviceId: string) {
		try {
			setRemovingId(deviceId)
			const response = await fetch(`/api/auth/trusted-devices/${deviceId}`, {
				method: "DELETE",
			})

			if (!response.ok) throw new Error("Erro ao remover dispositivo")

			toast.success("Dispositivo removido com sucesso")
			setDevices(devices.filter((d) => d.id !== deviceId))
		} catch (error) {
			console.error("Error removing device:", error)
			toast.error("Erro ao remover dispositivo")
		} finally {
			setRemovingId(null)
		}
	}

	function getDeviceIcon(userAgent: string) {
		const ua = userAgent.toLowerCase()
		if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
			return <Smartphone className="size-5" />
		}
		if (ua.includes("tablet") || ua.includes("ipad")) {
			return <Tablet className="size-5" />
		}
		return <Monitor className="size-5" />
	}

	function getDeviceName(userAgent: string) {
		const ua = userAgent.toLowerCase()

		// Browser detection
		let browser = "Navegador Desconhecido"
		if (ua.includes("edg")) browser = "Edge"
		else if (ua.includes("chrome")) browser = "Chrome"
		else if (ua.includes("firefox")) browser = "Firefox"
		else if (ua.includes("safari")) browser = "Safari"
		else if (ua.includes("opera")) browser = "Opera"

		// OS detection
		let os = ""
		if (ua.includes("windows")) os = "Windows"
		else if (ua.includes("mac")) os = "macOS"
		else if (ua.includes("linux")) os = "Linux"
		else if (ua.includes("android")) os = "Android"
		else if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) os = "iOS"

		return `${browser}${os ? ` (${os})` : ""}`
	}

	if (isLoading) {
		return <TrustedDevicesSkeleton />
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Dispositivos Confiáveis</CardTitle>
				<CardDescription>
					Dispositivos onde você marcou "Confiar neste dispositivo" durante o login com 2FA
				</CardDescription>
			</CardHeader>
			<CardContent>
				{devices.length === 0 ? (
					<div className="text-center py-8 text-muted-foreground">
						<Monitor className="size-12 mx-auto mb-4 opacity-50" />
						<p>Nenhum dispositivo confiável cadastrado</p>
						<p className="text-sm mt-2">
							Marque "Confiar neste dispositivo" ao fazer login com 2FA para não precisar inserir o código por 60 dias
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{devices.map((device) => (
							<div
								key={device.id}
								className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
							>
								<div className="flex items-start gap-3">
									<div className="mt-1 text-muted-foreground">{getDeviceIcon(device.userAgent)}</div>
									<div>
										<p className="font-medium">{getDeviceName(device.userAgent)}</p>
										{device.ipAddress && <p className="text-sm text-muted-foreground">IP: {device.ipAddress}</p>}
										<p className="text-xs text-muted-foreground mt-1">
											Adicionado{" "}
											{formatDistanceToNow(new Date(device.createdAt), {
												addSuffix: true,
												locale: ptBR,
											})}
										</p>
										<p className="text-xs text-muted-foreground">
											Última atualização{" "}
											{formatDistanceToNow(new Date(device.updatedAt), {
												addSuffix: true,
												locale: ptBR,
											})}
										</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => removeDevice(device.id)}
									disabled={removingId === device.id}
								>
									{removingId === device.id ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										<Trash2 className="size-4 text-destructive" />
									)}
								</Button>
							</div>
						))}
						{devices.length > 0 && (
							<p className="text-xs text-muted-foreground text-center pt-2">
								Os dispositivos confiáveis expiram automaticamente após 60 dias de inatividade
							</p>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
