import { useState } from "react"

interface UseSmartCameraOptions {
	onCapture?: (file: File) => void | Promise<void>
	mode?: "auto" | "native" | "web"
	quality?: number
	maxWidth?: number
	maxHeight?: number
}

export function useSmartCamera(options: UseSmartCameraOptions = {}) {
	const [isOpen, setIsOpen] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [capturedFile, setCapturedFile] = useState<File | null>(null)

const open = () => {
		setIsOpen(true)
}

const close = () => {
		setIsOpen(false)
}

const handleCapture = async (file: File) => {
			setCapturedFile(file)

			if (options.onCapture) {
				setIsProcessing(true)
				try {
					await options.onCapture(file)
				} catch (error) {
					console.error("Erro ao processar captura:", error)
					throw error
				} finally {
					setIsProcessing(false)
				}
			}
		}

const clear = () => {
		setCapturedFile(null)
}

	return {
		isOpen,
		open,
		close,
		isProcessing,
		capturedFile,
		handleCapture,
		clear,
		// Configurações
		mode: options.mode || "auto",
		quality: options.quality || 0.85,
		maxWidth: options.maxWidth || 1920,
		maxHeight: options.maxHeight || 1080,
	}
}
