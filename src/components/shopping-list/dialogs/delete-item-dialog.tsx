"use client"

import { Trash2 } from "lucide-react"
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"

interface ShoppingListItem {
	id: string
	quantity: number
	estimatedPrice?: number
	isChecked: boolean
	bestPriceAlert?: any
	productName?: string
	productUnit?: string
	product?: {
		id: string
		name: string
		unit: string
		brand?: {
			name: string
		}
		category?: {
			id: string
			name: string
			icon?: string
		}
	}
}

interface DeleteItemDialogProps {
	isOpen: boolean
	onClose: () => void
	deleteItemConfirm: ShoppingListItem | null
	onDelete: () => Promise<void>
	deleting: boolean
}

export function DeleteItemDialog({ isOpen, onClose, deleteItemConfirm, onDelete, deleting }: DeleteItemDialogProps) {
	if (!deleteItemConfirm) return null

	return (
		<ResponsiveConfirmDialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			title="Remover Item"
			onConfirm={onDelete}
			onCancel={onClose}
			confirmText="Sim, Remover"
			cancelText="Cancelar"
			confirmVariant="destructive"
			isLoading={deleting}
			icon={<Trash2 className="h-8 w-8 text-red-500" />}
		>
			<div className="space-y-4">
				<p>
					Tem certeza que deseja remover{" "}
					<strong>{deleteItemConfirm.product?.name || deleteItemConfirm.productName}</strong> da lista?
				</p>
				<p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
			</div>
		</ResponsiveConfirmDialog>
	)
}
