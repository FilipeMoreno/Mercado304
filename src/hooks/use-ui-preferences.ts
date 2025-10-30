"use client"

import { useMemo } from "react"
import { useUIStore, type SelectStyle } from "@/store/useUIStore"

interface UIPreferences {
  selectStyle: SelectStyle
}

export function useUIPreferences() {
  const selectStyle = useUIStore((s) => s.selectStyle)
  const setSelectStyle = useUIStore((s) => s.setSelectStyle)
  const reset = useUIStore((s) => s.reset)

  // Mantém compatibilidade com a API antiga
  const preferences: UIPreferences = useMemo(() => ({ selectStyle }), [selectStyle])

  return {
    preferences,
    isLoaded: true,
    updatePreferences: (updates: Partial<UIPreferences>) => {
      if (updates.selectStyle) setSelectStyle(updates.selectStyle)
    },
    resetPreferences: () => reset(),
    selectStyle,
    setSelectStyle,
  }
}
