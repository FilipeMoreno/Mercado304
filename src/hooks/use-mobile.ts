"use client"

import { useState, useEffect } from 'react'

interface MobileInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouchDevice: boolean
  orientation: 'portrait' | 'landscape'
  screenSize: {
    width: number
    height: number
  }
  deviceType: 'mobile' | 'tablet' | 'desktop'
  platform: string
  userAgent: string
}

export function useMobile(): MobileInfo {
  const [mobileInfo, setMobileInfo] = useState<MobileInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    orientation: 'landscape',
    screenSize: { width: 1920, height: 1080 },
    deviceType: 'desktop',
    platform: 'unknown',
    userAgent: ''
  })

  useEffect(() => {
    const updateMobileInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent
      
      // Detectar tipo de dispositivo baseado na largura da tela
      const isMobile = width < 768
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      
      // Detectar se é dispositivo touch
      const isTouchDevice = 'ontouchstart' in window || 
                           navigator.maxTouchPoints > 0 ||
                           'msMaxTouchPoints' in navigator

      // Detectar orientação
      const orientation = height > width ? 'portrait' : 'landscape'

      // Determinar tipo de dispositivo (considerando touch)
      let deviceType: 'mobile' | 'tablet' | 'desktop'
      if (isMobile || (isTouchDevice && width < 768)) {
        deviceType = 'mobile'
      } else if (isTablet || (isTouchDevice && width < 1024)) {
        deviceType = 'tablet'
      } else {
        deviceType = 'desktop'
      }

      // Detectar plataforma
      let platform = 'unknown'
      if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
        platform = 'ios'
      } else if (userAgent.includes('Android')) {
        platform = 'android'
      } else if (userAgent.includes('Windows')) {
        platform = 'windows'
      } else if (userAgent.includes('Mac')) {
        platform = 'macos'
      } else if (userAgent.includes('Linux')) {
        platform = 'linux'
      }

      setMobileInfo({
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        orientation,
        screenSize: { width, height },
        deviceType,
        platform,
        userAgent
      })
    }

    // Atualizar na montagem
    updateMobileInfo()

    // Escutar mudanças de tamanho da tela e orientação
    window.addEventListener('resize', updateMobileInfo)
    window.addEventListener('orientationchange', updateMobileInfo)

    return () => {
      window.removeEventListener('resize', updateMobileInfo)
      window.removeEventListener('orientationchange', updateMobileInfo)
    }
  }, [])

  return mobileInfo
}

// Hook adicional para breakpoints específicos
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg')

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < 640) {
        setBreakpoint('xs')
      } else if (width < 768) {
        setBreakpoint('sm')
      } else if (width < 1024) {
        setBreakpoint('md')
      } else if (width < 1280) {
        setBreakpoint('lg')
      } else if (width < 1536) {
        setBreakpoint('xl')
      } else {
        setBreakpoint('2xl')
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)

    return () => {
      window.removeEventListener('resize', updateBreakpoint)
    }
  }, [])

  return breakpoint
}

// Hook para detectar se o usuário está usando o dispositivo em modo one-handed
export function useOneHandedMode() {
  const [isOneHandedMode, setIsOneHandedMode] = useState(false)
  
  useEffect(() => {
    const checkOneHandedMode = () => {
      const { width, height } = window.screen
      const orientation = height > width ? 'portrait' : 'landscape'
      
      // Heurística: se está em portrait e a tela é relativamente grande
      // pode estar usando modo one-handed
      const isLikelyOneHanded = orientation === 'portrait' && height > 700
      
      setIsOneHandedMode(isLikelyOneHanded)
    }

    checkOneHandedMode()
    window.addEventListener('orientationchange', checkOneHandedMode)

    return () => {
      window.removeEventListener('orientationchange', checkOneHandedMode)
    }
  }, [])

  return isOneHandedMode
}