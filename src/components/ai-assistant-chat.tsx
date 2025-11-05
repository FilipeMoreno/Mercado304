"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bot, Camera, ExternalLink, Mic, Sparkles, Volume2, X } from "lucide-react"
import Link from "next/link"
import { Activity, useEffect, useRef, useState } from "react"
import { CarouselSuggestions } from "@/components/ai-chat/carousel-suggestions"
import { ChatMessage } from "@/components/ai-chat/chat-message"
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card"
import { EnhancedInput } from "@/components/ai-chat/enhanced-input"
import { EnhancedTypingIndicator } from "@/components/ai-chat/enhanced-typing-indicator"
import { SelectionCard } from "@/components/ai-chat/selection-cards"
import { ProductPhotoCapture } from "@/components/product-photo-capture"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiChat, useChatHistoryDB } from "@/hooks"

export function AiAssistantChat() {
	const [input, setInput] = useState("")
	const [isOpen, setIsOpen] = useState(false)
	const [showPhotoCapture, setShowPhotoCapture] = useState(false)
	const [isProcessingPhoto, _setIsProcessingPhoto] = useState(false)
	const [_capturedImagePreview, _setCapturedImagePrevieww] = useState<string | null>(null)
	const [_recognizedProduct, _setRecognizedProductt] = useState<any>(null)
	const [isDragOver, setIsDragOver] = useState(false)
	const [_showHistorySidebar, _setShowHistorySidebarr] = useState(false)
	const [isListening, setIsListening] = useState(false)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [isVoiceSupported, setIsVoiceSupported] = useState(false)
	const [_isVoiceInitialized, setIsVoiceInitialized] = useState(false)

	const recognitionRef = useRef<any>(null)
	const synthRef = useRef<SpeechSynthesis | null>(null)
	const _inputRef = useRef<HTMLInputElement>(null)

	const { sessions, currentSessionId, createNewSession, loadSession, deleteSession, renameSession, clearAllHistory } =
		useChatHistoryDB()

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
	const _handleNewChat = () => startNewChat()

	const handleSuggestionClick = (suggestion: string) => {
		setInput(suggestion)
		handleSendMessage(new Event("submit") as any)
	}

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return

		const message = input.trim()
		setInput("")
		await sendMessage(message)
	}

	const handlePhotoCapture = async (_file: File) => {
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
				console.error("Erro no reconhecimento de voz:", event.error)
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

	const _stopSpeaking = () => {
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

	const _handlePaste = async (e: React.ClipboardEvent) => {
		const items = Array.from(e.clipboardData.items)
		const imageItem = items.find((item) => item.type.startsWith("image/"))

		if (imageItem) {
			e.preventDefault()
			const file = imageItem.getAsFile()
			if (file) {
				await handlePhotoCapture(file)
			}
		}
	}

	return (
		<>
			<AnimatePresence mode="wait">
				{isOpen && (
					<>
						{/* Overlay backdrop - clique para fechar */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
							onClick={handleCloseChat}
						/>

						{/* Chat Container */}
						<motion.div
							key="chat"
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							transition={{
								type: "spring",
								stiffness: 300,
								damping: 25,
							}}
							className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-2xl h-[90vh] max-h-[800px] z-50"
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={(e) => e.stopPropagation()}
						>
							<Card className="h-full flex flex-col shadow-2xl border-2 bg-background/95 backdrop-blur-xl">
								{/* Header minimalista */}
								<CardHeader className="flex-shrink-0 p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="relative">
												<div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
													<Bot className="h-5 w-5 text-white" />
												</div>
												<div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
											</div>
											<div>
												<h3 className="text-base font-semibold text-foreground">Zé, o assistente</h3>
												{currentSession && (
													<p className="text-xs text-muted-foreground truncate max-w-[200px]">{currentSession.title}</p>
												)}
											</div>
										</div>
										<div className="flex items-center gap-1">
											<Link href="/assistente">
												<Button
													variant="ghost"
													size="icon"
													className="h-9 w-9 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
													title="Abrir em página completa"
												>
													<ExternalLink className="h-4 w-4" />
												</Button>
											</Link>
											<Button
												variant="ghost"
												size="icon"
												onClick={handleCloseChat}
												className="h-9 w-9 rounded-full hover:bg-white/50 dark:hover:bg-black/20"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardHeader>

								{/* Drag and Drop Overlay */}
								{isDragOver && (
									<motion.div
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary rounded-lg flex items-center justify-center z-20 backdrop-blur-sm"
									>
										<div className="text-center">
											<Camera className="h-16 w-16 text-primary mx-auto mb-3" />
											<p className="text-lg font-semibold text-primary">Solte a imagem aqui</p>
										</div>
									</motion.div>
								)}

								{/* Messages Area */}
								<CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
									<ScrollArea className="h-full">
										<div className="p-4 space-y-4">
											{/* Sugestões */}
											<CarouselSuggestions
												onSuggestionClick={handleSuggestionClick}
												isLoading={isLoading}
												hasMessages={messages.length > 1}
											/>

											{/* Messages */}
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

											{/* Loading Indicator */}
											<Activity mode={isLoading ? "visible" : "hidden"}>
												<EnhancedTypingIndicator
													context={
														lastUserMessage?.toLowerCase().includes("preço")
															? "price"
															: lastUserMessage?.toLowerCase().includes("lista")
																? "list"
																: lastUserMessage?.toLowerCase().includes("churrasco")
																	? "churrasco"
																	: undefined
													}
												/>
											</Activity>
										</div>
									</ScrollArea>
								</CardContent>

								{/* Input Area */}
								<div className="flex-shrink-0 p-4 border-t bg-muted/30">
									<EnhancedInput
										value={input}
										onChange={setInput}
										onSubmit={handleSendMessage}
										onPhotoCapture={() => setShowPhotoCapture(true)}
										onSuggestionClick={handleSuggestionClick}
										placeholder="Digite sua mensagem..."
										disabled={isLoading}
										isLoading={isLoading}
										isListening={isListening}
										onStartListening={startListening}
										onStopListening={stopListening}
										isVoiceSupported={isVoiceSupported}
									/>
								</div>
							</Card>
						</motion.div>
					</>
				)}
			</AnimatePresence>

			{/* Botão Flutuante */}
			{!isOpen && (
				<div className="fixed bottom-20 md:top-1/2 md:-translate-y-1/2 md:bottom-auto right-0 z-40">
					<motion.button
						key="bubble"
						onClick={handleOpenChat}
						initial={{ opacity: 0, x: 50 }}
						animate={{
							opacity: 1,
							x: 0,
						}}
						exit={{
							opacity: 0,
							x: 50,
							transition: { duration: 0.2 },
						}}
						whileHover={{
							x: -8,
						}}
						whileTap={{ scale: 0.95 }}
						transition={{
							duration: 0.3,
							type: "spring",
							stiffness: 400,
							damping: 20,
						}}
						className={`group h-14 w-10 rounded-l-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-lg border-l-2 border-y-2 cursor-pointer select-none relative overflow-visible ${
							isListening || isSpeaking ? "border-red-400 shadow-red-400/50" : "border-white/20"
						}`}
						title="Abrir Zé (Assistente IA)"
					>
						{/* Glow Animation - Camada 1 (externa) */}
						<motion.div
							className="absolute -left-2 w-12 h-16 rounded-l-full bg-blue-500/30 blur-md"
							animate={{
								opacity: [0.3, 0.6, 0.3],
								scale: [1, 1.1, 1],
							}}
							transition={{
								duration: 3,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
							}}
						/>
						{/* Glow Animation - Camada 2 (interna) */}
						<motion.div
							className="absolute -left-1 w-11 h-14 rounded-l-full bg-gradient-to-r from-blue-400/40 to-transparent blur-sm"
							animate={{
								opacity: [0.4, 0.7, 0.4],
							}}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: "easeInOut",
								delay: 0.5,
							}}
						/>
						{/* Ícone com glow sutil */}
						{isListening ? (
							<Mic className="h-5 w-5 text-white drop-shadow-lg animate-pulse relative z-10" />
						) : isSpeaking ? (
							<Volume2 className="h-5 w-5 text-white drop-shadow-lg animate-pulse relative z-10" />
						) : (
							<motion.div
								animate={{
									filter: [
										"drop-shadow(0 0 2px rgba(255,255,255,0.5))",
										"drop-shadow(0 0 6px rgba(255,255,255,0.8))",
										"drop-shadow(0 0 2px rgba(255,255,255,0.5))",
									],
								}}
								transition={{
									duration: 2.5,
									repeat: Number.POSITIVE_INFINITY,
									ease: "easeInOut",
								}}
								className="relative z-10"
							>
								<Sparkles className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
							</motion.div>
						)}
					</motion.button>
				</div>
			)}

			{/* Modal de Captura de Fotos */}
			{showPhotoCapture && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
						<div className="p-4 border-b flex items-center justify-between">
							<h3 className="text-lg font-semibold">Capturar Produto</h3>
							<Button variant="ghost" size="icon" onClick={() => setShowPhotoCapture(false)}>
								<X className="h-4 w-4" />
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
		</>
	)
}
