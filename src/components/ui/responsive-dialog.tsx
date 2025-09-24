"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MobileModal } from "@/components/ui/mobile-modal"
import { useMobile } from "@/hooks/use-mobile"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface ResponsiveDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title?: string
	description?: string
	children: ReactNode
	// Props específicas para desktop
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
	// Props específicas para mobile
	dragToClose?: boolean
	swipeToClose?: boolean
	subtitle?: string
}

export function ResponsiveDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	maxWidth = "md",
	dragToClose = true,
	swipeToClose = true,
	subtitle,
}: ResponsiveDialogProps) {
	const mobile = useMobile()

	const handleClose = () => onOpenChange(false)

	if (mobile.isTouchDevice) {
		return (
			<MobileModal
				isOpen={open}
				onClose={handleClose}
				title={title}
				subtitle={subtitle || description}
				dragToClose={dragToClose}
				swipeToClose={swipeToClose}
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

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={maxWidthClasses[maxWidth]}>
				<DialogHeader>
					{title ? (
						<DialogTitle>{title}</DialogTitle>
					) : (
						<VisuallyHidden asChild>
							<DialogTitle>Dialog</DialogTitle>
						</VisuallyHidden>
					)}
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				{children}
			</DialogContent>
		</Dialog>
	)
}
