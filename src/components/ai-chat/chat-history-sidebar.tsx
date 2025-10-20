"use client"

import { motion, AnimatePresence } from "framer-motion"
import { 
	MessageSquare, 
	Plus, 
	Trash2, 
	Edit2, 
	Calendar,
	Search,
	X,
	MoreVertical,
	Archive,
	Clock
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChatSession } from "@/hooks/use-chat-history"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChatHistorySidebarProps {
	sessions: ChatSession[]
	currentSessionId: string | null
	onSessionSelect: (sessionId: string) => void
	onNewChat: () => void
	onDeleteSession: (sessionId: string) => void
	onRenameSession: (sessionId: string, newTitle: string) => void
	onClearAll: () => void
	isOpen: boolean
	onClose: () => void
}

export function ChatHistorySidebar({
	sessions,
	currentSessionId,
	onSessionSelect,
	onNewChat,
	onDeleteSession,
	onRenameSession,
	onClearAll,
	isOpen,
	onClose
}: ChatHistorySidebarProps) {
	const [searchTerm, setSearchTerm] = useState("")
	const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
	const [editTitle, setEditTitle] = useState("")
	const editInputRef = useRef<HTMLInputElement>(null)

	// Filtrar sessões baseado na busca
	const filteredSessions = sessions.filter(session =>
		session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
		session.messages.some(msg => 
			msg.content.toLowerCase().includes(searchTerm.toLowerCase())
		)
	)

	// Agrupar sessões por data
	const groupedSessions = filteredSessions.reduce((groups, session) => {
		const today = new Date()
		const sessionDate = session.updatedAt
		
		let groupKey: string
		
		if (sessionDate.toDateString() === today.toDateString()) {
			groupKey = "Hoje"
		} else if (sessionDate.toDateString() === new Date(today.getTime() - 24 * 60 * 60 * 1000).toDateString()) {
			groupKey = "Ontem"
		} else if (sessionDate.getTime() > today.getTime() - 7 * 24 * 60 * 60 * 1000) {
			groupKey = "Esta semana"
		} else if (sessionDate.getTime() > today.getTime() - 30 * 24 * 60 * 60 * 1000) {
			groupKey = "Este mês"
		} else {
			groupKey = "Mais antigo"
		}

		if (!groups[groupKey]) {
			groups[groupKey] = []
		}
		groups[groupKey].push(session)
		return groups
	}, {} as Record<string, ChatSession[]>)

	// Iniciar edição
	const startEditing = (session: ChatSession) => {
		setEditingSessionId(session.id)
		setEditTitle(session.title)
		setTimeout(() => editInputRef.current?.focus(), 100)
	}

	// Salvar edição
	const saveEdit = () => {
		if (editingSessionId && editTitle.trim()) {
			onRenameSession(editingSessionId, editTitle.trim())
		}
		setEditingSessionId(null)
		setEditTitle("")
	}

	// Cancelar edição
	const cancelEdit = () => {
		setEditingSessionId(null)
		setEditTitle("")
	}

	// Efeito para focar no input de edição
	useEffect(() => {
		if (editingSessionId && editInputRef.current) {
			editInputRef.current.focus()
			editInputRef.current.select()
		}
	}, [editingSessionId])

	if (!isOpen) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ x: -320, opacity: 0 }}
				animate={{ x: 0, opacity: 1 }}
				exit={{ x: -320, opacity: 0 }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
				className="fixed left-0 top-0 bottom-0 w-80 bg-white border-r border-gray-200 shadow-xl z-50 flex flex-col"
			>
				{/* Header */}
				<div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
					<div className="flex items-center justify-between mb-3">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<MessageSquare className="size-5" />
							Conversas
						</h2>
						<Button
							variant="ghost"
							size="icon"
							onClick={onClose}
							className="text-white hover:bg-white/20 size-8"
						>
							<X className="size-4" />
						</Button>
					</div>

					{/* Novo Chat */}
					<Button
						onClick={onNewChat}
						className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
						size="sm"
					>
						<Plus className="size-4 mr-2" />
						Nova Conversa
					</Button>
				</div>

				{/* Busca */}
				<div className="p-4 border-b border-gray-200">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
						<Input
							placeholder="Buscar conversas..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10 h-9"
						/>
					</div>
				</div>

				{/* Lista de Sessões */}
				<ScrollArea className="flex-1">
					<div className="p-2">
						{Object.keys(groupedSessions).length === 0 ? (
							<div className="text-center py-8 text-gray-500">
								<MessageSquare className="size-12 mx-auto mb-3 text-gray-300" />
								<p className="text-sm">
									{searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
								</p>
							</div>
						) : (
							Object.entries(groupedSessions).map(([group, groupSessions]) => (
								<div key={group} className="mb-4">
									<div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
										<Calendar className="h-3 w-3" />
										{group}
									</div>
									
									{groupSessions.map((session) => (
										<motion.div
											key={session.id}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
												currentSessionId === session.id
													? "bg-blue-50 border border-blue-200"
													: "hover:bg-gray-50"
											}`}
											onClick={() => onSessionSelect(session.id)}
										>
											<div className="flex items-start justify-between">
												<div className="flex-1 min-w-0">
													{editingSessionId === session.id ? (
														<Input
															ref={editInputRef}
															value={editTitle}
															onChange={(e) => setEditTitle(e.target.value)}
															onKeyDown={(e) => {
																if (e.key === "Enter") saveEdit()
																if (e.key === "Escape") cancelEdit()
															}}
															onBlur={saveEdit}
															className="h-6 text-sm font-medium"
															onClick={(e) => e.stopPropagation()}
														/>
													) : (
														<h3 className="text-sm font-medium text-gray-900 truncate">
															{session.title}
														</h3>
													)}
													
													<div className="flex items-center gap-2 mt-1">
														<Clock className="h-3 w-3 text-gray-400" />
														<span className="text-xs text-gray-500">
															{formatDistanceToNow(session.updatedAt, { 
																addSuffix: true, 
																locale: ptBR 
															})}
														</span>
														<span className="text-xs text-gray-400">
															• {session.messages.length} mensagens
														</span>
													</div>
												</div>

												{/* Menu de ações */}
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
															onClick={(e) => e.stopPropagation()}
														>
															<MoreVertical className="h-3 w-3" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-48">
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation()
																startEditing(session)
															}}
														>
															<Edit2 className="size-4 mr-2" />
															Renomear
														</DropdownMenuItem>
														<DropdownMenuSeparator />
														<DropdownMenuItem
															onClick={(e) => {
																e.stopPropagation()
																onDeleteSession(session.id)
															}}
															className="text-red-600 focus:text-red-600"
														>
															<Trash2 className="size-4 mr-2" />
															Excluir
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</div>

											{/* Preview da última mensagem */}
											{session.messages.length > 1 && (
												<p className="text-xs text-gray-500 mt-2 line-clamp-2">
													{session.messages[session.messages.length - 1]?.content.slice(0, 80)}...
												</p>
											)}
										</motion.div>
									))}
								</div>
							))
						)}
					</div>
				</ScrollArea>

				{/* Footer */}
				{sessions.length > 0 && (
					<div className="p-4 border-t border-gray-200">
						<Button
							variant="outline"
							size="sm"
							onClick={onClearAll}
							className="w-full text-red-600 border-red-200 hover:bg-red-50"
						>
							<Archive className="size-4 mr-2" />
							Limpar Histórico
						</Button>
					</div>
				)}
			</motion.div>

			{/* Overlay */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black/20 z-40"
				onClick={onClose}
			/>
		</AnimatePresence>
	)
}
