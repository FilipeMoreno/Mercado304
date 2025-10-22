"use client"

import { AnimatePresence, LayoutGroup, motion, type Variants } from "framer-motion"
import { type ReactNode, useCallback, useState } from "react"
import { cn } from "@/lib/utils"
import { SwipeableCard } from "./swipeable-card"

interface ListItem {
	id: string | number
	content: ReactNode
	data?: any
}

interface AnimatedListProps {
	items: ListItem[]
	onItemDelete?: (id: string | number) => void
	onItemEdit?: (id: string | number, data?: any) => void
	onItemArchive?: (id: string | number) => void
	onItemSelect?: (id: string | number, data?: any) => void
	onItemLongPress?: (id: string | number, data?: any) => void
	className?: string
	itemClassName?: string
	enableSwipeActions?: boolean
	enableAnimations?: boolean
	staggerDelay?: number
	layoutId?: string
}

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
}

const itemVariants: Variants = {
	hidden: {
		opacity: 0,
		y: 20,
		scale: 0.95,
	},
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: {
			type: "spring" as const,
			stiffness: 300,
			damping: 30,
		},
	},
	exit: {
		opacity: 0,
		x: -100,
		scale: 0.95,
		transition: {
			duration: 0.3,
			ease: "easeInOut" as const,
		},
	},
}

export function AnimatedList({
	items,
	onItemDelete,
	onItemEdit,
	onItemArchive,
	onItemSelect,
	onItemLongPress,
	className,
	itemClassName,
	enableSwipeActions = true,
	enableAnimations = true,
	staggerDelay = 0.1,
	layoutId,
}: AnimatedListProps) {
	const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set())

	const handleItemSelect = useCallback(
		(id: string | number, data?: any) => {
			if (onItemSelect) {
				onItemSelect(id, data)
			} else {
				// Toggle selection se não houver handler customizado
				setSelectedItems((prev) => {
					const newSet = new Set(prev)
					if (newSet.has(id)) {
						newSet.delete(id)
					} else {
						newSet.add(id)
					}
					return newSet
				})
			}
		},
		[onItemSelect],
	)

	const getSwipeActions = useCallback(
		(item: ListItem) => {
			const leftActions = []
			const rightActions = []

			if (onItemArchive) {
				leftActions.push({
					icon: <span className="text-sm">📁</span>,
					color: "text-blue-600",
					background: "bg-blue-100",
					action: () => onItemArchive(item.id),
					threshold: 80,
				})
			}

			if (onItemEdit) {
				rightActions.push({
					icon: <span className="text-sm">✏️</span>,
					color: "text-green-600",
					background: "bg-green-100",
					action: () => onItemEdit(item.id, item.data),
					threshold: 80,
				})
			}

			if (onItemDelete) {
				rightActions.push({
					icon: <span className="text-sm">🗑️</span>,
					color: "text-red-600",
					background: "bg-red-100",
					action: () => onItemDelete(item.id),
					threshold: 120,
				})
			}

			return { leftActions, rightActions }
		},
		[onItemArchive, onItemEdit, onItemDelete],
	)

	if (!enableAnimations) {
		return (
			<div className={cn("space-y-2", className)}>
				{items.map((item) => {
					const { leftActions, rightActions } = getSwipeActions(item)
					const isSelected = selectedItems.has(item.id)

					return (
						<div key={item.id} className={cn("relative", itemClassName)}>
							{enableSwipeActions ? (
								<SwipeableCard
									leftActions={leftActions}
									rightActions={rightActions}
									onLongPress={() => onItemLongPress?.(item.id, item.data)}
									className={cn(
										"cursor-pointer transition-all duration-200",
										isSelected && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
									)}
								>
									<div onClick={() => handleItemSelect(item.id, item.data)}>{item.content}</div>
								</SwipeableCard>
							) : (
								<div
									onClick={() => handleItemSelect(item.id, item.data)}
									onTouchStart={() => onItemLongPress?.(item.id, item.data)}
									className={cn(
										"cursor-pointer transition-all duration-200 p-4 rounded-lg border bg-white",
										isSelected && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
										itemClassName,
									)}
								>
									{item.content}
								</div>
							)}
						</div>
					)
				})}
			</div>
		)
	}

	return (
		<LayoutGroup {...(layoutId ? { id: layoutId } : {})}>
			<motion.div
				className={cn("space-y-2", className)}
				variants={containerVariants}
				initial="hidden"
				animate="visible"
			>
				<AnimatePresence mode="popLayout">
					{items.map((item, index) => {
						const { leftActions, rightActions } = getSwipeActions(item)
						const isSelected = selectedItems.has(item.id)

						return (
							<motion.div
								key={item.id}
								layout
								layoutId={`item-${item.id}`}
								variants={itemVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								custom={index}
								transition={{
									delay: index * staggerDelay,
									layout: { duration: 0.3 },
								}}
								className={cn("relative", itemClassName)}
								whileHover={{
									scale: 1.02,
									transition: { duration: 0.2 },
								}}
								whileTap={{ scale: 0.98 }}
							>
								{enableSwipeActions ? (
									<SwipeableCard
										leftActions={leftActions}
										rightActions={rightActions}
										onLongPress={() => onItemLongPress?.(item.id, item.data)}
										className={cn(
											"cursor-pointer transition-all duration-200",
											isSelected && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
										)}
									>
										<motion.div
											onClick={() => handleItemSelect(item.id, item.data)}
											whileHover={{ scale: 1.01 }}
											whileTap={{ scale: 0.99 }}
										>
											{item.content}
										</motion.div>
									</SwipeableCard>
								) : (
									<motion.div
										onClick={() => handleItemSelect(item.id, item.data)}
										onTouchStart={() => onItemLongPress?.(item.id, item.data)}
										className={cn(
											"cursor-pointer transition-all duration-200 p-4 rounded-lg border bg-white",
											isSelected && "ring-2 ring-blue-500 ring-opacity-50 bg-blue-50",
										)}
										whileHover={{
											boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
											transition: { duration: 0.2 },
										}}
									>
										{item.content}
									</motion.div>
								)}
							</motion.div>
						)
					})}
				</AnimatePresence>
			</motion.div>
		</LayoutGroup>
	)
}

export type { ListItem }
