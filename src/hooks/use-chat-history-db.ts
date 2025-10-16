"use client"

import { useCallback, useEffect, useState } from "react"
import { Message } from "./use-ai-chat"

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  isPinned?: boolean
  isArchived?: boolean
  lastMessage?: string
  messageCount?: number
}

export function useChatHistoryDB() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Carregar histórico do banco de dados
  const loadHistory = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/assistant/history")
      if (response.ok) {
        const data = await response.json()
        const sessionsWithDates = data.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
        }))
        setSessions(sessionsWithDates)
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de chat:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Carregar histórico na inicialização
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Criar nova sessão
  const createNewSession = useCallback(async (initialMessage?: Message) => {
    const messages = initialMessage ? [
      {
        role: "assistant" as const,
        content: "Olá, eu sou o Zé! Estou aqui para te ajudar a economizar e organizar suas compras. O que vamos fazer hoje?",
      },
      initialMessage
    ] : [
      {
        role: "assistant" as const,
        content: "Olá, eu sou o Zé! Estou aqui para te ajudar a economizar e organizar suas compras. O que vamos fazer hoje?",
      }
    ]

    const title = initialMessage?.content.slice(0, 50) || "Nova conversa"

    try {
      const response = await fetch("/api/assistant/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          messages,
          isPinned: false,
        }),
      })

      if (response.ok) {
        const newSession = await response.json()
        const sessionWithDates = {
          ...newSession,
          createdAt: new Date(newSession.createdAt),
          updatedAt: new Date(newSession.updatedAt),
        }

        setSessions(prev => [sessionWithDates, ...prev])
        setCurrentSessionId(newSession.id)
        return sessionWithDates
      }
    } catch (error) {
      console.error("Erro ao criar nova sessão:", error)
    }
    return null
  }, [])

  // Atualizar sessão existente
  const updateSession = useCallback(async (sessionId: string, messages: Message[]) => {
    // Gerar título baseado na primeira mensagem do usuário
    const firstUserMessage = messages.find(msg => msg.role === "user")
    const title = firstUserMessage?.content.slice(0, 50) || "Nova conversa"

    try {
      const response = await fetch(`/api/assistant/history/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          messages,
        }),
      })

      if (response.ok) {
        const updatedSession = await response.json()
        const sessionWithDates = {
          ...updatedSession,
          createdAt: new Date(updatedSession.createdAt),
          updatedAt: new Date(updatedSession.updatedAt),
        }

        setSessions(prev =>
          prev.map(session =>
            session.id === sessionId ? sessionWithDates : session
          )
        )
      }
    } catch (error) {
      console.error("Erro ao atualizar sessão:", error)
    }
  }, [])

  // Carregar sessão específica
  const loadSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId)
    return sessions.find(s => s.id === sessionId) || null
  }, [sessions])

  // Deletar sessão
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/assistant/history/${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))

        // Se a sessão deletada era a atual, limpar
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null)
        }
      }
    } catch (error) {
      console.error("Erro ao deletar sessão:", error)
    }
  }, [currentSessionId])

  // Renomear sessão
  const renameSession = useCallback(async (sessionId: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/assistant/history/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
        }),
      })

      if (response.ok) {
        const updatedSession = await response.json()
        const sessionWithDates = {
          ...updatedSession,
          createdAt: new Date(updatedSession.createdAt),
          updatedAt: new Date(updatedSession.updatedAt),
        }

        setSessions(prev =>
          prev.map(session =>
            session.id === sessionId ? sessionWithDates : session
          )
        )
      }
    } catch (error) {
      console.error("Erro ao renomear sessão:", error)
    }
  }, [])

  // Limpar todo o histórico
  const clearAllHistory = useCallback(async () => {
    try {
      // Deletar todas as sessões uma por uma
      const deletePromises = sessions.map(session =>
        fetch(`/api/assistant/history/${session.id}`, {
          method: "DELETE",
        })
      )

      await Promise.all(deletePromises)

      setSessions([])
      setCurrentSessionId(null)
    } catch (error) {
      console.error("Erro ao limpar histórico:", error)
    }
  }, [sessions])

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
    loadHistory, // Expor para recarregar quando necessário
  }
}
