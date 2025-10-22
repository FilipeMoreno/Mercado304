"use client"

import type { ReactNode } from "react"
import { Button } from "./button"
import { ResponsiveDialog } from "./responsive-dialog"

interface ResponsiveConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description?: string
	children?: ReactNode
	// Actions
	onConfirm: () => void
	onCancel?: () => void
	// Button customization
	confirmText?: string
	cancelText?: string
	confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
	isLoading?: boolean
	// Icon for mobile
	icon?: ReactNode
}

export function ResponsiveConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	onConfirm,
	onCancel,
	confirmText = "Confirmar",
	cancelText = "Cancelar",
	confirmVariant = "default",
	isLoading = false,
	icon,
}: ResponsiveConfirmDialogProps) {
	const handleCancel = () => {
		onCancel?.()
		onOpenChange(false)
	}

	const handleConfirm = () => {
		onConfirm()
	}

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			{...(description ? { description, subtitle: description } : {})}
		>
			<div className="space-y-4">
				{/* Icon para mobile */}
				{icon && (
					<div className="flex items-center justify-center size-16 mx-auto bg-gray-100 rounded-full sm:hidden">
						{icon}
					</div>
				)}

				{/* Conteúdo personalizado */}
				{children && <div className="text-center sm:text-left">{children}</div>}

				{/* Botões de ação */}
				<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
					<Button
						variant={confirmVariant}
						onClick={handleConfirm}
						disabled={isLoading}
						className="w-full sm:flex-1 order-2 sm:order-1"
					>
						{isLoading ? "Carregando..." : confirmText}
					</Button>
					<Button
						variant="outline"
						onClick={handleCancel}
						disabled={isLoading}
						className="w-full sm:w-auto order-1 sm:order-2"
					>
						{cancelText}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	)
}
