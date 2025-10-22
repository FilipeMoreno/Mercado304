"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Bot, History, Maximize2, Menu, Minimize2, Plus, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { ChatHistorySidebar } from "@/components/ai-chat/chat-history-sidebar"
import { ChatMessage } from "@/components/ai-chat/chat-message"
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card"
import { EnhancedInput } from "@/components/ai-chat/enhanced-input"
import { EnhancedTypingIndicator } from "@/components/ai-chat/enhanced-typing-indicator"
import { SelectionCard } from "@/components/ai-chat/selection-cards"
import { SmartSuggestions } from "@/components/ai-chat/smart-suggestions"
import { ProductPhotoCapture } from "@/components/product-photo-capture"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAiChat, useChatHistoryDB } from "@/hooks"

export default function EnhancedAssistentePage() {
	const [input, setInput] = useState("")
	const [showPhotoCapture, setShowPhotoCapture] = useState(false)
	const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
	const [isExpanded, setIsExpanded] = useState(false)
	const [showHistorySidebar, setShowHistorySidebar] = useState(false)

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

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim()) return

		await sendMessage(input)
		setInput("")
	}

	const handleSuggestionClick = async (suggestion: string) => {
		await sendMessage(suggestion)
	}

	const handleNewChat = () => {
		const _newSession = startNewChat()
		setShowHistorySidebar(false)
	}

	const handleSessionSelect = (sessionId: string) => {
		loadChat(sessionId)
		setShowHistorySidebar(false)
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
					imagePreview: imageData,
				})

				try {
					const response = await fetch("/api/ai/product-recognition", {
						method: "POST",
						body: (() => {
							const formData = new FormData()
							formData.append("image", file)
							return formData
						})(),
					})

					if (!response.ok) {
						throw new Error("Erro ao processar imagem")
					}

					const result = await response.json()

					if (result.product) {
						addMessage({
							role: "assistant",
							content: "product-recognition-card",
							productData: {
								...result.product,
								imagePreview: imageData,
							},
						})
					} else {
						addMessage({
							role: "assistant",
							content:
								"❌ Não consegui identificar nenhum produto na imagem. Tente tirar uma foto mais clara do produto.",
						})
					}
				} catch (error) {
					console.error("Erro ao processar foto:", error)
					addMessage({
						role: "assistant",
						content: "❌ Erro ao processar a foto. Tente novamente.",
					})
				}
			}
			reader.readAsDataURL(file)
		} catch (error) {
			console.error("Erro ao capturar foto:", error)
			addMessage({
				role: "assistant",
				content: "❌ Erro ao processar a foto. Tente novamente.",
			})
		} finally {
			setIsProcessingPhoto(false)
		}
	}

	const handleAudioRecording = async (audioBlob: Blob) => {
		try {
			addMessage({
				role: "user",
				content: "🎤 Processando áudio...",
			})

			// Converter áudio para texto usando Web Speech API
			const text = await convertAudioToText(audioBlob)

			if (text?.trim()) {
				// Enviar o texto convertido como mensagem normal
				await sendMessage(text)
			} else {
				addMessage({
					role: "assistant",
					content:
						"❌ Não consegui entender o áudio. Tente falar mais claramente ou verifique se o microfone está funcionando.",
				})
			}
		} catch (error) {
			console.error("Erro ao processar áudio:", error)
			addMessage({
				role: "assistant",
				content: "❌ Erro ao processar o áudio. Tente novamente.",
			})
		}
	}

	// Função para converter áudio em texto
	const convertAudioToText = async (audioBlob: Blob): Promise<string> => {
		return new Promise((resolve, reject) => {
			// Verificar se a Web Speech API está disponível
			if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
				reject(new Error("Speech recognition não é suportado neste navegador"))
				return
			}

			// Criar um URL temporário para o áudio
			const audioUrl = URL.createObjectURL(audioBlob)
			const audio = new Audio(audioUrl)

			// Configurar o reconhecimento de fala
			const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
			const recognition = new SpeechRecognition()

			recognition.continuous = false
			recognition.interimResults = false
			recognition.lang = "pt-BR"
			recognition.maxAlternatives = 1

			recognition.onresult = (event: any) => {
				const transcript = event.results[0][0].transcript
				URL.revokeObjectURL(audioUrl) // Limpar URL temporário
				resolve(transcript)
			}

			recognition.onerror = (event: any) => {
				URL.revokeObjectURL(audioUrl) // Limpar URL temporário
				reject(new Error(`Erro no reconhecimento: ${event.error}`))
			}

			recognition.onend = () => {
				URL.revokeObjectURL(audioUrl) // Limpar URL temporário
			}

			// Reproduzir o áudio e iniciar reconhecimento
			audio.oncanplaythrough = () => {
				recognition.start()
				audio.play()
			}

			audio.onerror = () => {
				URL.revokeObjectURL(audioUrl)
				reject(new Error("Erro ao reproduzir áudio"))
			}

			// Timeout de segurança
			setTimeout(() => {
				recognition.stop()
				URL.revokeObjectURL(audioUrl)
				reject(new Error("Timeout no processamento do áudio"))
			}, 10000) // 10 segundos
		})
	}

	return (
		<div className="flex h-screen bg-gray-50">
			{/* Sidebar de Histórico */}
			<ChatHistorySidebar
				sessions={sessions}
				currentSessionId={currentSessionId}
				onSessionSelect={handleSessionSelect}
				onNewChat={handleNewChat}
				onDeleteSession={deleteSession}
				onRenameSession={renameSession}
				onClearAll={clearAllHistory}
				isOpen={showHistorySidebar}
				onClose={() => setShowHistorySidebar(false)}
			/>

			{/* Conteúdo Principal */}
			<div
				className={`flex-1 flex flex-col transition-all duration-300 ${
					isExpanded ? "max-w-none" : "max-w-6xl mx-auto"
				}`}
			>
				{/* Header */}
				<div className="bg-white border-b border-gray-200 p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button variant="ghost" size="icon" onClick={() => setShowHistorySidebar(true)} className="lg:hidden">
								<Menu className="size-5" />
							</Button>

							<Link href="/" className="hidden lg:block">
								<Button variant="outline" size="sm" className="gap-2">
									<ArrowLeft className="size-4" />
									Voltar
								</Button>
							</Link>

							<div className="flex items-center gap-3">
								<div className="size-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
									<Bot className="size-6 text-white" />
								</div>
								<div>
									<h1 className="text-2xl font-bold text-gray-900">Zé, o Assistente</h1>
									<p className="text-sm text-gray-600">
										{currentSession ? currentSession.title : "Seu assistente inteligente para compras"}
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{/* Botão de Histórico (Desktop) */}
							<Button
								variant="outline"
								size="sm"
								onClick={() => setShowHistorySidebar(true)}
								className="hidden lg:flex gap-2"
							>
								<History className="size-4" />
								Histórico
							</Button>

							{/* Novo Chat */}
							<Button variant="outline" size="sm" onClick={handleNewChat} className="gap-2">
								<Plus className="size-4" />
								Novo Chat
							</Button>

							{/* Toggle Expandido */}
							<Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="gap-2">
								{isExpanded ? (
									<>
										<Minimize2 className="size-4" />
										<span className="hidden sm:inline">Compacto</span>
									</>
								) : (
									<>
										<Maximize2 className="size-4" />
										<span className="hidden sm:inline">Expandir</span>
									</>
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* Chat Container */}
				<div className="flex-1 flex flex-col">
					<Card className="flex-1 m-4 shadow-xl border-0 bg-white/80 backdrop-blur-xs flex flex-col">
						<CardHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg shrink-0">
							<CardTitle className="flex items-center gap-2">
								<Bot className="size-5" />
								Conversa com o Zé
								{sessions.length > 0 && (
									<span className="text-xs bg-white/20 px-2 py-1 rounded-full">{sessions.length} conversas salvas</span>
								)}
							</CardTitle>
						</CardHeader>

						<CardContent className="flex-1 flex flex-col p-0 min-h-0">
							{/* Chat Messages */}
							<ScrollArea className="flex-1 p-6">
								<div className="space-y-6">
									{/* Sugestões Inteligentes */}
									<SmartSuggestions
										onSuggestionClick={handleSuggestionClick}
										messages={messages}
										isLoading={isLoading}
									/>

									{messages.map((msg, index) => (
										<div key={index}>
											<ChatMessage
												role={msg.role}
												content={msg.content}
												{...(msg.isError !== undefined && { isError: msg.isError })}
												{...(msg.isStreaming !== undefined && { isStreaming: msg.isStreaming })}
												onRetry={retryLastMessage}
												{...(msg.isError && !!lastUserMessage && !isLoading && { canRetry: true })}
												{...(msg.imagePreview && { imagePreview: msg.imagePreview })}
												{...(msg.productData && { productData: msg.productData })}
											/>
											{msg.selectionCard && (
												<div className="mt-4 ml-12">
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

									{/* Indicador de Digitação Melhorado */}
									{isLoading && (
										<EnhancedTypingIndicator
											context={
												lastUserMessage?.toLowerCase().includes("preço")
													? "price"
													: lastUserMessage?.toLowerCase().includes("lista")
														? "list"
														: lastUserMessage?.toLowerCase().includes("churrasco")
															? "churrasco"
															: "default"
											}
										/>
									)}
								</div>
							</ScrollArea>

							{/* Input Form */}
							<div className="p-6 border-t bg-gray-50/50 shrink-0">
								<EnhancedInput
									value={input}
									onChange={setInput}
									onSubmit={handleSendMessage}
									onPhotoCapture={() => setShowPhotoCapture(true)}
									onSuggestionClick={handleSuggestionClick}
									onAudioRecording={handleAudioRecording}
									placeholder="Digite sua mensagem aqui..."
									disabled={isLoading}
									isLoading={isLoading}
								/>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Tips */}
				{!isExpanded && (
					<div className="mx-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
						<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
							<Card className="bg-white/70 backdrop-blur-xs border-0 shadow-md hover:shadow-lg transition-shadow-sm">
								<CardContent className="p-4 text-center">
									<Bot className="size-8 text-blue-600 mx-auto mb-2" />
									<p className="text-sm text-gray-700 font-medium">Peça para criar listas de compras</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
							<Card className="bg-white/70 backdrop-blur-xs border-0 shadow-md hover:shadow-lg transition-shadow-sm">
								<CardContent className="p-4 text-center">
									<Bot className="size-8 text-indigo-600 mx-auto mb-2" />
									<p className="text-sm text-gray-700 font-medium">Compare preços entre mercados</p>
								</CardContent>
							</Card>
						</motion.div>

						<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
							<Card className="bg-white/70 backdrop-blur-xs border-0 shadow-md hover:shadow-lg transition-shadow-sm">
								<CardContent className="p-4 text-center">
									<Bot className="size-8 text-purple-600 mx-auto mb-2" />
									<p className="text-sm text-gray-700 font-medium">Calcule seu churrasco perfeito</p>
								</CardContent>
							</Card>
						</motion.div>
					</div>
				)}
			</div>

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
								<Button variant="ghost" size="icon" onClick={() => setShowPhotoCapture(false)}>
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
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
