"use client"

import { useEffect, useState } from "react"

interface PWAInfo {
	isPWA: boolean
	isStandalone: boolean
	isFirstLaunch: boolean
	shouldShowSplash: boolean
}

export function usePWA(): PWAInfo {
	const [pwaInfo, setPwaInfo] = useState<PWAInfo>({
		isPWA: false,
		isStandalone: false,
		isFirstLaunch: false,
		shouldShowSplash: false,
	})

	useEffect(() => {
		if (typeof window === "undefined") return

		// Detecta se está rodando como PWA
		const isStandalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(window.navigator as any).standalone === true ||
			document.referrer.includes("android-app://")

		// Detecta se é um dispositivo móvel
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

		// Verifica se é o primeiro lançamento (para PWA)
		const lastSplashShown = localStorage.getItem("mercado304-splash-shown")
		const now = Date.now()
		const oneHour = 60 * 60 * 1000 // 1 hora em ms

		const isFirstLaunch = !lastSplashShown || now - parseInt(lastSplashShown, 10) > oneHour

		// Determina se deve mostrar a splash screen
		const shouldShowSplash = isStandalone && isMobile && isFirstLaunch

		setPwaInfo({
			isPWA: isStandalone,
			isStandalone,
			isFirstLaunch,
			shouldShowSplash,
		})

		// Marca que a splash foi mostrada
		if (shouldShowSplash) {
			localStorage.setItem("mercado304-splash-shown", now.toString())
		}
	}, [])

	return pwaInfo
}

export function resetSplashTimer() {
	if (typeof window !== "undefined") {
		localStorage.removeItem("mercado304-splash-shown")
	}
}
