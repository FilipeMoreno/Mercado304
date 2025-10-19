"use client"

import { useEffect, useState } from "react"
import { useBiometricLock } from "@/hooks/use-biometric-lock"
import { useSession } from "@/lib/auth-client"
import { BiometricLockScreen } from "./biometric-lock-screen"

interface BiometricLockWrapperProps {
	children: React.ReactNode
}

export function BiometricLockWrapper({ children }: BiometricLockWrapperProps) {
	const { data: session, isPending } = useSession()
	const { shouldShowLock, isLocked, config, unlock } = useBiometricLock()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	// Não mostra nada até montar (evita flash)
	if (!mounted) {
		return null
	}

	// Se não está logado, não mostra bloqueio
	if (!session?.user || isPending) {
		return <>{children}</>
	}

	// Se o bloqueio não está habilitado, renderiza normal
	if (!config.enabled) {
		return <>{children}</>
	}

	// Se deve mostrar o bloqueio
	if (shouldShowLock && isLocked) {
		return <BiometricLockScreen onUnlock={unlock} autoPrompt={true} />
	}

	// Renderiza o conteúdo normal
	return <>{children}</>
}
