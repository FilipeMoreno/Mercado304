"use client"

import { motion } from "framer-motion"
import { AlertTriangle, BarChart3, Calculator, List, Search, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

interface CarouselSuggestionsProps {
	onSuggestionClick: (suggestion: string) => void
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

export function CarouselSuggestions({ onSuggestionClick, isLoading, hasMessages = false }: CarouselSuggestionsProps) {
	if (isLoading || hasMessages) return null

	return (
		<div className="mb-4">
			<div className="flex items-center justify-between mb-3">
				<span className="text-sm font-medium text-foreground">Sugestões para você</span>
			</div>

			<Carousel
				opts={{
					align: "start",
					loop: false,
					dragFree: true,
					containScroll: false,
					skipSnaps: true,
					duration: 20,
				}}
				className="w-full"
			>
				<CarouselContent className="-ml-1">
					{suggestions.map((suggestion, index) => (
						<CarouselItem key={suggestion.id} className="pl-1 basis-[140px] shrink-0">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{
									duration: 0.2,
									delay: index * 0.05,
								}}
							>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => onSuggestionClick(suggestion.command)}
									className="h-auto p-3 text-left hover:bg-muted hover:text-foreground transition-all duration-200 bg-accent/50 w-[130px] flex-col gap-2"
								>
									<div className="text-primary">{suggestion.icon}</div>
									<span className="text-xs font-medium text-center text-foreground">{suggestion.text}</span>
								</Button>
							</motion.div>
						</CarouselItem>
					))}
				</CarouselContent>
				<CarouselPrevious className="hidden sm:flex -left-8 size-6 text-muted-foreground hover:text-foreground" />
				<CarouselNext className="hidden sm:flex -right-8 size-6 text-muted-foreground hover:text-foreground" />
			</Carousel>
		</div>
	)
}
