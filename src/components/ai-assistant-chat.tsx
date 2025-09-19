"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bot, ExternalLink, Send, Sparkles, X, Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"
import { useCallback, useState, useEffect, useRef } from "react"
import { ChatMessage } from "@/components/ai-chat/chat-message"
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card"
import { SelectionCard } from "@/components/ai-chat/selection-cards"
import { TypingIndicator } from "@/components/ai-chat/typing-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiChat } from "@/hooks/use-ai-chat"
import { 
	useAIChatOpen, 
	useAIChatMessages, 
	useAIChatListening, 
	useAIChatSpeaking,
	useAIChatLoading,
	useAIChatActions 
} from "@/stores/app-store"
import { toast } from "sonner"

export function AiAssistantChat() {
	const [input, setInput] = useState("")
	const [isVoiceSupported, setIsVoiceSupported] = useState(false)
	
	// Use Zustand store for AI chat state
	const isOpen = useAIChatOpen()
	const messages = useAIChatMessages()
	const isListening = useAIChatListening()
	const isSpeaking = useAIChatSpeaking()
	const isLoading = useAIChatLoading()
	const { 
		setAIChatOpen, 
		toggleAIChat, 
		addAIChatMessage, 
		setAIChatListening, 
		setAIChatSpeaking,
		setAIChatLoading 
	} = useAIChatActions()
	
	const recognitionRef = useRef<any>(null)
	const synthRef = useRef<SpeechSynthesis | null>(null)
	
	const {
		lastUserMessage,
		sendMessage,
		retryLastMessage,
		handleSelection,
		handleChurrascoCalculate,
	} = useAiChat()

	// Configurar assistente de voz
	useEffect(() => {
		const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
		const speechSynthesis = window.speechSynthesis

		if (SpeechRecognition && speechSynthesis) {
			setIsVoiceSupported(true)
			synthRef.current = speechSynthesis

			const recognition = new SpeechRecognition()
			recognition.continuous = false
			recognition.interimResults = false
			recognition.lang = 'pt-BR'

			recognition.onstart = () => setAIChatListening(true)
			recognition.onend = () => setAIChatListening(false)
			recognition.onerror = () => setAIChatListening(false)

			recognition.onresult = (event: any) => {
				const transcript = event.results[0][0].transcript
				setInput(transcript)
				toast.success(`🎤 Entendi: "${transcript}"`)
				// Auto-enviar mensagem quando terminar de falar
				setTimeout(() => {
					sendMessage(transcript)
					setInput("")
				}, 500)
			}

			recognitionRef.current = recognition
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop()
			}
			if (synthRef.current) {
				synthRef.current.cancel()
			}
		}
	}, [sendMessage])

	// Ler respostas do assistente em voz alta
	useEffect(() => {
		if (isOpen && messages.length > 0) {
			const lastMessage = messages[messages.length - 1]
			if (lastMessage.role === 'assistant' && !lastMessage.isStreaming && !lastMessage.isError) {
				speakMessage(lastMessage.content)
			}
		}
	}, [messages, isOpen])

	const speakMessage = (text: string) => {
		if (!synthRef.current || !isVoiceSupported) return

		// Cancelar fala anterior
		synthRef.current.cancel()

		// Limpar markdown básico e links
		const cleanText = text
			.replace(/\*\*(.*?)\*\*/g, '$1') // **texto** -> texto
			.replace(/\*(.*?)\*/g, '$1') // *texto* -> texto
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [texto](link) -> texto
			.replace(/`([^`]+)`/g, '$1') // `código` -> código
			.replace(/#+\s*/g, '') // # título -> título
			.substring(0, 500) // Limitar tamanho

		const utterance = new SpeechSynthesisUtterance(cleanText)
		utterance.lang = 'pt-BR'
		utterance.rate = 0.9
		utterance.pitch = 1.1
		utterance.volume = 0.7

		utterance.onstart = () => setAIChatSpeaking(true)
		utterance.onend = () => setAIChatSpeaking(false)
		utterance.onerror = () => setAIChatSpeaking(false)

		synthRef.current.speak(utterance)
	}

	const startListening = () => {
		if (!recognitionRef.current) return
		try {
			recognitionRef.current.start()
		} catch (error) {
			console.error('Erro ao iniciar reconhecimento:', error)
		}
	}

	const stopListening = () => {
		if (recognitionRef.current) {
			recognitionRef.current.stop()
		}
	}

	const stopSpeaking = () => {
		if (synthRef.current) {
			synthRef.current.cancel()
			setAIChatSpeaking(false)
		}
	}

	const handleSendMessage = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault()
			if (!input.trim()) return

			await sendMessage(input)
			setInput("")
		},
		[input, sendMessage],
	)

	const handleOpenChat = useCallback(() => {
		setAIChatOpen(true)
	}, [setAIChatOpen])

	const handleCloseChat = useCallback(() => {
		setAIChatOpen(false)
	}, [setAIChatOpen])

	return (
		<div className="fixed bottom-4 right-4 z-[100]">
			<div className="relative">
				<AnimatePresence>
					{isOpen && (
						<motion.div
							key="chat"
							initial={{ opacity: 0, scale: 0.8, y: 50 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.7, y: 50, transition: { duration: 0.2 } }}
							transition={{
								duration: 0.4,
								type: "spring",
								stiffness: 300,
								damping: 30,
							}}
							className="absolute bottom-0 right-0 w-96"
						>
							<Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md dark:bg-gray-900/90">
								<CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
									<CardTitle className="flex items-center gap-2">
										<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
											<Bot className="h-4 w-4" />
										</div>
										Zé, o assistente
									</CardTitle>
									<div className="flex items-center gap-1">
										{isVoiceSupported && (
											<>
												<Button
													variant="ghost"
													size="icon"
													onClick={isSpeaking ? stopSpeaking : undefined}
													disabled={!isSpeaking}
													className="rounded-full h-8 w-8 text-white hover:bg-white/20 transition-colors"
													title={isSpeaking ? "Parar fala" : "Ouvindo..."}
												>
													{isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
												</Button>
												<Button
													variant="ghost"
													size="icon"
													onClick={isListening ? stopListening : startListening}
													disabled={isLoading}
													className={`rounded-full h-8 w-8 text-white hover:bg-white/20 transition-colors ${
														isListening ? 'bg-red-500/30 animate-pulse' : ''
													}`}
													title={isListening ? "Parar gravação" : "Falar com Zé"}
												>
													{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
												</Button>
											</>
										)}
										<Link href="/assistente">
											<Button
												variant="ghost"
												size="icon"
												className="rounded-full h-8 w-8 text-white hover:bg-white/20 transition-colors"
												title="Abrir em página completa"
											>
												<ExternalLink className="h-4 w-4" />
											</Button>
										</Link>
										<Button
											variant="ghost"
											size="icon"
											onClick={handleCloseChat}
											className="rounded-full h-8 w-8 text-white hover:bg-white/20 transition-colors"
										>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									<ScrollArea className="h-72 p-4">
										<div className="space-y-4">
											{messages.map((msg, index) => (
												<div key={index}>
													<ChatMessage
														role={msg.role}
														content={msg.content}
														isError={msg.isError}
														isStreaming={msg.isStreaming}
														onRetry={retryLastMessage}
														canRetry={msg.isError && !!lastUserMessage && !isLoading}
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
											{isLoading && <TypingIndicator />}
										</div>
									</ScrollArea>
									<form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
										<Input
											value={input}
											onChange={(e) => setInput(e.target.value)}
											placeholder={isListening ? "Ouvindo..." : "Como posso ajudar?"}
											disabled={isLoading || isListening}
											className={isListening ? "border-red-300 bg-red-50" : ""}
										/>
										{isVoiceSupported && (
											<Button
												type="button"
												size="icon"
												variant="outline"
												onClick={isListening ? stopListening : startListening}
												disabled={isLoading}
												className={`${isListening ? 'bg-red-100 border-red-300 text-red-600' : ''}`}
											>
												{isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
											</Button>
										)}
										<Button type="submit" size="icon" disabled={isLoading || isListening}>
											<Send className="h-4 w-4" />
										</Button>
									</form>
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
							className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-2xl border-2 ${
								isListening || isSpeaking 
									? 'border-red-400 shadow-red-400/50' 
									: 'border-white/20'
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
			</div>
		</div>
	)
}
