"use client"

import { useState } from "react"
import { SplashScreen } from "./splash-screen"
import { usePWA } from "@/hooks"

interface PWASplashWrapperProps {
  children: React.ReactNode
}

export function PWASplashWrapper({ children }: PWASplashWrapperProps) {
  const [showSplash, setShowSplash] = useState(true)
  const { shouldShowSplash } = usePWA()

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  // Se não deve mostrar splash ou já foi completada, renderiza o conteúdo normal
  if (!shouldShowSplash || !showSplash) {
    return <>{children}</>
  }

  // Renderiza a splash screen
  return (
    <>
      <SplashScreen onComplete={handleSplashComplete} duration={2500} />
      {/* Renderiza o conteúdo por baixo para evitar flash */}
      <div style={{ visibility: 'hidden', position: 'absolute' }}>
        {children}
      </div>
    </>
  )
}
