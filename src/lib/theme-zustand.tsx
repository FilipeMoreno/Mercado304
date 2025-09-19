"use client"

import type React from "react"
import { useEffect } from "react"
import { useTheme as useZustandTheme, useThemeActions } from "@/stores/app-store"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
	children: React.ReactNode
	defaultTheme?: Theme
	storageKey?: string
}

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "mercado304-theme",
}: ThemeProviderProps) {
	const theme = useZustandTheme()
	const { setTheme } = useThemeActions()

	// Initialize theme from localStorage on first render
	useEffect(() => {
		if (typeof window !== "undefined") {
			const storedTheme = localStorage.getItem(storageKey) as Theme
			if (storedTheme && storedTheme !== theme) {
				setTheme(storedTheme)
			}
		}
	}, [setTheme, storageKey, theme])

	// Apply theme changes to document
	useEffect(() => {
		const root = window.document.documentElement

		root.classList.remove("light", "dark")

		if (theme === "system") {
			const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
			root.classList.add(systemTheme)
			return
		}

		root.classList.add(theme)
	}, [theme])

	// Save theme to localStorage when it changes
	useEffect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem(storageKey, theme)
		}
	}, [theme, storageKey])

	return <>{children}</>
}

// Custom hook that uses Zustand store
export const useTheme = () => {
	const theme = useZustandTheme()
	const { setTheme } = useThemeActions()

	return {
		theme,
		setTheme,
	}
}