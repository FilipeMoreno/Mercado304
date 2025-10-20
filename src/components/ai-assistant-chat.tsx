"use client"

import { motion, AnimatePresence } from "framer-motion"
import {
	Bot,
	Camera,
	ExternalLink,
	Mic, Sparkles,
	Volume2, X
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChatMessage } from "@/components/ai-chat/chat-message"
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card"
import { SelectionCard } from "@/components/ai-chat/selection-cards"
import { EnhancedTypingIndicator } from "@/components/ai-chat/enhanced-typing-indicator"
import { CarouselSuggestions } from "@/components/ai-chat/carousel-suggestions"
import { EnhancedInput } from "@/components/ai-chat/enhanced-input"
import { ProductPhotoCapture } from "@/components/product-photo-capture"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiChat, useChatHistoryDB } from "@/hooks"

export function AiAssistantChat() {
	const [input, setInput] = useState("")
	const [isOpen, setIsOpen] = useState(false)
	const [showPhotoCapture, setShowPhotoCapture] = useState(false)
	const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
	const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null)
	const [recognizedProduct, setRecognizedProduct] = useState<any>(null)
	const [isDragOver, setIsDragOver] = useState(false)
	const [showHistorySidebar, setShowHistorySidebar] = useState(false)
	const [isListening, setIsListening] = useState(false)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [isVoiceSupported, setIsVoiceSupported] = useState(false)
	const [isVoiceInitialized, setIsVoiceInitialized] = useState(false)

	const recognitionRef = useRef<any>(null)
	const synthRef = useRef<SpeechSynthesis | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const {
		sessions,
		currentSessionId,
		createNewSession,
		loadSession,
		deleteSession,
		renameSession,
		clearAllHistory,
	} = useChatHistoryDB()

	const {
		messages,
		isLoading,
		lastUserMessage,
		sendMessage,
		retryLastMessage,
		handleSelection,
		handleChurrascoCalculate,
		addMessage,
		startNewChat,
		loadChat,
		currentSession,
	} = useAiChat(currentSessionId)

	// Handlers
	const handleOpenChat = () => setIsOpen(true)
	const handleCloseChat = () => setIsOpen(false)
	const handleNewChat = () => startNewChat()

	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion)
		handleSendMessage(new Event('submit') as any)
	}

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return

		const message = input.trim()
		setInput("")
		await sendMessage(message)
	}

	const handlePhotoCapture = async (file: File) => {
		// Implementar lógica de captura de foto
		setShowPhotoCapture(false)
	}

	// Configurar assistente de voz
	useEffect(() => {
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
		const speechSynthesis = window.speechSynthesis

		if (SpeechRecognition && speechSynthesis) {
			setIsVoiceSupported(true)
			synthRef.current = speechSynthesis

			const recognition = new SpeechRecognition()
			recognition.continuous = false
			recognition.interimResults = true
			recognition.lang = "pt-BR"
			recognition.maxAlternatives = 1

			recognition.onstart = () => {
				setIsListening(true)
			}

			recognition.onend = () => {
				setIsListening(false)
			}

			recognition.onresult = (event: any) => {
				const transcript = event.results[event.results.length - 1][0].transcript
				if (event.results[event.results.length - 1].isFinal) {
					setInput(transcript)
					setIsListening(false)
				}
			}

			recognition.onerror = (event: any) => {
				console.error('Erro no reconhecimento de voz:', event.error)
				setIsListening(false)
			}

			recognitionRef.current = recognition
			setIsVoiceInitialized(true)
		}
	}, [])

	// Voice handlers
	const startListening = () => {
		if (recognitionRef.current && !isListening) {
			recognitionRef.current.start()
		}
	}

	const stopListening = () => {
		if (recognitionRef.current && isListening) {
			recognitionRef.current.stop()
		}
	}

	const stopSpeaking = () => {
		if (synthRef.current) {
			synthRef.current.cancel()
			setIsSpeaking(false)
		}
	}


	// Drag and drop handlers
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(true)
	}

	const handleDragLeave = () => setIsDragOver(false)

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		setIsDragOver(false)
		// Implementar lógica de drop
	}

	const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
		const items = Array.from(e.clipboardData.items)
		const imageItem = items.find(item => item.type.startsWith('image/'))

		if (imageItem) {
			e.preventDefault()
			const file = imageItem.getAsFile()
			if (file) {
				await handlePhotoCapture(file)
			}
		}
	}, [])

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<AnimatePresence mode="wait">
				{isOpen && (
					<motion.div
						key="chat"
						initial={{ opacity: 0, scale: 0.8, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.8, y: 20 }}
						transition={{
							type: "spring",
							stiffness: 400,
							damping: 30,
						}}
						className="absolute bottom-4 right-0 w-[calc(100vw-2rem)] sm:w-96 h-[600px] sm:max-w-96"
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					>
						<Card className="shadow-2xl border bg-background/95 backdrop-blur-md relative flex flex-col h-full">
							{/* Overlay para drag and drop */}
							{isDragOver && (
								<div className="absolute inset-0 bg-primary/20 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
									<div className="text-center">
										<Camera className="size-12 text-primary mx-auto mb-2" />
										<p className="text-primary font-medium">Solte a imagem aqui para enviar</p>
									</div>
								</div>
							)}

							<CardHeader className="flex flex-row items-center justify-between bg-accent border-b rounded-t-lg shrink-0">
								<CardTitle className="flex items-center gap-2">
									<div className="size-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
										<Bot className="size-4 text-white" />
									</div>
									<div className="flex flex-col">
										<span className="text-sm font-semibold text-foreground">Zé, o assistente</span>
										{currentSession && (
											<span className="text-xs text-muted-foreground truncate max-w-32">
												{currentSession.title}
											</span>
										)}
									</div>
								</CardTitle>
								<div className="flex items-center gap-1">
									<Link href="/assistente">
										<Button
											variant="ghost"
											size="icon"
											className="rounded-full size-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
											title="Abrir em página completa"
										>
											<ExternalLink className="size-4" />
										</Button>
									</Link>
									<Button
										variant="ghost"
										size="icon"
										onClick={handleCloseChat}
										className="rounded-full size-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
									>
										<X className="size-4" />
									</Button>
								</div>
							</CardHeader>

							<CardContent className="p-0 flex-1 flex flex-col min-h-0">
								<ScrollArea className="flex-1 min-h-0">
									<div className="p-4 space-y-4">
										{/* Sugestões em Carrossel */}
										<CarouselSuggestions
											onSuggestionClick={handleSuggestionClick}
											isLoading={isLoading}
											hasMessages={messages.length > 1}
										/>

										{messages.map((msg, index) => (
											<div key={`${msg.role}-${index}`}>
												<ChatMessage
													role={msg.role}
													content={msg.content}
													isError={msg.isError}
													isStreaming={msg.isStreaming}
													onRetry={retryLastMessage}
													canRetry={msg.isError && !!lastUserMessage && !isLoading}
													imagePreview={msg.imagePreview}
													productData={msg.productData}
													onAddMessage={addMessage}
												/>
												{msg.selectionCard && (
													<div className="mt-3 ml-8">
														{msg.selectionCard.type === "churrascometro" ? (
															<ChurrascoCard onCalculate={handleChurrascoCalculate} />
														) : (
															<SelectionCard
																type={msg.selectionCard.type}
																options={msg.selectionCard.options}
																searchTerm={msg.selectionCard.searchTerm}
																context={msg.selectionCard.context}
																onSelect={handleSelection}
															/>
														)}
													</div>
												)}
											</div>
										))}
										{isLoading && (
											<EnhancedTypingIndicator
												context={lastUserMessage?.toLowerCase().includes('preço') ? 'price' :
													lastUserMessage?.toLowerCase().includes('lista') ? 'list' :
														lastUserMessage?.toLowerCase().includes('churrasco') ? 'churrasco' :
															undefined}
											/>
										)}
									</div>
								</ScrollArea>

								<div className="p-4 border-t shrink-0">
									<EnhancedInput
										value={input}
										onChange={setInput}
										onSubmit={handleSendMessage}
										onPhotoCapture={() => setShowPhotoCapture(true)}
										onSuggestionClick={handleSuggestionClick}
										placeholder="Como posso ajudar?"
										disabled={isLoading}
										isLoading={isLoading}
										isListening={isListening}
										onStartListening={startListening}
										onStopListening={stopListening}
										isVoiceSupported={isVoiceSupported}
									/>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}

				{!isOpen && (
					<motion.button
						key="bubble"
						onClick={handleOpenChat}
						initial={{ opacity: 0, scale: 0.5, y: 40 }}
						animate={{
							opacity: 1,
							scale: 1,
							y: 0,
							boxShadow: [
								"0 4px 20px rgba(59, 130, 246, 0.4)",
								"0 8px 30px rgba(59, 130, 246, 0.6)",
								"0 4px 20px rgba(59, 130, 246, 0.4)",
							],
						}}
						exit={{
							opacity: 0,
							scale: 0.3,
							y: 40,
							transition: { duration: 0.2 },
						}}
						whileHover={{
							scale: 1.1,
							boxShadow: "0 10px 40px rgba(59, 130, 246, 0.8)",
						}}
						whileTap={{ scale: 0.95 }}
						transition={{
							duration: 0.3,
							type: "spring",
							stiffness: 400,
							damping: 20,
							boxShadow: {
								duration: 2,
								repeat: Infinity,
								repeatType: "reverse",
							},
						}}
						className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-2xl border-2 cursor-pointer select-none relative ${isListening || isSpeaking ? "border-red-400 shadow-red-400/50" : "border-white/20"
							}`}
					>
						{isListening ? (
							<Mic className="h-7 w-7 text-white drop-shadow-lg animate-pulse" />
						) : isSpeaking ? (
							<Volume2 className="h-7 w-7 text-white drop-shadow-lg animate-pulse" />
						) : (
							<Sparkles className="h-7 w-7 text-white drop-shadow-lg" />
						)}
					</motion.button>
				)}
			</AnimatePresence>

			{/* Modal de Captura de Fotos */}
			{showPhotoCapture && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
						<div className="p-4 border-b flex items-center justify-between">
							<h3 className="text-lg font-semibold">Capturar Produto</h3>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setShowPhotoCapture(false)}
							>
								<X className="size-4" />
							</Button>
						</div>
						<div className="p-4">
							<ProductPhotoCapture
								onPhotoCapture={handlePhotoCapture}
								onClose={() => setShowPhotoCapture(false)}
								isProcessing={isProcessingPhoto}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
