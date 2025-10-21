"use client"

import { AlertTriangle } from "lucide-react"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

interface TextConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	confirmText: string
	confirmPlaceholder?: string
	onConfirm: () => void | Promise<void>
	isLoading?: boolean
	variant?: "default" | "destructive"
}

export function TextConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmText,
	confirmPlaceholder = "Digite para confirmar",
	onConfirm,
	isLoading = false,
	variant = "destructive",
}: TextConfirmDialogProps) {
	const [inputValue, setInputValue] = useState("")
	const inputId = useId()
	const isConfirmMatch = inputValue.toLowerCase().trim() === confirmText.toLowerCase().trim()

	const handleConfirm = async () => {
		if (!isConfirmMatch) return

		try {
			await onConfirm()
			handleClose()
		} catch (error) {
			console.error("Erro ao confirmar:", error)
		}
	}

	const handleClose = () => {
		setInputValue("")
		onOpenChange(false)
	}

	return (
		<ResponsiveDialog open={open} onOpenChange={onOpenChange} title={title} maxWidth="md">
			<div className="space-y-4">
				{/* Warning Message */}
				<div className="flex items-start gap-3 p-4 bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-lg">
					<AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
					<div className="flex-1">
						<p className="text-sm font-medium text-destructive dark:text-red-400">{description}</p>
					</div>
				</div>

				{/* Confirmation Input */}
				<div className="space-y-2">
					<Label htmlFor={inputId}>
						Para confirmar, digite: <span className="font-bold text-destructive">"{confirmText}"</span>
					</Label>
					<Input
						id={inputId}
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder={confirmPlaceholder}
						className="font-mono"
						autoComplete="off"
						disabled={isLoading}
					/>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						Cancelar
					</Button>
					<Button
						type="button"
						variant={variant}
						onClick={handleConfirm}
						disabled={!isConfirmMatch || isLoading}
						className="w-full sm:w-auto"
					>
						{isLoading ? "Processando..." : "Confirmar"}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	)
}
