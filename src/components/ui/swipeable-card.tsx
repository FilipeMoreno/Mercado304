"use client"

import { AnimatePresence, motion, type PanInfo } from "framer-motion"
import { Archive, Edit3, MoreHorizontal, Trash2 } from "lucide-react"
import { type ReactNode, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SwipeAction {
	icon: ReactNode
	color: string
	background: string
	action: () => void
	threshold?: number
}

interface SwipeableCardProps {
	children: ReactNode
	className?: string
	leftActions?: SwipeAction[]
	rightActions?: SwipeAction[]
	onLongPress?: () => void
	onClick?: () => void
	disabled?: boolean
	dragConstraints?: { left: number; right: number }
}

const defaultLeftActions: SwipeAction[] = [
	{
		icon: <Archive className="size-5" />,
		color: "text-blue-600",
		background: "bg-blue-100",
		action: () => console.log("Archive"),
		threshold: 80,
	},
]

const defaultRightActions: SwipeAction[] = [
	{
		icon: <Edit3 className="size-5" />,
		color: "text-green-600",
		background: "bg-green-100",
		action: () => console.log("Edit"),
		threshold: 80,
	},
	{
		icon: <Trash2 className="size-5" />,
		color: "text-red-600",
		background: "bg-red-100",
		action: () => console.log("Delete"),
		threshold: 120,
	},
]

export function SwipeableCard({
	children,
	className,
	leftActions = defaultLeftActions,
	rightActions = defaultRightActions,
	onLongPress,
	onClick,
	disabled = false,
	dragConstraints,
}: SwipeableCardProps) {
	const [dragX, setDragX] = useState(0)
	const [isDragging, setIsDragging] = useState(false)
	const [showActions, setShowActions] = useState(false)
	const dragRef = useRef<HTMLDivElement>(null)
	const longPressTimer = useRef<NodeJS.Timeout>(undefined)

	const handleDragStart = () => {
		if (disabled) return
		setIsDragging(true)
		setShowActions(true)
	}

	const handleDrag = (_: any, info: PanInfo) => {
		if (disabled) return
		setDragX(info.offset.x)
	}

	const handleDragEnd = (_: any, info: PanInfo) => {
		if (disabled) return

		setIsDragging(false)
		const swipeDistance = Math.abs(info.offset.x)
		const swipeVelocity = Math.abs(info.velocity.x)

		// Determinar ações baseadas na distância e velocidade
		if (info.offset.x > 0) {
			// Swipe para direita (ações esquerdas)
			const triggeredAction = leftActions.find(
				(action) => swipeDistance >= (action.threshold || 80) || swipeVelocity > 500,
			)
			if (triggeredAction) {
				triggeredAction.action()
			}
		} else if (info.offset.x < 0) {
			// Swipe para esquerda (ações direitas)
			const triggeredAction = rightActions.find(
				(action) => swipeDistance >= (action.threshold || 80) || swipeVelocity > 500,
			)
			if (triggeredAction) {
				triggeredAction.action()
			}
		}

		// Reset posição
		setDragX(0)
		setTimeout(() => setShowActions(false), 200)
	}

	const handleTouchStart = () => {
		if (onLongPress && !disabled) {
			longPressTimer.current = setTimeout(() => {
				onLongPress()
			}, 500)
		}
	}

	const handleTouchEnd = () => {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current)
		}
	}

	const _getActiveActions = () => {
		if (dragX > 0) return leftActions
		if (dragX < 0) return rightActions
		return []
	}

	const getActionOpacity = (action: SwipeAction, index: number) => {
		const absDistance = Math.abs(dragX)
		const threshold = action.threshold || 80
		const baseOpacity = Math.min(absDistance / threshold, 1)
		const staggerDelay = index * 0.1
		return Math.max(0, baseOpacity - staggerDelay)
	}

	if (disabled) {
		return <Card className={cn("relative overflow-hidden", className)}>{children}</Card>
	}

	return (
		<div className="relative">
			{/* Actions Background */}
			<AnimatePresence>
				{showActions && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="absolute inset-0 flex"
					>
						{/* Left Actions */}
						<div className="flex items-center justify-start pl-4 flex-1">
							{dragX > 0 &&
								leftActions.map((action, index) => (
									<motion.div
										key={`left-${index}`}
										style={{ opacity: getActionOpacity(action, index) }}
										className={cn("w-12 h-12 rounded-full flex items-center justify-center mr-2", action.background)}
									>
										<div className={action.color}>{action.icon}</div>
									</motion.div>
								))}
						</div>

						{/* Right Actions */}
						<div className="flex items-center justify-end pr-4 flex-1">
							{dragX < 0 &&
								rightActions.map((action, index) => (
									<motion.div
										key={`right-${index}`}
										style={{ opacity: getActionOpacity(action, index) }}
										className={cn("w-12 h-12 rounded-full flex items-center justify-center ml-2", action.background)}
									>
										<div className={action.color}>{action.icon}</div>
									</motion.div>
								))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Main Card */}
			<motion.div
				ref={dragRef}
				drag="x"
				dragConstraints={dragConstraints || { left: -200, right: 200 }}
				dragElastic={0.1}
				dragMomentum={true}
				dragTransition={{
					bounceStiffness: 600,
					bounceDamping: 10,
					power: 0.3,
				}}
				onDragStart={handleDragStart}
				onDrag={handleDrag}
				onDragEnd={handleDragEnd}
				onTouchStart={handleTouchStart}
				onTouchEnd={handleTouchEnd}
				onClick={onClick}
				animate={{
					...(isDragging ? {} : { x: 0 }),
					scale: isDragging ? 0.98 : 1,
				}}
				transition={{
					type: "spring",
					stiffness: 400,
					damping: 25,
					duration: 0.3,
				}}
				className="relative z-10"
				whileTap={{ scale: 0.98 }}
			>
				<Card
					className={cn(
						"relative overflow-hidden transition-shadow-sm duration-200",
						isDragging && "shadow-lg",
						className,
					)}
				>
					{children}

					{/* Drag Indicator */}
					{isDragging && (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 0.3 }}
							className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
						>
							<MoreHorizontal className="size-6 text-gray-400" />
						</motion.div>
					)}
				</Card>
			</motion.div>
		</div>
	)
}
