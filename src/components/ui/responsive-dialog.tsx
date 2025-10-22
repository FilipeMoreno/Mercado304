"use client"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MobileModal } from "@/components/ui/mobile-modal"
import { useIsMobile } from "@/hooks/use-mobile"

interface ResponsiveDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title?: string
	description?: string
	children: ReactNode
	// Props específicas para desktop
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
	maxHeight?: boolean // Se deve controlar altura máxima
	// Props específicas para mobile
	dragToClose?: boolean
	swipeToClose?: boolean
	preventScrollClose?: boolean
	subtitle?: string
}

export function ResponsiveDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	maxWidth = "md",
	maxHeight = true,
	dragToClose = true,
	swipeToClose = true,
	preventScrollClose = true,
	subtitle,
}: ResponsiveDialogProps) {
	const isMobile = useIsMobile()

	const handleClose = () => onOpenChange(false)

	if (isMobile) {
		return (
			<MobileModal
				isOpen={open}
				onClose={handleClose}
				{...(title ? { title } : {})}
				{...(subtitle || description ? { subtitle: subtitle || description } : {})}
				dragToClose={dragToClose}
				swipeToClose={swipeToClose}
				preventScrollClose={preventScrollClose}
			>
				{children}
			</MobileModal>
		)
	}

	const maxWidthClasses = {
		sm: "max-w-sm",
		md: "max-w-md",
		lg: "max-w-lg",
		xl: "max-w-xl",
		"2xl": "max-w-2xl",
	}

	const heightClasses = maxHeight ? "max-h-[90vh] overflow-hidden flex flex-col" : ""

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={`${maxWidthClasses[maxWidth]} ${heightClasses}`}>
				<DialogHeader className={maxHeight ? "shrink-0" : ""}>
					{title ? (
						<DialogTitle>{title}</DialogTitle>
					) : (
						<VisuallyHidden asChild>
							<DialogTitle>Dialog</DialogTitle>
						</VisuallyHidden>
					)}
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<div className={maxHeight ? "flex-1 overflow-y-auto min-h-0" : ""}>{children}</div>
			</DialogContent>
		</Dialog>
	)
}
