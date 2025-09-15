"use client"

import { Plus, Save } from "lucide-react"
import { ProductSelect } from "@/components/selects/product-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface NewItem {
	productId: string
	quantity: number
	estimatedPrice: number
}

interface AddItemDialogProps {
	isOpen: boolean
	onClose: () => void
	newItem: NewItem
	onNewItemChange: (newItem: NewItem) => void
	products: any[]
	onAdd: () => Promise<void>
	adding: boolean
	onCreateQuickProduct: () => void
	preserveFormData?: any
}

export function AddItemDialog({
	isOpen,
	onClose,
	newItem,
	onNewItemChange,
	products,
	onAdd,
	adding,
	onCreateQuickProduct,
	preserveFormData,
}: AddItemDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Plus className="h-5 w-5" />
						Adicionar Item à Lista
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label>Produto *</Label>
							<Button type="button" variant="outline" size="sm" onClick={onCreateQuickProduct}>
								<Plus className="h-3 w-3 mr-1" />
								Novo Produto
							</Button>
						</div>
						<ProductSelect
							value={newItem.productId}
							products={products}
							onValueChange={(value) => onNewItemChange({ ...newItem, productId: value })}
							preserveFormData={preserveFormData}
						/>
					</div>

					<div className="space-y-2">
						<Label>Quantidade *</Label>
						<Input
							type="number"
							step="0.01"
							min="0.01"
							value={newItem.quantity}
							onChange={(e) =>
								onNewItemChange({
									...newItem,
									quantity: parseFloat(e.target.value) || 1,
								})
							}
							placeholder="1.00"
						/>
					</div>

					<div className="space-y-2">
						<Label>Preço Estimado (opcional)</Label>
						<Input
							type="number"
							step="0.01"
							min="0"
							value={newItem.estimatedPrice || ""}
							onChange={(e) =>
								onNewItemChange({
									...newItem,
									estimatedPrice: parseFloat(e.target.value) || 0,
								})
							}
							placeholder="0.00"
						/>
					</div>

					<div className="flex gap-2 pt-4">
						<Button onClick={onAdd} disabled={adding} className="flex-1">
							<Save className="h-4 w-4 mr-2" />
							{adding ? "Adicionando..." : "Adicionar"}
						</Button>
						<Button type="button" variant="outline" onClick={onClose}>
							Cancelar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
