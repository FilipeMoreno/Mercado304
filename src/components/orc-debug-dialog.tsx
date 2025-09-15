"use client"

import { Check, FileText, X } from "lucide-react"
import { Label } from "recharts"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface OcrDebugDialogProps {
	isOpen: boolean
	rawText: string
	onConfirm: () => void
	onCancel: () => void
}

export function OcrDebugDialog({ isOpen, rawText, onConfirm, onCancel }: OcrDebugDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Debug: Texto Extraído do Rótulo
					</DialogTitle>
					<DialogDescription>
						Este é o texto bruto que o sistema conseguiu ler da imagem. Verifique se está correto antes de continuar.
					</DialogDescription>
				</DialogHeader>
				<div className="my-4">
					<Label>Texto Extraído:</Label>
					<Textarea id="rawText" readOnly value={rawText} className="h-64 bg-secondary mt-2" />
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						<X className="mr-2 h-4 w-4" />
						Cancelar
					</Button>
					<Button onClick={onConfirm}>
						<Check className="mr-2 h-4 w-4" />
						Confirmar e Preencher Formulário
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
