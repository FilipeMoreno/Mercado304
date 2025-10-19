"use client"

import { useEffect, useState } from "react"
import { usePWA } from "@/hooks"
import { BiometricLockWrapper } from "./biometric-lock-wrapper"
import { SplashScreen } from "./splash-screen"

interface PWASplashWrapperProps {
	children: React.ReactNode
}

export function PWASplashWrapper({ children }: PWASplashWrapperProps) {
	const [showSplash, setShowSplash] = useState(true)
	const [mounted, setMounted] = useState(false)
	const { shouldShowSplash } = usePWA()

	useEffect(() => {
		setMounted(true)
	}, [])

	const handleSplashComplete = () => {
		setShowSplash(false)
	}

	// Se não deve mostrar splash ou já foi completada, renderiza o conteúdo com bloqueio biométrico
	if (!shouldShowSplash || !showSplash) {
		return <BiometricLockWrapper>{children}</BiometricLockWrapper>
	}

	// Renderiza a splash screen SEMPRE primeiro para cobrir a splash nativa do PWA
	return (
		<>
			{/* Renderiza a splash screen IMEDIATAMENTE */}
			<SplashScreen onComplete={handleSplashComplete} duration={2000} />
			{/* Renderiza o conteúdo por baixo para evitar flash */}
			{mounted && (
				<div style={{ visibility: "hidden", position: "absolute", pointerEvents: "none" }}>
					<BiometricLockWrapper>{children}</BiometricLockWrapper>
				</div>
			)}
		</>
	)
}
