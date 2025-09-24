"use client"

import { Trash2 } from "lucide-react"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"

interface DeleteListDialogProps {
	isOpen: boolean
	onClose: () => void
	listName: string
	onDelete: () => Promise<void>
	deleting: boolean
}

export function DeleteListDialog({ isOpen, onClose, listName, onDelete, deleting }: DeleteListDialogProps) {
	return (
		<ResponsiveConfirmDialog
			open={isOpen}
			onOpenChange={onClose}
			title="Confirmar Exclusão"
			onConfirm={onDelete}
			onCancel={onClose}
			confirmText="Sim, Excluir"
			cancelText="Cancelar"
			confirmVariant="destructive"
			isLoading={deleting}
			icon={<Trash2 className="h-8 w-8 text-red-500" />}
		>
			<div className="space-y-4">
				<p>
					Tem certeza que deseja excluir a lista <strong>{listName}</strong>?
				</p>
				<p className="text-sm text-gray-600">
					Esta ação não pode ser desfeita e todos os itens da lista serão perdidos.
				</p>
			</div>
		</ResponsiveConfirmDialog>
	)
}
