"use client"

import { useState } from "react"
import { SplashScreen } from "@/components/splash-screen"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { resetSplashTimer, usePWA } from "@/hooks"

export default function TestSplashPage() {
	const [showSplash, setShowSplash] = useState(false)
	const { isPWA, isStandalone, shouldShowSplash } = usePWA()

	const handleShowSplash = () => {
		setShowSplash(true)
	}

	const handleSplashComplete = () => {
		setShowSplash(false)
	}

	const handleResetTimer = () => {
		resetSplashTimer()
		window.location.reload()
	}

	return (
		<div className="container mx-auto p-6 max-w-2xl">
			<div className="space-y-6">
				<div className="text-center">
					<h1 className="text-3xl font-bold">Teste da Splash Screen</h1>
					<p className="text-muted-foreground mt-2">Teste e visualize a splash screen do PWA</p>
				</div>

				{/* Status do PWA */}
				<Card>
					<CardHeader>
						<CardTitle>Status do PWA</CardTitle>
						<CardDescription>Informações sobre o estado atual do Progressive Web App</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center justify-between">
							<span>É PWA:</span>
							<Badge variant={isPWA ? "default" : "secondary"}>{isPWA ? "Sim" : "Não"}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span>Modo Standalone:</span>
							<Badge variant={isStandalone ? "default" : "secondary"}>{isStandalone ? "Sim" : "Não"}</Badge>
						</div>
						<div className="flex items-center justify-between">
							<span>Deve mostrar splash:</span>
							<Badge variant={shouldShowSplash ? "default" : "secondary"}>{shouldShowSplash ? "Sim" : "Não"}</Badge>
						</div>
					</CardContent>
				</Card>

				{/* Controles de Teste */}
				<Card>
					<CardHeader>
						<CardTitle>Controles de Teste</CardTitle>
						<CardDescription>Botões para testar a funcionalidade da splash screen</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<Button onClick={handleShowSplash} className="w-full">
							Mostrar Splash Screen
						</Button>

						<Button onClick={handleResetTimer} variant="outline" className="w-full">
							Resetar Timer (Recarregar Página)
						</Button>
					</CardContent>
				</Card>

				{/* Instruções */}
				<Card>
					<CardHeader>
						<CardTitle>Como Testar no Mobile</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div>
							<strong>Android (Chrome):</strong>
							<ol className="list-decimal list-inside mt-1 space-y-1 text-muted-foreground">
								<li>Abra o site no Chrome</li>
								<li>Toque no menu (3 pontos)</li>
								<li>Selecione "Adicionar à tela inicial"</li>
								<li>Abra o app instalado</li>
							</ol>
						</div>

						<div>
							<strong>iOS (Safari):</strong>
							<ol className="list-decimal list-inside mt-1 space-y-1 text-muted-foreground">
								<li>Abra o site no Safari</li>
								<li>Toque no botão de compartilhar</li>
								<li>Selecione "Adicionar à Tela de Início"</li>
								<li>Abra o app instalado</li>
							</ol>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Splash Screen Overlay */}
			{showSplash && <SplashScreen onComplete={handleSplashComplete} duration={3000} />}
		</div>
	)
}
