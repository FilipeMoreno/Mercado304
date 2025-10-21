"use client"

import { useEffect, useState } from "react"

export type SelectStyle = "traditional" | "dialog"

interface UIPreferences {
	selectStyle: SelectStyle
}

const DEFAULT_PREFERENCES: UIPreferences = {
	selectStyle: "dialog",
}

const STORAGE_KEY = "mercado304-ui-preferences"

export function useUIPreferences() {
	const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_PREFERENCES)
	const [isLoaded, setIsLoaded] = useState(false)

	// Carregar preferências do localStorage
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (stored) {
				const parsed = JSON.parse(stored)
				setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
			}
		} catch (error) {
			console.error("Error loading UI preferences:", error)
		} finally {
			setIsLoaded(true)
		}
	}, [])

	// Salvar preferências no localStorage
	const updatePreferences = (updates: Partial<UIPreferences>) => {
		const newPreferences = { ...preferences, ...updates }
		setPreferences(newPreferences)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences))
		} catch (error) {
			console.error("Error saving UI preferences:", error)
		}
	}

	const resetPreferences = () => {
		setPreferences(DEFAULT_PREFERENCES)
		try {
			localStorage.removeItem(STORAGE_KEY)
		} catch (error) {
			console.error("Error resetting UI preferences:", error)
		}
	}

	return {
		preferences,
		isLoaded,
		updatePreferences,
		resetPreferences,
		selectStyle: preferences.selectStyle,
		setSelectStyle: (style: SelectStyle) => updatePreferences({ selectStyle: style }),
	}
}
