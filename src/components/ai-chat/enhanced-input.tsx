"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
	Plus,
	Mic,
	MicOff,
	ArrowUp,
	Paperclip, List,
	Calculator,
	Search,
	BarChart3,
	AlertTriangle,
	TrendingDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface EnhancedInputProps {
	value: string
	onChange: (value: string) => void
	onSubmit: (e: React.FormEvent) => void
	onPhotoCapture: () => void
	onSuggestionClick: (suggestion: string) => void
	placeholder?: string
	disabled?: boolean
	isLoading?: boolean
	isListening?: boolean
	onStartListening?: () => void
	onStopListening?: () => void
	isVoiceSupported?: boolean
}

const quickSuggestions = [
	{
		id: "add-photo",
		text: "Adicionar fotos e arquivos",
		icon: <Paperclip className="h-4 w-4" />,
		action: "photo"
	},
	{
		id: "create-list",
		text: "Criar lista de compras",
		command: "Crie uma lista de compras para a semana",
		icon: <List className="h-4 w-4" />
	},
	{
		id: "compare-prices",
		text: "Comparar preços",
		command: "Compare os preços dos produtos que mais compro",
		icon: <TrendingDown className="h-4 w-4" />
	},
	{
		id: "calculate-churrasco",
		text: "Calcular churrasco",
		command: "Calcule as quantidades para um churrasco de 10 pessoas",
		icon: <Calculator className="h-4 w-4" />
	},
	{
		id: "search-products",
		text: "Buscar produtos",
		command: "Busque produtos em promoção no mercado",
		icon: <Search className="h-4 w-4" />
	},
	{
		id: "stock-alerts",
		text: "Alertas de estoque",
		command: "Configure alertas para produtos em falta",
		icon: <AlertTriangle className="h-4 w-4" />
	},
	{
		id: "expense-analysis",
		text: "Análise de gastos",
		command: "Analise meus gastos do último mês",
		icon: <BarChart3 className="h-4 w-4" />
	}
]

export function EnhancedInput({
	value,
	onChange,
	onSubmit,
	onPhotoCapture,
	onSuggestionClick,
	placeholder = "Mensagem para o Zé...",
	disabled = false,
	isLoading = false,
	isListening = false,
	onStartListening,
	onStopListening,
	isVoiceSupported = false
}: EnhancedInputProps) {
	const [showSuggestions, setShowSuggestions] = useState(false)
	const [isFocused, setIsFocused] = useState(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	// Detectar quando o usuário digita "/"
	useEffect(() => {
		if (value === "/" || (value.length > 0 && value[value.length - 1] === "/" && value.length === 1)) {
			setShowSuggestions(true)
		} else {
			setShowSuggestions(false)
		}
	}, [value])

	const handleSuggestionSelect = useCallback((suggestion: typeof quickSuggestions[0]) => {
		if (suggestion.action === "photo") {
			onPhotoCapture()
		} else if (suggestion.command) {
			onChange(suggestion.command)
			onSuggestionClick(suggestion.command)
		}
		setShowSuggestions(false)
	}, [onChange, onPhotoCapture, onSuggestionClick])

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			if (showSuggestions) {
				setShowSuggestions(false)
				return
			}
			onSubmit(e as any)
		} else if (e.key === 'Escape') {
			setShowSuggestions(false)
		}
	}, [onSubmit, showSuggestions])

	const handleVoiceToggle = useCallback(() => {
		if (isListening) {
			onStopListening?.()
		} else {
			onStartListening?.()
		}
	}, [isListening, onStartListening, onStopListening])

	return (
		<div className="relative">
			{/* Sugestões */}
			<AnimatePresence>
				{showSuggestions && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg shadow-lg p-2 z-50"
					>
						<div className="space-y-1">
							{quickSuggestions.map((suggestion) => (
								<Button
									key={suggestion.id}
									variant="ghost"
									size="sm"
									onClick={() => handleSuggestionSelect(suggestion)}
									className="w-full justify-start gap-3 h-auto p-3 text-left hover:bg-muted"
								>
									<div className="text-muted-foreground">
										{suggestion.icon}
									</div>
									<span className="text-sm text-foreground">
										{suggestion.text}
									</span>
								</Button>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Input Container */}
			<div className={`flex items-end gap-2 p-3 border rounded-2xl bg-muted transition-all ${
				isFocused ? 'bg-background border-primary' : 'border-input'
			} ${isListening ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : ''}`}>
				
				{/* Botão Plus */}
				<Button
					type="button"
					variant="ghost"
					size="icon"
					onClick={onPhotoCapture}
					disabled={disabled}
					className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
				>
					<Plus className="h-4 w-4" />
				</Button>

				{/* Textarea */}
				<Textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onKeyDown={handleKeyDown}
					onFocus={() => setIsFocused(true)}
					onBlur={() => setIsFocused(false)}
					placeholder={isListening ? "🎤 Ouvindo... Fale agora" : placeholder}
					disabled={disabled || isListening}
					className="flex-1 min-h-[20px] max-h-[120px] resize-none border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
					rows={1}
				/>

				{/* Botão de Voz */}
				{isVoiceSupported && (
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onClick={handleVoiceToggle}
						disabled={disabled}
						className={`flex-shrink-0 h-8 w-8 rounded-lg transition-colors ${
							isListening 
								? 'text-red-600 hover:text-red-700 bg-red-100 dark:bg-red-950/30' 
								: 'text-muted-foreground hover:text-foreground hover:bg-muted'
						}`}
					>
						{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
					</Button>
				)}

				{/* Botão Enviar */}
				<Button
					type="submit"
					disabled={!value.trim() || disabled || isLoading}
					size="icon"
					className="flex-shrink-0 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
				>
					<ArrowUp className="h-4 w-4" />
				</Button>
			</div>

			{/* Dica */}
			<div className="flex items-center justify-center mt-2">
				<p className="text-xs text-muted-foreground">
					Digite "/" para sugestões • Pressione Enter para enviar
				</p>
			</div>
		</div>
	)
}
