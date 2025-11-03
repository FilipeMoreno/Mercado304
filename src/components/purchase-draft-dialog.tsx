"use client"

import { AlertCircle, FileText, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PurchaseDraftDialogProps {
	open: boolean
	onRestore: () => void
	onDiscard: () => void
	timestamp: number
	itemCount: number
}

export function PurchaseDraftDialog({ open, onRestore, onDiscard, timestamp, itemCount }: PurchaseDraftDialogProps) {
	const timeAgo = formatDistanceToNow(new Date(timestamp), {
		addSuffix: true,
		locale: ptBR,
	})

	return (
		<AlertDialog open={open}>
			<AlertDialogContent className="max-w-md">
				<AlertDialogHeader>
					<div className="flex items-center gap-3 mb-2">
						<div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900">
							<FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
						</div>
						<div className="flex-1">
							<AlertDialogTitle className="text-xl">Compra não salva encontrada</AlertDialogTitle>
						</div>
					</div>
					<AlertDialogDescription className="space-y-3 text-base">
						<div className="flex items-start gap-2">
							<AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
							<p>
								Você tem uma compra em rascunho salva <strong>{timeAgo}</strong> com{" "}
								<strong>{itemCount} {itemCount === 1 ? "item" : "itens"}</strong>.
							</p>
						</div>
						<p className="text-muted-foreground">Deseja restaurar os dados salvos ou começar uma nova compra?</p>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="flex-col sm:flex-row gap-2">
					<AlertDialogCancel onClick={onDiscard} className="w-full sm:w-auto">
						<Trash2 className="w-4 h-4 mr-2" />
						Descartar rascunho
					</AlertDialogCancel>
					<AlertDialogAction onClick={onRestore} className="w-full sm:w-auto">
						<FileText className="w-4 h-4 mr-2" />
						Restaurar compra
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
