"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
	BarChart3,
	Calculator,
	Camera,
	Clock,
	List,
	Package,
	Search,
	ShoppingCart,
	Sparkles,
	TrendingDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Message } from "@/hooks/use-ai-chat"

interface SmartSuggestionsProps {
	onSuggestionClick: (suggestion: string) => void
	messages: Message[]
	isLoading: boolean
}

interface Suggestion {
	id: string
	text: string
	command: string
	icon: React.ReactNode
	category: "lista" | "precos" | "produtos" | "analise" | "geral"
	priority: number
}

const baseSuggestions: Suggestion[] = [
	{
		id: "create-weekly-list",
		text: "Criar lista semanal",
		command: "Crie uma lista de compras para a semana",
		icon: <List className="size-4" />,
		category: "lista",
		priority: 10,
	},
	{
		id: "compare-prices",
		text: "Comparar preços",
		command: "Compare os preços dos produtos que mais compro",
		icon: <TrendingDown className="size-4" />,
		category: "precos",
		priority: 9,
	},
	{
		id: "churrasco-calculator",
		text: "Calcular churrasco",
		command: "Quero fazer um churrasco",
		icon: <Calculator className="size-4" />,
		category: "geral",
		priority: 8,
	},
	{
		id: "search-products",
		text: "Buscar produtos",
		command: "Mostre produtos em promoção",
		icon: <Search className="size-4" />,
		category: "produtos",
		priority: 7,
	},
	{
		id: "stock-alerts",
		text: "Alertas de estoque",
		command: "Verifique meu estoque e produtos vencendo",
		icon: <Package className="size-4" />,
		category: "analise",
		priority: 6,
	},
	{
		id: "spending-analysis",
		text: "Análise de gastos",
		command: "Analise meus gastos do mês",
		icon: <BarChart3 className="size-4" />,
		category: "analise",
		priority: 5,
	},
	{
		id: "recent-purchases",
		text: "Compras recentes",
		command: "Mostre minhas compras recentes",
		icon: <Clock className="size-4" />,
		category: "geral",
		priority: 4,
	},
	{
		id: "scan-product",
		text: "Escanear produto",
		command: "Vou escanear um produto",
		icon: <Camera className="size-4" />,
		category: "produtos",
		priority: 3,
	},
]

export function SmartSuggestions({ onSuggestionClick, messages, isLoading }: SmartSuggestionsProps) {
	// Analisar contexto das mensagens para sugestões inteligentes
	const getContextualSuggestions = (): Suggestion[] => {
		const lastMessages = messages.slice(-5)
		const contextualSuggestions: Suggestion[] = []

		// Se mencionou churrasco recentemente
		const mentionedChurrasco = lastMessages.some((msg) => msg.content.toLowerCase().includes("churrasco"))
		if (mentionedChurrasco) {
			contextualSuggestions.push({
				id: "churrasco-list",
				text: "Lista para churrasco",
				command: "Crie uma lista completa para churrasco",
				icon: <Sparkles className="size-4" />,
				category: "lista",
				priority: 15,
			})
		}

		// Se mencionou produtos específicos
		const mentionedProducts = lastMessages.some(
			(msg) =>
				msg.role === "user" &&
				(msg.content.toLowerCase().includes("leite") ||
					msg.content.toLowerCase().includes("arroz") ||
					msg.content.toLowerCase().includes("açúcar")),
		)
		if (mentionedProducts) {
			contextualSuggestions.push({
				id: "similar-products",
				text: "Produtos similares",
				command: "Mostre produtos similares com melhor preço",
				icon: <Search className="size-4" />,
				category: "produtos",
				priority: 12,
			})
		}

		// Se criou lista recentemente
		const createdList = lastMessages.some(
			(msg) => msg.role === "assistant" && msg.content.toLowerCase().includes("lista criada"),
		)
		if (createdList) {
			contextualSuggestions.push({
				id: "add-to-list",
				text: "Adicionar mais itens",
				command: "Adicione mais itens à lista",
				icon: <ShoppingCart className="size-4" />,
				category: "lista",
				priority: 14,
			})
		}

		return contextualSuggestions
	}

	// Combinar sugestões base com contextuais
	const getAllSuggestions = (): Suggestion[] => {
		const contextual = getContextualSuggestions()
		const combined = [...contextual, ...baseSuggestions]

		// Remover duplicatas e ordenar por prioridade
		const unique = combined.filter((suggestion, index, self) => index === self.findIndex((s) => s.id === suggestion.id))

		return unique.sort((a, b) => b.priority - a.priority).slice(0, 6)
	}

	const suggestions = getAllSuggestions()

	// Se não há mensagens ou está carregando, mostrar sugestões básicas
	const shouldShow = !isLoading && (messages.length <= 1 || messages[messages.length - 1]?.role === "assistant")

	if (!shouldShow) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				transition={{ duration: 0.3 }}
				className="mb-4"
			>
				<Card className="p-4 bg-muted/50 border-border">
					<div className="flex items-center gap-2 mb-3">
						<Sparkles className="size-4 text-primary" />
						<span className="text-sm font-medium text-foreground">Sugestões para você</span>
					</div>

					<div className="grid grid-cols-2 gap-2">
						{suggestions.map((suggestion, index) => (
							<motion.div
								key={suggestion.id}
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{
									duration: 0.2,
									delay: index * 0.05,
								}}
							>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onSuggestionClick(suggestion.command)}
									className="w-full justify-start h-auto p-3 text-left hover:bg-muted hover:text-foreground transition-all duration-200"
								>
									<div className="flex items-center gap-2 w-full">
										<div className="text-primary shrink-0">{suggestion.icon}</div>
										<span className="text-xs font-medium truncate text-foreground">{suggestion.text}</span>
									</div>
								</Button>
							</motion.div>
						))}
					</div>

					<div className="mt-3 text-xs text-muted-foreground text-center">
						💡 Clique em uma sugestão ou digite sua própria pergunta
					</div>
				</Card>
			</motion.div>
		</AnimatePresence>
	)
}
