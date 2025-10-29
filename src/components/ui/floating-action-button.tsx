"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export interface FABAction {
	icon: LucideIcon
	label: string
	onClick: () => void
	color?: string
}

interface FloatingActionButtonProps {
	actions?: FABAction[]
	onClick?: () => void
	icon?: LucideIcon
	label?: string
	className?: string
	position?: "bottom-right" | "bottom-left" | "bottom-center"
}

export function FloatingActionButton({
	actions,
	onClick,
	icon: Icon = Plus,
	label = "Ações",
	className,
	position = "bottom-right",
}: FloatingActionButtonProps) {
	const [isOpen, setIsOpen] = useState(false)

	// Se não há ações múltiplas, funciona como botão simples
	const isSingleAction = !actions || actions.length === 0

	const handleMainClick = () => {
		if (isSingleAction) {
			onClick?.()
		} else {
			setIsOpen(!isOpen)
		}
	}

	const handleActionClick = (action: FABAction) => {
		action.onClick()
		setIsOpen(false)
	}

	const positionClasses = {
		"bottom-right": "bottom-20 right-4 md:bottom-6 md:right-6",
		"bottom-left": "bottom-20 left-4 md:bottom-6 md:left-6",
		"bottom-center": "bottom-20 left-1/2 -translate-x-1/2 md:bottom-6",
	}

	return (
		<div className={cn("fixed z-30", positionClasses[position], className)}>
			<AnimatePresence>
				{/* Actions Menu */}
				{isOpen && actions && actions.length > 0 && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 20 }}
						transition={{ duration: 0.2 }}
						className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2"
					>
						{actions.map((action, index) => {
							const ActionIcon = action.icon
							return (
								<motion.button
									key={action.label}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									exit={{ opacity: 0, x: 20 }}
									transition={{ delay: index * 0.05 }}
									onClick={() => handleActionClick(action)}
									className={cn(
										"group flex items-center gap-3 bg-background border shadow-lg rounded-full px-4 py-3 hover:shadow-xl transition-all",
										action.color || "hover:bg-accent",
									)}
									title={action.label}
								>
									<span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
									<div
										className={cn(
											"w-10 h-10 rounded-full flex items-center justify-center",
											action.color || "bg-primary text-primary-foreground",
										)}
									>
										<ActionIcon className="h-5 w-5" />
									</div>
								</motion.button>
							)
						})}
					</motion.div>
				)}
			</AnimatePresence>

			{/* Main FAB Button */}
			<motion.button
				onClick={handleMainClick}
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				className={cn(
					"w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl border-2 border-primary/20 hover:shadow-primary/50 transition-all",
					isOpen && "bg-destructive hover:shadow-destructive/50",
				)}
				title={label}
			>
				<AnimatePresence mode="wait">
					{isOpen ? (
						<motion.div
							key="close"
							initial={{ rotate: -90, opacity: 0 }}
							animate={{ rotate: 0, opacity: 1 }}
							exit={{ rotate: 90, opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<X className="h-6 w-6" />
						</motion.div>
					) : (
						<motion.div
							key="icon"
							initial={{ rotate: 90, opacity: 0 }}
							animate={{ rotate: 0, opacity: 1 }}
							exit={{ rotate: -90, opacity: 0 }}
							transition={{ duration: 0.2 }}
						>
							<Icon className="h-6 w-6" />
						</motion.div>
					)}
				</AnimatePresence>
			</motion.button>
		</div>
	)
}
