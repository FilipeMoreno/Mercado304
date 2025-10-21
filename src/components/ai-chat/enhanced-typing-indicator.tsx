"use client"

import { motion } from "framer-motion"
import { BarChart3, Bot, Brain, Calculator, Package, Search, ShoppingCart, Sparkles, Zap } from "lucide-react"
import { useEffect, useState } from "react"

interface EnhancedTypingIndicatorProps {
	context?: string
	customMessage?: string
}

const statusMessages = [
	{ icon: Brain, message: "Pensando...", color: "text-blue-500" },
	{ icon: Search, message: "Buscando produtos...", color: "text-green-500" },
	{ icon: Calculator, message: "Calculando preços...", color: "text-orange-500" },
	{ icon: ShoppingCart, message: "Analisando listas...", color: "text-purple-500" },
	{ icon: BarChart3, message: "Processando dados...", color: "text-indigo-500" },
	{ icon: Package, message: "Verificando estoque...", color: "text-teal-500" },
	{ icon: Sparkles, message: "Gerando sugestões...", color: "text-pink-500" },
	{ icon: Zap, message: "Finalizando...", color: "text-yellow-500" },
]

const contextualMessages: Record<string, (typeof statusMessages)[0]> = {
	search: { icon: Search, message: "Buscando produtos...", color: "text-green-500" },
	price: { icon: Calculator, message: "Comparando preços...", color: "text-orange-500" },
	list: { icon: ShoppingCart, message: "Criando lista...", color: "text-purple-500" },
	analysis: { icon: BarChart3, message: "Analisando dados...", color: "text-indigo-500" },
	stock: { icon: Package, message: "Verificando estoque...", color: "text-teal-500" },
	churrasco: { icon: Calculator, message: "Calculando churrasco...", color: "text-red-500" },
	suggestion: { icon: Sparkles, message: "Gerando sugestões...", color: "text-pink-500" },
}

export function EnhancedTypingIndicator({ context, customMessage }: EnhancedTypingIndicatorProps) {
	const [_currentMessageIndex, setCurrentMessageIndex] = useState(0)
	const [currentStatus, setCurrentStatus] = useState(statusMessages[0])

	useEffect(() => {
		// Se há contexto específico, usar mensagem contextual
		if (context && contextualMessages[context]) {
			setCurrentStatus(contextualMessages[context])
			return
		}

		// Se há mensagem customizada
		if (customMessage) {
			setCurrentStatus({
				icon: Bot,
				message: customMessage,
				color: "text-blue-500",
			})
			return
		}

		// Animação sequencial de status
		const interval = setInterval(() => {
			setCurrentMessageIndex((prev) => {
				const next = (prev + 1) % statusMessages.length
				setCurrentStatus(statusMessages[next])
				return next
			})
		}, 1500)

		return () => clearInterval(interval)
	}, [context, customMessage])

	const IconComponent = currentStatus.icon

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -10 }}
			className="flex items-center gap-3 p-4 bg-accent rounded-lg border relative"
		>
			{/* Avatar do Zé */}
			<div className="size-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shrink-0">
				<Bot className="size-4 text-white" />
			</div>

			{/* Indicador de status */}
			<div className="flex items-center gap-2 flex-1">
				<motion.div
					animate={{
						rotate: 360,
						scale: [1, 1.1, 1],
					}}
					transition={{
						rotate: { duration: 2, repeat: Infinity, ease: "linear" },
						scale: { duration: 1, repeat: Infinity },
					}}
					className={`${currentStatus.color} shrink-0`}
				>
					<IconComponent className="size-4" />
				</motion.div>

				<motion.span
					key={currentStatus.message}
					initial={{ opacity: 0, x: -10 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: 10 }}
					className="text-sm font-medium text-foreground"
				>
					{currentStatus.message}
				</motion.span>
			</div>

			{/* Dots animados */}
			<div className="flex items-center gap-1">
				{[0, 1, 2].map((i) => (
					<motion.div
						key={i}
						animate={{
							scale: [1, 1.5, 1],
							opacity: [0.3, 1, 0.3],
						}}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							delay: i * 0.2,
						}}
						className="w-2 h-2 bg-primary rounded-full"
					/>
				))}
			</div>

			{/* Barra de progresso animada */}
			<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted overflow-hidden rounded-b-lg">
				<motion.div
					animate={{
						x: ["-100%", "100%"],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: "linear",
					}}
					className="h-full w-1/3 bg-primary"
				/>
			</div>
		</motion.div>
	)
}
