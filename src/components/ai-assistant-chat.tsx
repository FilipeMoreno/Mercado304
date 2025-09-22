"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Bot, ExternalLink, Mic, MicOff, Send, Sparkles, Volume2, VolumeX, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ChatMessage } from "@/components/ai-chat/chat-message"
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card"
import { SelectionCard } from "@/components/ai-chat/selection-cards"
import { TypingIndicator } from "@/components/ai-chat/typing-indicator"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiChat } from "@/hooks/use-ai-chat"

export function AiAssistantChat() {
	const [input, setInput] = useState("")
	const [isOpen, setIsOpen] = useState(false)
	const [isListening, setIsListening] = useState(false)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [isVoiceSupported, setIsVoiceSupported] = useState(false)
	const [isVoiceInitialized, setIsVoiceInitialized] = useState(false)

	const recognitionRef = useRef<any>(null)
	const synthRef = useRef<SpeechSynthesis | null>(null)

	const {
		messages,
		isLoading,
		lastUserMessage,
		sendMessage,
		retryLastMessage,
		handleSelection,
		handleChurrascoCalculate,
		addMessage,
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
			recognition.interimResults = true // Habilitar resultados intermediários
			recognition.lang = "pt-BR"
			recognition.maxAlternatives = 1

			recognition.onstart = () => {
				setIsListening(true)
				// Adicionar mensagem informativa no chat (não enviada para o assistente)
				addMessage({
					role: "assistant",
					content: "🎤 Ouvindo... Fale agora",
				})
			}

			recognition.onend = () => {
				setIsListening(false)
			}

			recognition.onerror = (event: any) => {
				setIsListening(false)
				console.error("Erro no reconhecimento de voz:", event.error)
				
				// Não mostrar toast para erros comuns que não são críticos
				if (event.error === "no-speech") {
					// Silencioso - usuário pode não ter falado
					return
				}
				
				switch (event.error) {
					case "audio-capture":
						addMessage({
							role: "assistant",
							content: "❌ Erro no microfone. Verifique as permissões.",
						})
						break
					case "not-allowed":
						addMessage({
							role: "assistant",
							content: "❌ Permissão de microfone negada.",
						})
						break
					case "network":
						addMessage({
							role: "assistant",
							content: "❌ Erro de rede. Verifique sua conexão.",
						})
						break
					case "aborted":
						// Silencioso - reconhecimento foi cancelado intencionalmente
						break
					default:
						addMessage({
							role: "assistant",
							content: "❌ Erro no reconhecimento de voz. Tente novamente.",
						})
				}
			}

			recognition.onresult = (event: any) => {
				let finalTranscript = ""
				let interimTranscript = ""

				// Processar resultados intermediários e finais
				for (let i = event.resultIndex; i < event.results.length; i++) {
					const transcript = event.results[i][0].transcript
					if (event.results[i].isFinal) {
						finalTranscript += transcript
					} else {
						interimTranscript += transcript
					}
				}

				// Atualizar input com resultado intermediário
				if (interimTranscript) {
					setInput(interimTranscript)
				}

				// Processar resultado final
				if (finalTranscript) {
					const cleanTranscript = finalTranscript.trim()
					if (cleanTranscript) {
						setInput(cleanTranscript)
						
						// Auto-enviar mensagem quando terminar de falar
						setTimeout(() => {
							sendMessage(cleanTranscript)
							setInput("")
						}, 800) // Aumentar delay para dar tempo de processar
					}
				}
			}

			recognitionRef.current = recognition
			setIsVoiceInitialized(true)
		} else {
			setIsVoiceSupported(false)
			setIsVoiceInitialized(false)
		}

		return () => {
			if (recognitionRef.current) {
				recognitionRef.current.stop()
			}
			if (synthRef.current) {
				synthRef.current.cancel()
			}
		}
	}, [sendMessage, addMessage])

	const speakMessage = useCallback(
		(text: string) => {
			if (!synthRef.current || !isVoiceSupported) return

			// Cancelar fala anterior
			synthRef.current.cancel()

			// Limpar markdown básico e links
			const cleanText = text
				.replace(/\*\*(.*?)\*\*/g, "$1") // **texto** -> texto
				.replace(/\*(.*?)\*/g, "$1") // *texto* -> texto
				.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [texto](link) -> texto
				.replace(/`([^`]+)`/g, "$1") // `código` -> código
				.replace(/#+\s*/g, "") // # título -> título
				.substring(0, 500) // Limitar tamanho

			const utterance = new SpeechSynthesisUtterance(cleanText)
			utterance.lang = "pt-BR"
			utterance.rate = 0.9
			utterance.pitch = 1.1
			utterance.volume = 0.7

			utterance.onstart = () => setIsSpeaking(true)
			utterance.onend = () => setIsSpeaking(false)
			utterance.onerror = () => setIsSpeaking(false)

			synthRef.current.speak(utterance)
		},
		[isVoiceSupported],
	)

	// Ler respostas do assistente em voz alta
	useEffect(() => {
		if (isOpen && messages.length > 0) {
			const lastMessage = messages[messages.length - 1]
			if (lastMessage.role === "assistant" && !lastMessage.isStreaming && !lastMessage.isError) {
				speakMessage(lastMessage.content)
			}
		}
	}, [messages, isOpen, speakMessage])

	const startListening = () => {
		if (!recognitionRef.current || isListening || !isVoiceInitialized) return
		
		try {
			// Parar qualquer reconhecimento anterior
			if (recognitionRef.current) {
				recognitionRef.current.stop()
			}
			
			// Pequeno delay para garantir que o stop anterior foi processado
			setTimeout(() => {
				try {
					if (recognitionRef.current && !isListening) {
						recognitionRef.current.start()
					}
				} catch (error) {
					console.error("Erro ao iniciar reconhecimento:", error)
					addMessage({
						role: "assistant",
						content: "❌ Erro ao iniciar gravação. Tente novamente.",
					})
				}
			}, 200) // Aumentar delay para mobile
		} catch (error) {
			console.error("Erro ao preparar reconhecimento:", error)
			addMessage({
				role: "assistant",
				content: "❌ Erro ao preparar gravação. Tente novamente.",
			})
		}
	}

	const stopListening = () => {
		if (recognitionRef.current && isListening) {
			try {
				recognitionRef.current.stop()
			} catch (error) {
				console.error("Erro ao parar reconhecimento:", error)
			}
		}
	}

	const stopSpeaking = () => {
		if (synthRef.current) {
			synthRef.current.cancel()
			setIsSpeaking(false)
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
		setIsOpen(true)
	}, [])

	const handleCloseChat = useCallback(() => {
		setIsOpen(false)
	}, [])

	return (
		<div className="fixed bottom-4 right-4 z-[100]">
			<div className="relative">
				<AnimatePresence>
					{isOpen && (
						<motion.div
							key="chat"
							initial={{ opacity: 0, scale: 0.8, y: 100 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.7, y: 100 }}
							transition={{
								duration: 0.3,
								type: "spring",
								stiffness: 300,
								damping: 30,
							}}
							className="absolute bottom-4 right-0 w-[calc(100vw-2rem)] sm:w-96 max-h-[80vh] sm:max-w-96"
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
														isListening ? "bg-red-500/30 animate-pulse" : ""
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
									<ScrollArea className="h-96 p-4">
										<div className="space-y-4">
											{messages.map((msg, index) => (
												<div key={`${msg.role}-${index}`}>
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
											placeholder={isListening ? "🎤 Ouvindo... Fale agora" : "Como posso ajudar?"}
											disabled={isLoading || isListening}
											className={isListening ? "border-red-300 bg-red-50 animate-pulse" : ""}
										/>
										{isVoiceSupported && (
											<Button
												type="button"
												size="icon"
												variant="outline"
												onClick={isListening ? stopListening : startListening}
												disabled={isLoading || !isVoiceInitialized}
												className={`${isListening ? "bg-red-100 border-red-300 text-red-600 animate-pulse" : ""} ${!isVoiceInitialized ? "opacity-50" : ""}`}
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
							className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-2xl border-2 cursor-pointer select-none ${
								isListening || isSpeaking ? "border-red-400 shadow-red-400/50" : "border-white/20"
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
