"use client"

import { Check, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface ShoppingListItemProps {
	item: ShoppingListItem
	onToggle: (itemId: string, currentStatus: boolean) => void
	onEdit: (item: ShoppingListItem) => void
	onDelete: (item: ShoppingListItem) => void
}

export function ShoppingListItemComponent({ item, onToggle, onEdit, onDelete }: ShoppingListItemProps) {
	return (
		<div
			className={`flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 ${
				item.isChecked ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
			}`}
		>
			<button
				onClick={() => onToggle(item.id, item.isChecked)}
				className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
					item.isChecked ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"
				}`}
			>
				{item.isChecked && <Check className="h-4 w-4" />}
			</button>

			<div className="flex-1">
				<div
					className={`font-medium transition-all duration-200 ${
						item.isChecked ? "line-through text-gray-500" : "text-gray-900"
					}`}
				>
					{item.product?.name || item.productName}
					{item.product?.brand && <span className="text-gray-500 font-normal ml-2">- {item.product.brand.name}</span>}
				</div>
				<div className="text-sm text-gray-600">
					{item.quantity} {item.product?.unit || item.productUnit || "unidades"}
					{item.estimatedPrice && <span className="ml-2">• R$ {(item.quantity * item.estimatedPrice).toFixed(2)}</span>}
				</div>
			</div>

			<div className="flex items-center gap-2">
				{item.estimatedPrice && <div className="text-sm font-medium mr-2">R$ {item.estimatedPrice.toFixed(2)}</div>}
				<Button variant="outline" size="sm" onClick={() => onEdit(item)} title="Editar item">
					<Edit className="h-3 w-3" />
				</Button>
				<Button variant="destructive" size="sm" onClick={() => onDelete(item)} title="Remover item">
					<Trash2 className="h-3 w-3" />
				</Button>
			</div>
		</div>
	)
}
