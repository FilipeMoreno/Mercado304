"use client"

import { Download, Monitor, Smartphone, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPWACard() {
	const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
	const [isInstalled, setIsInstalled] = useState(false)
	const [isStandalone, setIsStandalone] = useState(false)
	const [showCard, setShowCard] = useState(true)
	const [platform, setPlatform] = useState<"android" | "ios" | "desktop" | "unknown">("unknown")
	const [showDebug, setShowDebug] = useState(false)

	useEffect(() => {
		// Detectar se já está instalado
		const checkInstalled = () => {
			const standalone =
				window.matchMedia("(display-mode: standalone)").matches ||
				(window.navigator as any).standalone === true ||
				document.referrer.includes("android-app://")

			setIsStandalone(standalone)
			setIsInstalled(standalone)

			// Debug
			console.log("[PWA] Display mode:", window.matchMedia("(display-mode: standalone)").matches)
			console.log("[PWA] Navigator standalone:", (window.navigator as any).standalone)
			console.log("[PWA] Referrer:", document.referrer)
		}

		// Detectar plataforma
		const detectPlatform = () => {
			const ua = navigator.userAgent.toLowerCase()
			if (/android/.test(ua)) {
				setPlatform("android")
			} else if (/iphone|ipad|ipod/.test(ua)) {
				setPlatform("ios")
			} else if (/windows|mac|linux/.test(ua)) {
				setPlatform("desktop")
			}

			console.log("[PWA] Platform detected:", ua)
		}

		checkInstalled()
		detectPlatform()

		// Verificar se já foi dispensado permanentemente
		const dismissed = localStorage.getItem("mercado304-pwa-install-dismissed")
		if (dismissed === "true") {
			setShowCard(false)
			console.log("[PWA] Card was dismissed permanently")
		}

		// Capturar evento de instalação (Chrome/Edge)
		const handleBeforeInstallPrompt = (e: Event) => {
			console.log("[PWA] beforeinstallprompt event fired!")
			e.preventDefault()
			setDeferredPrompt(e as BeforeInstallPromptEvent)
		}

		// Detectar quando o app foi instalado
		const handleAppInstalled = () => {
			console.log("[PWA] App installed successfully!")
			setIsInstalled(true)
			setDeferredPrompt(null)
			// Auto-fechar o card após instalação
			setTimeout(() => setShowCard(false), 2000)
		}

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
		window.addEventListener("appinstalled", handleAppInstalled)

		return () => {
			window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
			window.removeEventListener("appinstalled", handleAppInstalled)
		}
	}, [])

	const handleInstallClick = async () => {
		if (!deferredPrompt) return

		try {
			await deferredPrompt.prompt()
			const { outcome } = await deferredPrompt.userChoice

			if (outcome === "accepted") {
				setIsInstalled(true)
			}

			setDeferredPrompt(null)
		} catch (error) {
			console.error("Erro ao instalar PWA:", error)
		}
	}

	const handleDismiss = () => {
		setShowCard(false)
		localStorage.setItem("mercado304-pwa-install-dismissed", "true")
	}

	// Não mostrar se já instalado, já foi dispensado, ou em standalone mode
	if (!showCard || isInstalled || isStandalone) {
		return null
	}

	return (
		<Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/20 relative">
			<CardHeader>
				<div className="flex items-start justify-between">
					<div className="flex items-center gap-2">
						{/* Debug toggle - apenas desenvolvimento */}
						{process.env.NODE_ENV === "development" && (
							<button
								type="button"
								onClick={() => setShowDebug(!showDebug)}
								className="absolute top-2 left-2 text-xs opacity-30 hover:opacity-100"
							>
								🐛
							</button>
						)}
						<div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
							<Download className="size-5 text-primary" />
						</div>
						<div>
							<CardTitle className="text-lg">Instale o App Mercado304</CardTitle>
							<CardDescription>Acesse mais rápido e funcione offline</CardDescription>
						</div>
					</div>
					<Button variant="ghost" size="icon" onClick={handleDismiss} className="size-8 -mt-1 -mr-1" title="Dispensar">
						<X className="size-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Benefícios */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div className="flex items-start gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
						<div className="p-1.5 bg-green-100 dark:bg-green-950 rounded-full">
							<Download className="h-3.5 w-3.5 text-green-700 dark:text-green-400" />
						</div>
						<div>
							<p className="text-xs font-semibold">Acesso Rápido</p>
							<p className="text-xs text-muted-foreground">Tela inicial</p>
						</div>
					</div>
					<div className="flex items-start gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
						<div className="p-1.5 bg-blue-100 dark:bg-blue-950 rounded-full">
							<Smartphone className="h-3.5 w-3.5 text-blue-700 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-xs font-semibold">Modo Offline</p>
							<p className="text-xs text-muted-foreground">Funciona sem internet</p>
						</div>
					</div>
					<div className="flex items-start gap-2 p-3 bg-white/50 dark:bg-gray-900/50 rounded-lg">
						<div className="p-1.5 bg-purple-100 dark:bg-purple-950 rounded-full">
							<Monitor className="h-3.5 w-3.5 text-purple-700 dark:text-purple-400" />
						</div>
						<div>
							<p className="text-xs font-semibold">App Nativo</p>
							<p className="text-xs text-muted-foreground">Experiência completa</p>
						</div>
					</div>
				</div>

				{/* Botão de instalação */}
				<div className="space-y-3">
					{deferredPrompt && (
						<Button onClick={handleInstallClick} className="w-full bg-primary hover:bg-primary/90" size="lg">
							<Download className="mr-2 size-5" />
							Instalar Agora com 1 Clique
						</Button>
					)}

					{/* Instruções sempre visíveis */}
					{!deferredPrompt && (
						<>
							<div className="text-sm">
								<p className="font-medium mb-2 flex items-center gap-2">
									{platform === "ios" ? <Smartphone className="size-4" /> : <Monitor className="size-4" />}
									Como instalar:
								</p>
								{platform === "ios" ? (
									<ol className="space-y-1.5 text-xs text-muted-foreground ml-6">
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">1.</span>
											<span>
												Toque no botão de <strong>Compartilhar</strong> 📤 (parte inferior)
											</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">2.</span>
											<span>
												Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>
											</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">3.</span>
											<span>
												Confirme tocando em <strong>"Adicionar"</strong>
											</span>
										</li>
									</ol>
								) : platform === "android" ? (
									<ol className="space-y-1.5 text-xs text-muted-foreground ml-6">
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">1.</span>
											<span>
												Toque no menu <strong>⋮</strong> (3 pontos) do navegador
											</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">2.</span>
											<span>
												Selecione <strong>"Adicionar à tela inicial"</strong> ou <strong>"Instalar app"</strong>
											</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">3.</span>
											<span>
												Confirme tocando em <strong>"Instalar"</strong>
											</span>
										</li>
									</ol>
								) : (
									<ol className="space-y-1.5 text-xs text-muted-foreground ml-6">
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">1.</span>
											<span>
												Procure o ícone de <strong>instalação (⊕)</strong> na barra de endereço
											</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="font-bold text-primary">2.</span>
											<span>
												Ou abra o menu <strong>(⋮)</strong> e clique em <strong>"Instalar Mercado304"</strong>
											</span>
										</li>
									</ol>
								)}
							</div>

							<div className="flex items-center justify-center pt-2">
								<Badge variant="secondary" className="text-xs">
									{platform === "ios" ? "📱 iOS/Safari" : platform === "android" ? "🤖 Android/Chrome" : "💻 Desktop"}
								</Badge>
							</div>
						</>
					)}
				</div>

				{/* Debug Info - apenas desenvolvimento */}
				{showDebug && process.env.NODE_ENV === "development" && (
					<div className="mt-4 p-3 bg-gray-900 text-white text-xs font-mono rounded-lg">
						<div>Platform: {platform}</div>
						<div>Has Prompt: {deferredPrompt ? "Yes ✅" : "No ❌"}</div>
						<div>Is Standalone: {isStandalone ? "Yes" : "No"}</div>
						<div>Is Installed: {isInstalled ? "Yes" : "No"}</div>
						<div>User Agent: {typeof window !== "undefined" ? navigator.userAgent.substring(0, 50) : "N/A"}</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
