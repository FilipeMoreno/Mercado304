"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { useAiCache } from "./use-ai-cache"
import { useChatHistoryDB } from "./use-chat-history-db"
import { queryKeys } from "./use-react-query"

export interface Message {
	role: "user" | "assistant"
	content: string
	isError?: boolean
	isStreaming?: boolean
	imagePreview?: string
	productData?: any
	selectionCard?: {
		type: "products" | "markets" | "categories" | "brands" | "shopping-lists" | "churrascometro"
		options: any[]
		searchTerm: string
		context?: any
	}
}

export function useAiChat(sessionId?: string | null) {
	const queryClient = useQueryClient()
	const { currentSession, updateSession, loadSession, createNewSession } = useChatHistoryDB()
	const { getCachedResponse, setCachedResponse, shouldCache } = useAiCache()

	const [messages, setMessages] = useState<Message[]>([
		{
			role: "assistant",
			content:
				"Olá, eu sou o Zé! Estou aqui para te ajudar a economizar e organizar suas compras. O que vamos fazer hoje?",
		},
	])
	const [isLoading, setIsLoading] = useState(false)
	const [lastUserMessage, setLastUserMessage] = useState<string>("")

	// Carregar sessão quando sessionId mudar
	useEffect(() => {
		if (sessionId) {
			const session = loadSession(sessionId)
			if (session) {
				setMessages(session.messages)
			}
		}
	}, [sessionId, loadSession])

	// Salvar mensagens na sessão atual sempre que mudarem (evita loop)
	const lastSavedHashRef = useRef<string>("")
	const currentSessionId = currentSession?.id
	useEffect(() => {
		if (!currentSessionId || messages.length <= 1) return

		const hash = JSON.stringify(messages)
		if (hash === lastSavedHashRef.current) return

		lastSavedHashRef.current = hash
		updateSession(currentSessionId, messages)
	}, [messages, currentSessionId, updateSession])

	// Detecta mudança de contexto baseada na mensagem atual
	const detectContextChange = (currentMessage: string, previousMessages: Message[]) => {
		const current = currentMessage.toLowerCase()
		// Palavras que indicam nova tarefa
		const _newTaskIndicators = [
			"adicione",
			"adicionar",
			"add",
			"crie",
			"criar",
			"create",
			"liste",
			"listar",
			"list",
			"compare",
			"comparar",
			"busque",
			"buscar",
			"search",
			"registre",
			"registrar",
			"record",
		]

		// Palavras que indicam contextos específicos
		const contextWords = {
			churrasco: ["churrasco", "churrascometro", "bbq", "barbecue"],
			lista: ["lista", "compras", "shopping"],
			produto: ["produto", "item"],
			preco: ["preço", "price", "custo"],
			mercado: ["mercado", "market", "supermercado"],
		}

		// Se há mensagens anteriores, verifica mudança de contexto
		if (previousMessages.length > 1) {
			const lastMessages = previousMessages.slice(-3) // últimas 3 mensagens

			// Verifica se houve menção a churrasco nas mensagens anteriores
			const hadChurrasco = lastMessages.some((msg) =>
				contextWords.churrasco.some((word) => msg.content.toLowerCase().includes(word)),
			)

			// Se falou de churrasco antes mas agora quer adicionar algo à lista
			if (
				hadChurrasco &&
				(current.includes("adicione") || current.includes("adicionar")) &&
				(current.includes("lista") || current.includes("na "))
			) {
				return true // Mudança de contexto detectada
			}
		}

		return false
	}

	const addMessage = (message: Message) => {
		setMessages((prev) => [...prev, message])

		// Invalidar caches baseado no conteúdo da mensagem
		if (message.role === "assistant" && message.content) {
			invalidateCacheIfNeeded(message.content)
		}
	}

	const invalidateCacheIfNeeded = (content: string) => {
		const lowerContent = content.toLowerCase()

		// Lista criada
		if (lowerContent.includes("lista") && (lowerContent.includes("criada") || lowerContent.includes("criado"))) {
			console.log("Invalidando cache de shopping lists devido à criação de lista")
			queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists() })
		}

		// Produto criado
		if (lowerContent.includes("produto") && (lowerContent.includes("criado") || lowerContent.includes("criada"))) {
			console.log("Invalidando cache de produtos devido à criação de produto")
			queryClient.invalidateQueries({ queryKey: queryKeys.products() })
		}

		// Mercado criado
		if (lowerContent.includes("mercado") && (lowerContent.includes("criado") || lowerContent.includes("criada"))) {
			console.log("Invalidando cache de mercados devido à criação de mercado")
			queryClient.invalidateQueries({ queryKey: queryKeys.markets() })
		}

		// Compra registrada
		if (
			lowerContent.includes("compra") &&
			(lowerContent.includes("registrada") || lowerContent.includes("registrado"))
		) {
			console.log("Invalidando cache devido ao registro de compra")
			queryClient.invalidateQueries({ queryKey: queryKeys.purchases() })
			queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
		}
	}

	const updateLastMessage = (updates: Partial<Message> | ((prev: Message) => Partial<Message>)) => {
		setMessages((prev) => {
			const newMessages = [...prev]
			const lastIndex = newMessages.length - 1
			if (lastIndex >= 0) {
				const currentMessage = newMessages[lastIndex]
				if (currentMessage) {
					const updatesObj = typeof updates === "function" ? updates(currentMessage) : updates
					newMessages[lastIndex] = { ...currentMessage, ...updatesObj }
				}
			}
			return newMessages
		})
	}

	const removeLastMessage = () => {
		setMessages((prev) => prev.slice(0, -1))
	}

	const sendMessage = async (content: string, useStreaming: boolean = true) => {
		const userMessage: Message = { role: "user", content }

		// Se não há sessão atual, criar uma nova
		if (!currentSession) {
			await createNewSession(userMessage)
		}

		// Verificar cache primeiro
		const cachedResponse = getCachedResponse(content)
		if (cachedResponse) {
			console.log("🚀 Resposta encontrada no cache!")
			addMessage(userMessage)

			// Simular pequeno delay para parecer natural
			setTimeout(() => {
				const assistantMessage: Message = {
					role: "assistant",
					content: cachedResponse,
				}
				addMessage(assistantMessage)
			}, 300)

			return
		}

		// Detecta mudança de contexto
		const contextChanged = detectContextChange(content, messages)

		addMessage(userMessage)
		setLastUserMessage(content)
		setIsLoading(true)

		try {
			if (useStreaming) {
				await sendStreamingMessage(content, contextChanged)
			} else {
				await sendRegularMessage(content, contextChanged)
			}
		} catch (error) {
			console.error("Erro ao enviar mensagem:", error)
			const errorMessage: Message = {
				role: "assistant",
				content: "Não foi possível processar sua mensagem. Verifique sua conexão e tente novamente.",
				isError: true,
			}
			addMessage(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	const sendRegularMessage = async (messageContent: string, contextChanged: boolean = false) => {
		// Se houve mudança de contexto, envia histórico limitado
		const historyToSend = contextChanged
			? messages.slice(-2).map((msg) => ({ role: msg.role, parts: [{ text: msg.content }] }))
			: messages.map((msg) => ({
					role: msg.role,
					parts: [{ text: msg.content }],
				}))

		const response = await fetch("/api/ai/assistant", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: messageContent,
				history: historyToSend,
				contextChanged,
			}),
		})

		if (!response.ok) {
			throw new Error("A IA não conseguiu processar o seu pedido.")
		}

		const data = await response.json()

		const assistantMessage: Message = {
			role: "assistant",
			content: data.reply,
			isError: data.error || false,
		}

		if (data.selectionData?.showCards) {
			assistantMessage.selectionCard = {
				type: data.selectionData.cardType,
				options: data.selectionData.options,
				searchTerm: data.selectionData.searchTerm,
				context: data.selectionData.context,
			}
		}

		// Cachear resposta se apropriado
		if (shouldCache(messageContent) && !data.error && !data.selectionData?.showCards) {
			setCachedResponse(messageContent, data.reply)
			console.log("💾 Resposta cacheada:", `${messageContent.substring(0, 50)}...`)
		}

		addMessage(assistantMessage)
	}

	const sendStreamingMessage = async (messageContent: string, contextChanged: boolean = false) => {
		// Se houve mudança de contexto, envia histórico limitado
		const historyToSend = contextChanged
			? messages.slice(-2).map((msg) => ({ role: msg.role, parts: [{ text: msg.content }] }))
			: messages.map((msg) => ({
					role: msg.role,
					parts: [{ text: msg.content }],
				}))

		const response = await fetch("/api/ai/assistant", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				message: messageContent,
				stream: true,
				history: historyToSend,
				contextChanged,
			}),
		})

		if (!response.ok) {
			throw new Error("A IA não conseguiu processar o seu pedido.")
		}

		const reader = response.body?.getReader()
		if (!reader) throw new Error("Não foi possível obter o reader do stream")

		// Adiciona mensagem de resposta inicial (vazia, para streaming)
		addMessage({
			role: "assistant",
			content: "",
			isStreaming: true,
		})

		const decoder = new TextDecoder()
		let buffer = ""
		let fullResponse = ""
		let hasSelectionData = false

		try {
			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })
				const lines = buffer.split("\n")
				buffer = lines.pop() || ""

				for (const line of lines) {
					if (line.startsWith("data: ")) {
						try {
							const data = JSON.parse(line.slice(6))

							if (data.error) {
								updateLastMessage({
									content: data.content,
									isError: true,
									isStreaming: false,
								})
								break
							}

							if (data.final) {
								updateLastMessage({ isStreaming: false })

								// Cachear resposta completa se apropriado
								if (shouldCache(messageContent) && !hasSelectionData && fullResponse) {
									setCachedResponse(messageContent, fullResponse)
									console.log("💾 Resposta streaming cacheada:", `${messageContent.substring(0, 50)}...`)
								}
								break
							}

							if (data.content) {
								fullResponse += data.content
								updateLastMessage((prev) => ({
									content: (prev.content || "") + data.content,
								}))
							}

							if (data.selectionData) {
								hasSelectionData = true
								updateLastMessage({
									selectionCard: {
										type: data.selectionData.cardType,
										options: data.selectionData.options,
										searchTerm: data.selectionData.searchTerm,
										context: data.selectionData.context,
									},
									isStreaming: false,
								})
							}
						} catch (e) {
							console.error("Erro ao parsear dados do stream:", e)
						}
					}
				}
			}
		} finally {
			reader.releaseLock()
			setIsLoading(false)
		}
	}

	const retryLastMessage = async () => {
		if (!lastUserMessage.trim() || isLoading) return

		setIsLoading(true)
		await sendMessage(lastUserMessage)
	}

	const handleSelection = async (option: any, index: number) => {
		const lastMessage = messages[messages.length - 1]
		if (!lastMessage || !lastMessage.selectionCard) return

		const selectionMessage: Message = {
			role: "user",
			content: `Selecionei: ${option.name}`,
		}
		addMessage(selectionMessage)
		setIsLoading(true)

		try {
			const response = await fetch("/api/ai/assistant", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: `SELEÇÃO_FEITA: ${JSON.stringify({
						type: lastMessage.selectionCard.type,
						selectedOption: option,
						selectedIndex: index,
						originalContext: lastMessage.selectionCard.context,
						searchTerm: lastMessage.selectionCard.searchTerm,
					})}`,
					history: [...messages, selectionMessage],
				}),
			})

			if (!response.ok) {
				throw new Error("A IA não conseguiu processar a seleção.")
			}

			const data = await response.json()
			const assistantMessage: Message = {
				role: "assistant",
				content: data.reply,
				isError: data.error || false,
			}
			addMessage(assistantMessage)
		} catch (_error) {
			const errorMessage: Message = {
				role: "assistant",
				content: "Não foi possível processar sua seleção. Tente novamente.",
				isError: true,
			}
			addMessage(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	const handleChurrascoCalculate = async (data: any) => {
		removeLastMessage()

		const churrascoMessage = `Calcular churrasco para ${data.adults} adultos, ${data.children} crianças, sendo que ${data.drinkers} adultos bebem. ${data.preferences ? `Preferências: ${data.preferences}` : ""}`

		const userMessage: Message = { role: "user", content: churrascoMessage }
		addMessage(userMessage)
		setLastUserMessage(churrascoMessage)
		setIsLoading(true)

		try {
			const response = await fetch("/api/ai/assistant", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					message: `CALCULATE_CHURRASCO: ${JSON.stringify(data)}`,
					history: [...messages, userMessage],
				}),
			})

			if (!response.ok) {
				throw new Error("Erro ao calcular churrasco")
			}

			const responseData = await response.json()
			const assistantMessage: Message = {
				role: "assistant",
				content: responseData.reply,
				isError: responseData.error || false,
			}
			addMessage(assistantMessage)
		} catch (_error) {
			const errorMessage: Message = {
				role: "assistant",
				content: "Não foi possível calcular o churrasco. Tente novamente.",
				isError: true,
			}
			addMessage(errorMessage)
		} finally {
			setIsLoading(false)
		}
	}

	// Função para iniciar nova conversa
	const startNewChat = async () => {
		const newSession = await createNewSession()
		if (newSession) {
			setMessages(newSession.messages)
			return newSession
		}
		return null
	}

	// Função para carregar conversa específica
	const loadChat = (sessionId: string) => {
		const session = loadSession(sessionId)
		if (session) {
			setMessages(session.messages)
			return session
		}
		return null
	}

	return {
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
	}
}
