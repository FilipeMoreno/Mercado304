"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useTheme } from "@/lib/theme"
import {
	Plus,
	Search,
	MessageSquare,
	MoreHorizontal,
	Edit3,
	Trash2,
	Check,
	X,
	ChevronLeft,
	ChevronRight,
	Bot
} from "lucide-react"
import { isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChatSession {
	id: string
	title: string
	createdAt: Date
	updatedAt: Date
	messageCount?: number
	lastMessage?: string
}

interface ChatGPTSidebarProps {
	sessions: ChatSession[]
	currentSessionId?: string
	onSessionSelect: (sessionId: string) => void
	onNewChat: () => void
	onDeleteSession: (sessionId: string) => void
	onRenameSession: (sessionId: string, newTitle: string) => void
	onClearAll: () => void
	isCollapsed?: boolean
	onToggleCollapse?: () => void
}

export function ChatGPTSidebar({
	sessions,
	currentSessionId,
	onSessionSelect,
	onNewChat,
	onDeleteSession,
	onRenameSession,
	onClearAll,
	isCollapsed = false,
	onToggleCollapse
}: ChatGPTSidebarProps) {
	const { theme } = useTheme()
	const [searchTerm, setSearchTerm] = useState("")
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingTitle, setEditingTitle] = useState("")
	const editInputRef = useRef<HTMLInputElement>(null)

	// Focus no input quando começa a editar
	useEffect(() => {
		if (editingId && editInputRef.current) {
			editInputRef.current.focus()
			editInputRef.current.select()
		}
	}, [editingId])

	// Filtrar sessões baseado na busca
	const filteredSessions = sessions.filter(session =>
		session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
		(session.lastMessage && session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()))
	)

	// Agrupar sessões por data
	const groupedSessions = filteredSessions.reduce((groups, session) => {
		let groupName = "Mais antigo"

		if (isToday(session.updatedAt)) {
			groupName = "Hoje"
		} else if (isYesterday(session.updatedAt)) {
			groupName = "Ontem"
		} else if (isThisWeek(session.updatedAt)) {
			groupName = "Esta semana"
		} else if (isThisMonth(session.updatedAt)) {
			groupName = "Este mês"
		}

		if (!groups[groupName]) {
			groups[groupName] = []
		}
		groups[groupName].push(session)
		return groups
	}, {} as Record<string, ChatSession[]>)

	const handleStartEdit = (session: ChatSession) => {
		setEditingId(session.id)
		setEditingTitle(session.title)
	}

	const handleSaveEdit = () => {
		if (editingId && editingTitle.trim()) {
			onRenameSession(editingId, editingTitle.trim())
		}
		setEditingId(null)
		setEditingTitle("")
	}

	const handleCancelEdit = () => {
		setEditingId(null)
		setEditingTitle("")
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSaveEdit()
		} else if (e.key === 'Escape') {
			handleCancelEdit()
		}
	}

	if (isCollapsed) {
		return (
			<motion.div
				initial={{ width: 260 }}
				animate={{ width: 60 }}
				className="sticky h-screen bg-accent border-r flex flex-col"
			>
				{/* Header Colapsado */}
				<div className="p-3 border-b">
					<Button
						onClick={onToggleCollapse}
						variant="ghost"
						size="icon"
						className="w-full h-10 text-muted-foreground hover:bg-muted"
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>

				{/* Novo Chat */}
				<div className="p-3">
					<Button
						onClick={onNewChat}
						variant="ghost"
						size="icon"
						className="w-full h-10 text-muted-foreground hover:bg-muted"
						title="Nova conversa"
					>
						<Plus className="h-4 w-4" />
					</Button>
				</div>

				{/* Sessões Colapsadas */}
				<ScrollArea className="flex-1 px-2">
					<div className="space-y-1">
						{sessions.slice(0, 10).map((session) => (
							<Button
								key={session.id}
								onClick={() => onSessionSelect(session.id)}
								variant="ghost"
								size="icon"
								className={`w-full h-10 ${currentSessionId === session.id
									? 'bg-primary/10 text-primary'
									: 'text-muted-foreground hover:bg-muted'
									}`}
								title={session.title}
							>
								<MessageSquare className="h-4 w-4" />
							</Button>
						))}
					</div>
				</ScrollArea>
			</motion.div>
		)
	}

	return (
		<motion.div
			initial={{ width: 60 }}
			animate={{ width: 260 }}
			className="sticky top-0 h-screen bg-accent border-r flex flex-col"
		>
			{/* Header */}
			<div className="p-4 border-b">
				<div className="flex items-center justify-between mb-3">
					<div className="flex items-center gap-2">
						<div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-sm flex items-center justify-center">
							<Bot className="h-3 w-3 text-white" />
						</div>
						<span className="font-semibold text-sm">Zé</span>
					</div>
					<Button
						onClick={onToggleCollapse}
						variant="ghost"
						size="icon"
						className="h-6 w-6 text-muted-foreground hover:bg-muted"
					>
						<ChevronLeft className="h-3 w-3" />
					</Button>
				</div>

				{/* Novo Chat */}
				<Button
					onClick={onNewChat}
					className="w-full bg-muted hover:bg-muted/80 text-foreground border-0 h-9 text-sm font-normal rounded-xl"
				>
					<Plus className="h-4 w-4 mr-2" />
					Nova conversa
				</Button>
			</div>

			{/* Busca */}
			<div className="p-4 border-b">
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Buscar conversas..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-9 bg-background border-input text-foreground placeholder:text-muted-foreground h-9 text-sm rounded-xl"
					/>
				</div>
			</div>

			{/* Lista de Conversas */}
			<ScrollArea className="flex-1">
				<div className="p-2">
					{Object.entries(groupedSessions).map(([groupName, groupSessions]) => (
						<div key={groupName} className="mb-4">
							{/* Título do Grupo */}
							<div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
								{groupName}
							</div>

							{/* Sessões do Grupo */}
							<div className="space-y-1">
								{groupSessions.map((session) => (
									<div
										key={session.id}
										className={`group relative rounded-xl transition-colors ${currentSessionId === session.id
											? 'bg-primary/10 text-primary'
											: 'hover:bg-muted'
											}`}
									>
										{editingId === session.id ? (
											/* Modo de Edição */
											<div className="flex items-center gap-2 p-2">
												<MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<Input
													ref={editInputRef}
													value={editingTitle}
													onChange={(e) => setEditingTitle(e.target.value)}
													onKeyDown={handleKeyDown}
													className="flex-1 bg-background border-input text-foreground text-sm h-6 px-2 rounded-lg"
												/>
												<div className="flex items-center gap-1">
													<Button
														onClick={handleSaveEdit}
														variant="ghost"
														size="icon"
														className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-muted"
													>
														<Check className="h-3 w-3" />
													</Button>
													<Button
														onClick={handleCancelEdit}
														variant="ghost"
														size="icon"
														className="h-6 w-6 text-muted-foreground hover:bg-muted"
													>
														<X className="h-3 w-3" />
													</Button>
												</div>
											</div>
										) : (
											/* Modo Normal */
											<div
												onClick={() => onSessionSelect(session.id)}
												className="flex items-center gap-2 p-2 cursor-pointer"
											>
												<MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<div className="flex-1 min-w-0">
													<div className="text-sm truncate">
														{session.title}
													</div>
													{session.lastMessage && (
														<div className="text-xs text-muted-foreground truncate">
															{session.lastMessage}
														</div>
													)}
												</div>

												{/* Menu de Ações */}
												<div className="opacity-0 group-hover:opacity-100 transition-opacity">
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<Button
																variant="ghost"
																size="icon"
																className="h-6 w-6 text-muted-foreground hover:bg-muted"
																onClick={(e) => e.stopPropagation()}
															>
																<MoreHorizontal className="h-3 w-3" />
															</Button>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align="end"
															className="bg-popover border-border"
														>
															<DropdownMenuItem
																onClick={(e) => {
																	e.stopPropagation()
																	handleStartEdit(session)
																}}
																className="text-popover-foreground hover:bg-accent"
															>
																<Edit3 className="h-4 w-4 mr-2" />
																Renomear
															</DropdownMenuItem>
															<DropdownMenuItem
																onClick={(e) => {
																	e.stopPropagation()
																	onDeleteSession(session.id)
																}}
																className="text-destructive hover:bg-destructive/10"
															>
																<Trash2 className="h-4 w-4 mr-2" />
																Excluir
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					))}

					{filteredSessions.length === 0 && (
						<div className="text-center py-8">
							<MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
							<p className="text-muted-foreground text-sm">
								{searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
							</p>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Footer */}
			{sessions.length > 0 && (
				<div className="p-3 border-t">
					<Button
						onClick={onClearAll}
						variant="ghost"
						className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 text-sm rounded-xl"
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Limpar conversas
					</Button>
				</div>
			)}
		</motion.div>
	)
}
