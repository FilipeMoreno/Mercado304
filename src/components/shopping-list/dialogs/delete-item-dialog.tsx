"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

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
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Trash2 className="h-5 w-5 text-red-500" />
						Remover Item
					</DialogTitle>
				</DialogHeader>
				{deleteItemConfirm && (
					<div className="space-y-4">
						<p>
							Tem certeza que deseja remover{" "}
							<strong>{deleteItemConfirm.product?.name || deleteItemConfirm.productName}</strong> da lista?
						</p>
						<p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
						<div className="flex gap-2 pt-4">
							<Button variant="destructive" onClick={onDelete} disabled={deleting} className="flex-1">
								<Trash2 className="h-4 w-4 mr-2" />
								{deleting ? "Removendo..." : "Sim, Remover"}
							</Button>
							<Button variant="outline" onClick={onClose}>
								Cancelar
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	)
}
