"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"

interface MinimizedDialogInfo {
	id: string
	title: string
	isLoading: boolean
	processingMessage?: string
	onMaximize: () => void
	onClose: () => void
}

interface MinimizedDialogContextValue {
	dialogs: MinimizedDialogInfo[]
	registerDialog: (dialog: MinimizedDialogInfo) => void
	unregisterDialog: (id: string) => void
	updateDialog: (id: string, updates: Partial<MinimizedDialogInfo>) => void
}

const MinimizedDialogContext = createContext<MinimizedDialogContextValue | null>(null)

export function MinimizedDialogProvider({ children }: { children: React.ReactNode }) {
	const [dialogs, setDialogs] = useState<MinimizedDialogInfo[]>([])

const registerDialog = (dialog: MinimizedDialogInfo) => {
		setDialogs((prev) => {
			if (prev.some((d) => d.id === dialog.id)) {
				return prev
			}
			return [...prev, dialog]
		})
	}

const unregisterDialog = (id: string) => {
		setDialogs((prev) => prev.filter((d) => d.id !== id))
	}

const updateDialog = (id: string, updates: Partial<MinimizedDialogInfo>) => {
		setDialogs((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
	}

	return (
		<MinimizedDialogContext.Provider
			value={{
				dialogs,
				registerDialog,
				unregisterDialog,
				updateDialog,
			}}
		>
			{children}
		</MinimizedDialogContext.Provider>
	)
}

export function useMinimizedDialogManager() {
	const context = useContext(MinimizedDialogContext)
	if (!context) {
		throw new Error("useMinimizedDialogManager must be used within MinimizedDialogProvider")
	}
	return context
}

export function useMinimizedDialog(
	id: string,
	title: string,
	isLoading: boolean,
	onMaximize: () => void,
	onClose: () => void,
	processingMessage?: string
) {
	const { registerDialog, unregisterDialog, updateDialog } = useMinimizedDialogManager()
	const isRegistered = useRef(false)

	// Registrar o dialog quando o componente é montado
	useEffect(() => {
		if (!isRegistered.current) {
			registerDialog({
				id,
				title,
				isLoading,
				processingMessage,
				onMaximize,
				onClose,
			})
			isRegistered.current = true
		}

		// Cleanup: desregistrar quando desmontado
		return () => {
			if (isRegistered.current) {
				unregisterDialog(id)
				isRegistered.current = false
			}
		}
}, [id])

	// Atualizar informações quando mudarem
	useEffect(() => {
		if (isRegistered.current) {
			updateDialog(id, {
				title,
				isLoading,
				processingMessage,
				onMaximize,
				onClose,
			})
		}
	}, [id, title, isLoading, processingMessage, onMaximize, onClose, updateDialog])

	return {
		registerDialog,
		unregisterDialog,
		updateDialog,
	}
}
