"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/lib/theme"
import {
	Bot, Camera, Menu, Mic,
	Plus, Settings, X
} from "lucide-react"
import { ChatMessage } from "@/components/ai-chat/chat-message"
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card"
import { SelectionCard } from "@/components/ai-chat/selection-cards"
import { EnhancedTypingIndicator } from "@/components/ai-chat/enhanced-typing-indicator"
import { SmartSuggestions } from "@/components/ai-chat/smart-suggestions"
import { EnhancedInput } from "@/components/ai-chat/enhanced-input"
import { ChatGPTSidebar } from "@/components/ai-chat/chatgpt-sidebar"
import { ProductPhotoCapture } from "@/components/product-photo-capture"
import { AudioRecorder } from "@/components/audio-recorder/audio-recorder"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiChat, useChatHistory } from "@/hooks"
import { SimpleSuggestions } from "@/components/ai-chat/simple-suggestions"

export default function CleanAssistentePage() {
	const { theme } = useTheme()
	const [input, setInput] = useState("")
	const [showPhotoCapture, setShowPhotoCapture] = useState(false)
	const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
	const [showHistorySidebar, setShowHistorySidebar] = useState(false)
	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
	const [isListening, setIsListening] = useState(false)
	const [isSpeaking, setIsSpeaking] = useState(false)
	const [isVoiceSupported, setIsVoiceSupported] = useState(false)
	const [isVoiceInitialized, setIsVoiceInitialized] = useState(false)
	const [isUsingAudioRecorder, setIsUsingAudioRecorder] = useState(false)

	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const scrollAreaRef = useRef<HTMLDivElement>(null)
	const recognitionRef = useRef<any>(null)
	const synthRef = useRef<SpeechSynthesis | null>(null)

	const {
		sessions,
		currentSessionId,
		createNewSession,
		loadSession,
		deleteSession,
		renameSession,
		clearAllHistory,
	} = useChatHistory()

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

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
		}
	}, [input])

	// Auto-scroll to bottom
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
			if (scrollElement) {
				scrollElement.scrollTop = scrollElement.scrollHeight
			}
		}
	}, [messages, isLoading])

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return

		const message = input.trim()
		setInput("")
		await sendMessage(message)
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSendMessage(e)
		}
	}

	const handleSuggestionClick = async (suggestion: string) => {
		await sendMessage(suggestion)
	}

	const handleNewChat = () => {
		const newSession = startNewChat()
		setShowHistorySidebar(false)
	}

	const handleSessionSelect = (sessionId: string) => {
		loadChat(sessionId)
		setShowHistorySidebar(false)
	}

	const handlePinSession = (sessionId: string) => {
		// TODO: Implementar lógica para fixar/desafixar sessão
		const session = sessions.find(s => s.id === sessionId)
		const isPinned = session?.isPinned || false

		console.log(`${isPinned ? 'Desafixando' : 'Fixando'} sessão:`, sessionId)

		// Aqui você implementaria a lógica para:
		// 1. Atualizar o estado da sessão no banco de dados
		// 2. Atualizar o estado local das sessões
		// 3. Reordenar a lista para mostrar sessões fixadas no topo

		// Exemplo de como seria:
		// await updateSession(sessionId, { isPinned: !isPinned })
		// await refreshSessions()

		alert(`Sessão ${isPinned ? 'desafixada' : 'fixada'} com sucesso!\n(Funcionalidade em desenvolvimento)`)
	}

	const handleShareSession = (sessionId: string) => {
		const session = sessions.find(s => s.id === sessionId)
		console.log('Compartilhando sessão:', session?.title || sessionId)

		// Aqui você implementaria:
		// 1. Gerar um link público para a conversa
		// 2. Abrir modal de compartilhamento
		// 3. Copiar link para clipboard
		// 4. Ou integrar com APIs de compartilhamento social

		// Exemplo básico - copiar ID para clipboard
		const shareUrl = `${window.location.origin}/assistente?session=${sessionId}`
		navigator.clipboard.writeText(shareUrl)
			.then(() => {
				alert('Link da conversa copiado para clipboard!\n(Funcionalidade em desenvolvimento)')
				console.log('Link copiado:', shareUrl)
			})
			.catch(err => {
				console.error('Erro ao copiar link:', err)
				alert('Erro ao copiar link para clipboard')
			})
	}

	const handleArchiveSession = (sessionId: string) => {
		const session = sessions.find(s => s.id === sessionId)
		console.log('Arquivando sessão:', session?.title || sessionId)

		// Aqui você implementaria:
		// 1. Marcar sessão como arquivada no banco
		// 2. Remover da lista principal
		// 3. Manter dados para possível restauração
		// 4. Opcional: criar seção "Arquivadas" separada

		// Exemplo de como seria:
		// await updateSession(sessionId, { isArchived: true })
		// await refreshSessions()

		alert(`Sessão "${session?.title || 'Sem título'}" arquivada!\n(Funcionalidade em desenvolvimento)`)
	}

	const handlePhotoCapture = async (file: File) => {
		setIsProcessingPhoto(true)
		setShowPhotoCapture(false)

		try {
			const reader = new FileReader()
			reader.onload = async (e) => {
				const imageData = e.target?.result as string

				addMessage({
					role: "user",
					content: "📸 Foto enviada para análise",
					imagePreview: imageData
				})

				try {
					const response = await fetch('/api/ai/product-recognition', {
						method: 'POST',
						body: (() => {
							const formData = new FormData()
							formData.append('image', file)
							return formData
						})()
					})

					if (!response.ok) {
						throw new Error('Erro ao processar imagem')
					}

					const result = await response.json()

					if (result.product) {
						addMessage({
							role: "assistant",
							content: "product-recognition-card",
							productData: {
								...result.product,
								imagePreview: imageData
							}
						})
					} else {
						addMessage({
							role: "assistant",
							content: "❌ Não consegui identificar nenhum produto na imagem. Tente tirar uma foto mais clara do produto."
						})
					}
				} catch (error) {
					console.error('Erro ao processar foto:', error)
					addMessage({
						role: "assistant",
						content: "❌ Erro ao processar a foto. Tente novamente."
					})
				}
			}
			reader.readAsDataURL(file)
		} catch (error) {
			console.error('Erro ao capturar foto:', error)
			addMessage({
				role: "assistant",
				content: "❌ Erro ao processar a foto. Tente novamente."
			})
		} finally {
			setIsProcessingPhoto(false)
		}
	}

	const handleAudioRecording = async (audioBlob: Blob) => {
		try {
			addMessage({
				role: "user",
				content: "🎤 Áudio enviado para análise"
			})

			// Aqui você pode implementar o processamento do áudio
			// Por exemplo, enviar para uma API de speech-to-text
			// Por enquanto, vamos simular uma resposta
			setTimeout(() => {
				addMessage({
					role: "assistant",
					content: "Recebi sua mensagem de áudio! Em breve implementarei o processamento de áudio para conversão em texto."
				})
			}, 1000)
		} catch (error) {
			console.error('Erro ao processar áudio:', error)
			addMessage({
				role: "assistant",
				content: "❌ Erro ao processar o áudio. Tente novamente."
			})
		}
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

	const hasMessages = messages.length > 1 // Mais que a mensagem inicial

	return (
		<div className="flex h-screen bg-background">
			{/* Conteúdo Principal */}
			<div className="flex-1 flex flex-col">
				{/* Header - Só aparece quando há mensagens */}
				{hasMessages && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10"
					>
						<div className="w-full mx-auto px-4 py-3 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
										<Bot className="h-4 w-4 text-white" />
									</div>
									<div>
										<h1 className="font-semibold text-gray-900">Zé</h1>
										{currentSession && (
											<p className="text-sm text-gray-500 truncate max-w-48">
												{currentSession.title}
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									onClick={handleNewChat}
									className="gap-2"
								>
									<Plus className="h-4 w-4" />
									Novo
								</Button>

								{/* Botão para mostrar/ocultar sidebar no mobile */}
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setShowHistorySidebar(!showHistorySidebar)}
									className="md:hidden"
								>
									<Menu className="h-5 w-5" />
								</Button>
							</div>
						</div>
					</motion.div>
				)}

				{/* Chat Area */}
				<div className="flex-1 flex flex-col min-h-0">
					{!hasMessages ? (
						/* Tela Inicial - Estilo ChatGPT */
						<div className="flex-1 flex flex-col items-center justify-center p-6">
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								className="text-center w-full mx-auto"
							>
								{/* Logo e Título */}
								<div className="mb-8">
									<div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
										<Bot className="h-8 w-8 text-white" />
									</div>
									<h1 className="text-4xl font-bold text-foreground mb-2">
										Olá, eu sou o Zé!
									</h1>
									<p className="text-xl text-muted-foreground">
										Seu assistente inteligente para compras e economia
									</p>
								</div>

								{/* Sugestões Iniciais */}
								<div className="mb-8">
									{/* <SmartSuggestions
										onSuggestionClick={handleSuggestionClick}
										messages={messages}
										isLoading={isLoading}
									/> */}
									<SimpleSuggestions
										onSuggestionClick={handleSuggestionClick}
										messages={messages}
										isLoading={isLoading}
									/>
								</div>

								{/* Recursos */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.1 }}
										className="p-4 rounded-xl bg-accent border hover:bg-accent/80 hover:shadow-sm transition-all flex flex-col items-center justify-center"
									>
										<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
											<Bot className="h-4 w-4 text-primary" />
										</div>
										<h3 className="font-semibold text-foreground mb-1">Listas Inteligentes</h3>
										<p className="text-sm text-muted-foreground">Crio listas de compras personalizadas para você</p>
									</motion.div>

									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
										className="p-4 rounded-xl bg-accent border hover:bg-accent/80 hover:shadow-sm transition-all flex flex-col items-center justify-center"
									>
										<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
											<Camera className="h-4 w-4 text-primary" />
										</div>
										<h3 className="font-semibold text-foreground mb-1">Reconhecimento</h3>
										<p className="text-sm text-muted-foreground">Analiso produtos por foto e código de barras</p>
									</motion.div>

									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.3 }}
										className="p-4 rounded-xl bg-accent border hover:bg-accent/80 hover:shadow-sm transition-all flex flex-col items-center justify-center"
									>
										<div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
											<Settings className="h-4 w-4 text-primary" />
										</div>
										<h3 className="font-semibold text-foreground mb-1">Comparação</h3>
										<p className="text-sm text-muted-foreground">Comparo preços e encontro as melhores ofertas</p>
									</motion.div>
								</div>
							</motion.div>
						</div>
					) : (
						/* Chat Messages */
						<ScrollArea ref={scrollAreaRef} className="flex-1 min-h-0">
							<div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
								{messages.map((msg, index) => (
									<motion.div
										key={index}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<ChatMessage
											role={msg.role}
											content={msg.content}
											isError={msg.isError}
											isStreaming={msg.isStreaming}
											onRetry={retryLastMessage}
											canRetry={msg.isError && !!lastUserMessage && !isLoading}
											imagePreview={msg.imagePreview}
											productData={msg.productData}
										/>
										{msg.selectionCard && (
											<div className="mt-4">
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
									</motion.div>
								))}

								{isLoading && (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
									>
										<EnhancedTypingIndicator
											context={lastUserMessage?.toLowerCase().includes('preço') ? 'price' :
												lastUserMessage?.toLowerCase().includes('lista') ? 'list' :
													lastUserMessage?.toLowerCase().includes('churrasco') ? 'churrasco' :
														undefined}
										/>
									</motion.div>
								)}
							</div>
						</ScrollArea>
					)}

					{/* Input Area - Sempre visível */}
					<div className="border-t bg-background flex-shrink-0">
						<div className="w-full max-w-4xl mx-auto px-4 py-4">
							{!isUsingAudioRecorder ? (
								<div className="space-y-4">
									<EnhancedInput
										value={input}
										onChange={setInput}
										onSubmit={handleSendMessage}
										onPhotoCapture={() => setShowPhotoCapture(true)}
										onSuggestionClick={handleSuggestionClick}
										placeholder="Mensagem para o Zé..."
										disabled={isLoading}
										isLoading={isLoading}
										isListening={isListening}
										onStartListening={startListening}
										onStopListening={stopListening}
										isVoiceSupported={isVoiceSupported}
									/>
									<div className="flex justify-center">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsUsingAudioRecorder(true)}
											className="gap-2"
										>
											<Mic className="h-4 w-4" />
											Gravar Áudio
										</Button>
									</div>
								</div>
							) : (
								<div className="space-y-4">
									<AudioRecorder
										onRecordingComplete={handleAudioRecording}
										onError={(error) => {
											console.error('Erro no gravador de áudio:', error)
											addMessage({
												role: "assistant",
												content: "❌ Erro ao acessar o microfone. Verifique as permissões."
											})
										}}
										disabled={isLoading}
									/>
									<div className="flex justify-center">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIsUsingAudioRecorder(false)}
										>
											Voltar ao Texto
										</Button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Sidebar do Chat Estilo ChatGPT - Lado Direito */}
			<div className="hidden md:block">
				<ChatGPTSidebar
					sessions={sessions}
					currentSessionId={currentSessionId || undefined}
					onSessionSelect={handleSessionSelect}
					onNewChat={handleNewChat}
					onDeleteSession={deleteSession}
					onRenameSession={renameSession}
					onPinSession={handlePinSession}
					onShareSession={handleShareSession}
					onArchiveSession={handleArchiveSession}
					onClearAll={clearAllHistory}
					isCollapsed={isSidebarCollapsed}
					onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
				/>
			</div>

			{/* Sidebar Mobile - Overlay */}
			<AnimatePresence>
				{showHistorySidebar && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 z-50 md:hidden"
						onClick={() => setShowHistorySidebar(false)}
					>
						<motion.div
							initial={{ x: "100%" }}
							animate={{ x: 0 }}
							exit={{ x: "100%" }}
							className="absolute right-0 top-0 h-full w-80 bg-background border-l shadow-xl"
							onClick={(e) => e.stopPropagation()}
						>
							<div className="p-4 border-b flex items-center justify-between">
								<h3 className="text-lg font-semibold">Histórico de Conversas</h3>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setShowHistorySidebar(false)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<div className="h-full overflow-y-auto">
								<ChatGPTSidebar
									sessions={sessions}
									currentSessionId={currentSessionId || undefined}
									onSessionSelect={handleSessionSelect}
									onNewChat={handleNewChat}
									onDeleteSession={deleteSession}
									onRenameSession={renameSession}
									onPinSession={handlePinSession}
									onShareSession={handleShareSession}
									onArchiveSession={handleArchiveSession}
									onClearAll={clearAllHistory}
									isCollapsed={false}
									onToggleCollapse={() => { }}
									isMobile={true}
								/>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Modal de Captura de Fotos */}
			<AnimatePresence>
				{showPhotoCapture && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
					>
						<motion.div
							initial={{ scale: 0.9, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.9, opacity: 0 }}
							className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden"
						>
							<div className="p-4 border-b flex items-center justify-between">
								<h3 className="text-lg font-semibold">Capturar Produto</h3>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setShowPhotoCapture(false)}
								>
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
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
