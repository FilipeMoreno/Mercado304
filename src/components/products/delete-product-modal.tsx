"use client"

import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileModal } from "@/components/ui/mobile-modal"

interface DeleteProductModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	productName?: string
	isDeleting?: boolean
}

export function DeleteProductModal({
	isOpen,
	onClose,
	onConfirm,
	productName,
	isDeleting = false,
}: DeleteProductModalProps) {
	return (
		<MobileModal
			isOpen={isOpen}
			onClose={onClose}
			title="Confirmar Exclusão"
			subtitle="Esta ação não pode ser desfeita"
			dragToClose={true}
			swipeToClose={true}
		>
			<div className="space-y-4">
				<div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
					<Trash2 className="h-8 w-8 text-red-500" />
				</div>

				<div className="text-center space-y-2">
					<p className="text-lg font-medium">
						Tem certeza que deseja excluir o produto <strong>{productName}</strong>?
					</p>
					<p className="text-sm text-gray-600">
						Todas as informações relacionadas ao produto serão perdidas permanentemente.
					</p>
				</div>

				<div className="flex flex-col gap-3 pt-4">
					<Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="w-full">
						<Trash2 className="h-4 w-4 mr-2" />
						{isDeleting ? "Excluindo..." : "Sim, Excluir"}
					</Button>
					<Button variant="outline" onClick={onClose} disabled={isDeleting} className="w-full">
						Cancelar
					</Button>
				</div>
			</div>
		</MobileModal>
	)
}
