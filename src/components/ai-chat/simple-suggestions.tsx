"use client"

import { motion } from "framer-motion"
import { AlertTriangle, BarChart3, Calculator, List, Search, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SimpleSuggestionsProps {
	onSuggestionClick: (suggestion: string) => void
	messages: any[]
	isLoading: boolean
	hasMessages?: boolean
}

const suggestions = [
	{
		id: "create-weekly-list",
		text: "Criar lista semanal",
		command: "Crie uma lista de compras para a semana",
		icon: <List className="size-4" />,
	},
	{
		id: "compare-prices",
		text: "Comparar preços",
		command: "Compare os preços dos produtos que mais compro",
		icon: <TrendingDown className="size-4" />,
	},
	{
		id: "calculate-churrasco",
		text: "Calcular churrasco",
		command: "Calcule as quantidades para um churrasco de 10 pessoas",
		icon: <Calculator className="size-4" />,
	},
	{
		id: "search-products",
		text: "Buscar produtos",
		command: "Busque produtos em promoção no mercado",
		icon: <Search className="size-4" />,
	},
	{
		id: "stock-alerts",
		text: "Alertas de estoque",
		command: "Configure alertas para produtos em falta",
		icon: <AlertTriangle className="size-4" />,
	},
	{
		id: "expense-analysis",
		text: "Análise de gastos",
		command: "Analise meus gastos do último mês",
		icon: <BarChart3 className="size-4" />,
	},
]

export function SimpleSuggestions({ onSuggestionClick, messages, isLoading, hasMessages }: SimpleSuggestionsProps) {
	if (isLoading || (hasMessages !== undefined ? hasMessages : messages.length > 1)) return null

	return (
		<div className="mb-4">
			<div className="flex items-center gap-2 mb-3">
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
							className="w-full justify-start h-auto p-3 text-left hover:bg-muted hover:text-foreground transition-all duration-200 bg-accent/50"
						>
							<div className="flex items-center gap-2 w-full">
								<div className="text-primary shrink-0">{suggestion.icon}</div>
								<span className="text-xs font-medium truncate text-foreground">{suggestion.text}</span>
							</div>
						</Button>
					</motion.div>
				))}
			</div>
		</div>
	)
}
