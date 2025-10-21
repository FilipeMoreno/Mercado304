"use client"

import { motion } from "framer-motion"
import { ArrowUp, Camera, Loader2, Mic, MicOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
	value: string
	onChange: (value: string) => void
	onSubmit: (message: string) => void
	onPhotoCapture: () => void
	disabled?: boolean
	isLoading?: boolean
	placeholder?: string
	maxLength?: number
	showVoiceButton?: boolean
	onVoiceStart?: () => void
	onVoiceStop?: () => void
	isListening?: boolean
}

export function ChatInput({
	value,
	onChange,
	onSubmit,
	onPhotoCapture,
	disabled = false,
	isLoading = false,
	placeholder = "Mensagem para o Zé...",
	maxLength = 4000,
	showVoiceButton = false,
	onVoiceStart,
	onVoiceStop,
	isListening = false,
}: ChatInputProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const [isFocused, setIsFocused] = useState(false)

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto"
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
		}
	}, [])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!value.trim() || disabled || isLoading) return

		onSubmit(value.trim())
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	const canSubmit = value.trim().length > 0 && !disabled && !isLoading
	const characterCount = value.length
	const isNearLimit = characterCount > maxLength * 0.8

	return (
		<div className="w-full">
			<form onSubmit={handleSubmit} className="relative">
				<motion.div
					animate={{
						borderColor: isFocused ? "#3b82f6" : "#e5e7eb",
						backgroundColor: isFocused ? "#ffffff" : "#f9fafb",
					}}
					transition={{ duration: 0.2 }}
					className="flex items-end gap-2 p-3 border rounded-2xl shadow-xs"
				>
					{/* Botão de Anexo/Câmera */}
					<div className="flex items-center gap-1">
						<Button
							type="button"
							variant="ghost"
							size="icon"
							onClick={onPhotoCapture}
							disabled={disabled || isLoading}
							className="size-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100 shrink-0"
							title="Capturar foto"
						>
							<Camera className="size-4" />
						</Button>

						{showVoiceButton && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={isListening ? onVoiceStop : onVoiceStart}
								disabled={disabled || isLoading}
								className={`h-8 w-8 shrink-0 transition-colors ${
									isListening
										? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100"
										: "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
								}`}
								title={isListening ? "Parar gravação" : "Gravar áudio"}
							>
								{isListening ? <MicOff className="size-4 animate-pulse" /> : <Mic className="size-4" />}
							</Button>
						)}
					</div>

					{/* Textarea */}
					<div className="flex-1 relative">
						<Textarea
							ref={textareaRef}
							value={value}
							onChange={(e) => onChange(e.target.value)}
							onKeyDown={handleKeyDown}
							onFocus={() => setIsFocused(true)}
							onBlur={() => setIsFocused(false)}
							placeholder={isListening ? "🎤 Ouvindo... Fale agora" : placeholder}
							disabled={disabled || isLoading}
							maxLength={maxLength}
							className="min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 pr-8"
							rows={1}
						/>

						{/* Contador de caracteres */}
						{(isFocused || isNearLimit) && (
							<motion.div
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								className={`absolute bottom-1 right-1 text-xs ${
									characterCount > maxLength ? "text-red-500" : isNearLimit ? "text-orange-500" : "text-gray-400"
								}`}
							>
								{characterCount}/{maxLength}
							</motion.div>
						)}
					</div>

					{/* Botão de Envio */}
					<Button
						type="submit"
						disabled={!canSubmit}
						size="icon"
						className={`h-8 w-8 shrink-0 transition-all duration-200 ${
							canSubmit
								? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
								: "bg-gray-200 text-gray-400 cursor-not-allowed"
						}`}
					>
						{isLoading ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
					</Button>
				</motion.div>

				{/* Dicas */}
				<div className="flex items-center justify-between mt-2 px-1">
					<div className="flex items-center gap-4 text-xs text-gray-500">
						<span>Enter para enviar</span>
						<span>Shift+Enter para nova linha</span>
					</div>

					{isListening && (
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							className="flex items-center gap-2 text-xs text-red-500"
						>
							<div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
							Gravando...
						</motion.div>
					)}
				</div>
			</form>
		</div>
	)
}
