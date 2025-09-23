"use client"

import type { ReactNode } from "react"
import { Button } from "./button"
import { ResponsiveDialog } from "./responsive-dialog"

interface ResponsiveFormDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description?: string
	children: ReactNode
	// Form actions
	onSubmit?: () => void
	onCancel?: () => void
	// Button customization
	submitText?: string
	cancelText?: string
	submitVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
	isLoading?: boolean
	isSubmitDisabled?: boolean
	// Layout
	maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl"
}

export function ResponsiveFormDialog({
	open,
	onOpenChange,
	title,
	description,
	children,
	onSubmit,
	onCancel,
	submitText = "Salvar",
	cancelText = "Cancelar",
	submitVariant = "default",
	isLoading = false,
	isSubmitDisabled = false,
	maxWidth = "md",
}: ResponsiveFormDialogProps) {
	const handleCancel = () => {
		onCancel?.()
		onOpenChange(false)
	}

	const handleSubmit = () => {
		onSubmit?.()
	}

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={onOpenChange}
			title={title}
			description={description}
			subtitle={description}
			maxWidth={maxWidth}
		>
			<div className="space-y-4">
				{/* Conteúdo do formulário */}
				<div className="space-y-4">{children}</div>

				{/* Botões de ação (apenas se onSubmit for fornecido) */}
				{onSubmit && (
					<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t">
						<Button
							variant={submitVariant}
							onClick={handleSubmit}
							disabled={isLoading || isSubmitDisabled}
							className="w-full sm:flex-1 order-2 sm:order-1"
						>
							{isLoading ? "Salvando..." : submitText}
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
				)}
			</div>
		</ResponsiveDialog>
	)
}
