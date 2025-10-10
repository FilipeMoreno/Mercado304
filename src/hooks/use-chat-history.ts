"use client"

import { useCallback, useEffect, useState, useRef } from "react"
import { Message } from "./use-ai-chat"

export interface ChatSession {
	id: string
	title: string
	messages: Message[]
	createdAt: Date
	updatedAt: Date
}

const STORAGE_KEY = "mercado304_chat_history"
const MAX_SESSIONS = 50 // Limite de sessões para não sobrecarregar o storage

export function useChatHistory() {
	const [sessions, setSessions] = useState<ChatSession[]>([])
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const sessionsRef = useRef<ChatSession[]>([])

	// Carregar histórico do localStorage
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (stored) {
				const parsed = JSON.parse(stored)
				const sessionsWithDates = parsed.map((session: any) => ({
					...session,
					createdAt: new Date(session.createdAt),
					updatedAt: new Date(session.updatedAt),
				}))
				setSessions(sessionsWithDates)
				sessionsRef.current = sessionsWithDates
			}
		} catch (error) {
			console.error("Erro ao carregar histórico de chat:", error)
		} finally {
			setIsLoading(false)
		}
	}, [])

	// Salvar no localStorage sempre que sessions mudar
	const saveToStorage = useCallback((newSessions: ChatSession[]) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions))
		} catch (error) {
			console.error("Erro ao salvar histórico de chat:", error)
		}
	}, [])

	// Criar nova sessão
	const createNewSession = useCallback((initialMessage?: Message) => {
		const newSession: ChatSession = {
			id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			title: initialMessage?.content.slice(0, 50) || "Nova conversa",
			messages: initialMessage ? [
				{
					role: "assistant",
					content: "Olá, eu sou o Zé! Estou aqui para te ajudar a economizar e organizar suas compras. O que vamos fazer hoje?",
				},
				initialMessage
			] : [
				{
					role: "assistant",
					content: "Olá, eu sou o Zé! Estou aqui para te ajudar a economizar e organizar suas compras. O que vamos fazer hoje?",
				}
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		}

		setSessions(prev => {
			const newSessions = [newSession, ...prev].slice(0, MAX_SESSIONS)
			sessionsRef.current = newSessions
			saveToStorage(newSessions)
			return newSessions
		})

		setCurrentSessionId(newSession.id)
		return newSession
	}, [saveToStorage])

	// Atualizar sessão existente
	const updateSession = useCallback((sessionId: string, messages: Message[]) => {
		setSessions(prev => {
			const newSessions = prev.map(session => {
				if (session.id === sessionId) {
					// Gerar título baseado na primeira mensagem do usuário
					const firstUserMessage = messages.find(msg => msg.role === "user")
					const title = firstUserMessage?.content.slice(0, 50) || session.title

					return {
						...session,
						title,
						messages,
						updatedAt: new Date(),
					}
				}
				return session
			})
			sessionsRef.current = newSessions
			saveToStorage(newSessions)
			return newSessions
		})
	}, [saveToStorage])

	// Carregar sessão específica
	const loadSession = useCallback((sessionId: string) => {
		setCurrentSessionId(sessionId)
		// Usar o ref para evitar dependência circular
		return sessionsRef.current.find(s => s.id === sessionId) || null
	}, [])

	// Deletar sessão
	const deleteSession = useCallback((sessionId: string) => {
		setSessions(prev => {
			const newSessions = prev.filter(s => s.id !== sessionId)
			sessionsRef.current = newSessions
			saveToStorage(newSessions)
			return newSessions
		})

		// Se a sessão deletada era a atual, limpar
		if (currentSessionId === sessionId) {
			setCurrentSessionId(null)
		}
	}, [currentSessionId, saveToStorage])

	// Renomear sessão
	const renameSession = useCallback((sessionId: string, newTitle: string) => {
		setSessions(prev => {
			const newSessions = prev.map(session => 
				session.id === sessionId 
					? { ...session, title: newTitle, updatedAt: new Date() }
					: session
			)
			sessionsRef.current = newSessions
			saveToStorage(newSessions)
			return newSessions
		})
	}, [saveToStorage])

	// Limpar todo o histórico
	const clearAllHistory = useCallback(() => {
		setSessions([])
		sessionsRef.current = []
		setCurrentSessionId(null)
		localStorage.removeItem(STORAGE_KEY)
	}, [])

	// Obter sessão atual
	const getCurrentSession = useCallback(() => {
		if (!currentSessionId) return null
		return sessions.find(s => s.id === currentSessionId) || null
	}, [currentSessionId, sessions])

	// Obter sessões ordenadas por data
	const getOrderedSessions = useCallback(() => {
		return [...sessions].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
	}, [sessions])

	return {
		sessions: getOrderedSessions(),
		currentSessionId,
		currentSession: getCurrentSession(),
		isLoading,
		createNewSession,
		updateSession,
		loadSession,
		deleteSession,
		renameSession,
		clearAllHistory,
	}
}
