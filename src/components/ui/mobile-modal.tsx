"use client"

import { AnimatePresence, motion, type PanInfo, useDragControls, type Variants } from "framer-motion"
import { X } from "lucide-react"
import { type ReactNode, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { useTouchGestures } from "@/hooks/use-touch-gestures"
import { cn } from "@/lib/utils"

interface MobileModalProps {
	isOpen: boolean
	onClose: () => void
	children: ReactNode
	title?: string
	subtitle?: string
	className?: string
	overlayClassName?: string
	panelClassName?: string
	closeOnOverlayClick?: boolean
	dragToClose?: boolean
	swipeToClose?: boolean
	fullHeight?: boolean
	showCloseButton?: boolean
	preventScrollClose?: boolean
}

export function MobileModal({
	isOpen,
	onClose,
	children,
	title,
	subtitle,
	className,
	overlayClassName,
	panelClassName,
	closeOnOverlayClick = true,
	dragToClose = true,
	swipeToClose = true,
	fullHeight = false,
	showCloseButton = true,
	preventScrollClose = false,
}: MobileModalProps) {
	const [dragY, setDragY] = useState(0)
	const dragControls = useDragControls()
	const containerRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)

	// Gesture handlers
	const touchGestures = useTouchGestures({
		onSwipeDown: swipeToClose ? onClose : undefined,
		swipeThreshold: 100,
	})

	useEffect(() => {
		if (isOpen) {
			// Prevenir scroll do body quando modal estiver aberto
			document.body.style.overflow = "hidden"
		} else {
			// Restaurar scroll
			document.body.style.overflow = "unset"
		}

		return () => {
			document.body.style.overflow = "unset"
		}
	}, [isOpen])

	const handleDrag = (_: any, info: PanInfo) => {
		// Apenas permitir drag para baixo
		if (info.offset.y > 0) {
			setDragY(info.offset.y)
		}
	}

	const handleDragEnd = (_: any, info: PanInfo) => {
		const { offset, velocity } = info
		const threshold = 150
		const velocityThreshold = 500

		// Fechar se arrastou muito para baixo ou velocidade alta
		if (offset.y > threshold || velocity.y > velocityThreshold) {
			onClose()
		} else {
			// Voltar para posição original
			setDragY(0)
		}
	}

	const isScrolledToTop = () => {
		if (!contentRef.current) return true
		return contentRef.current.scrollTop === 0
	}

	const shouldAllowDrag = () => {
		if (!dragToClose) return false
		if (preventScrollClose && !isScrolledToTop()) return false
		return true
	}

	const overlayVariants: Variants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { duration: 0.3 },
		},
	}

	const modalVariants: Variants = {
		hidden: {
			y: "100%",
			opacity: 0,
		},
		visible: {
			y: 0,
			opacity: 1,
			transition: {
				type: "spring" as const,
				stiffness: 300,
				damping: 30,
			},
		},
		exit: {
			y: "100%",
			opacity: 0,
			transition: {
				duration: 0.3,
				ease: "easeInOut" as const,
			},
		},
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Overlay */}
					<motion.div
						className={cn("fixed inset-0 bg-black/50 z-50", overlayClassName)}
						variants={overlayVariants}
						initial="hidden"
						animate="visible"
						exit="hidden"
						onClick={closeOnOverlayClick ? onClose : undefined}
					/>

					{/* Modal */}
					<motion.div
						ref={containerRef}
						className={cn(
							"fixed inset-x-0 bottom-0 bg-white dark:bg-gray-950 rounded-t-2xl shadow-2xl z-50 flex flex-col",
							fullHeight ? "top-12" : "max-h-[90vh]",
							className,
						)}
						variants={modalVariants}
						initial="hidden"
						animate="visible"
						exit="exit"
						drag={shouldAllowDrag() ? "y" : false}
						dragControls={dragControls}
						dragConstraints={{ top: 0, bottom: 0 }}
						dragElastic={0.1}
						onDrag={handleDrag}
						onDragEnd={handleDragEnd}
						style={{
							y: dragY,
						}}
						{...(swipeToClose ? touchGestures : {})}
					>
						{/* Drag Handle */}
						{dragToClose && (
							<div className="flex justify-center pt-3 pb-2">
								<motion.div
									className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full cursor-grab active:cursor-grabbing"
									whileHover={{ scale: 1.1 }}
									whileTap={{ scale: 0.95 }}
									onPointerDown={(e) => {
										if (shouldAllowDrag()) {
											dragControls.start(e)
										}
									}}
								/>
							</div>
						)}

						{/* Header */}
						{(title || showCloseButton) && (
							<div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
								<div className="flex-1">
									{title && <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
									{subtitle && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
								</div>

								{showCloseButton && (
									<Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
										<X className="h-4 w-4" />
									</Button>
								)}
							</div>
						)}

						{/* Content */}
						<div
							ref={contentRef}
							className={cn("flex-1 overflow-y-auto overscroll-contain", panelClassName)}
							style={{
								WebkitOverflowScrolling: "touch",
							}}
						>
							<motion.div
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
								className="p-4"
							>
								{children}
							</motion.div>
						</div>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	)
}
