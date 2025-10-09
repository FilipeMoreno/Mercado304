"use client"

import { Check, Trash2 } from "lucide-react"
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
	const totalPrice = item.quantity * (item.estimatedPrice || 0)
	
	return (
		<div
			className={`flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
				item.isChecked ? "bg-green-50 border-green-200" : "bg-white hover:bg-gray-50"
			}`}
			onClick={(e) => {
				// Evita abrir o dialog se clicar no checkbox ou botão de delete
				if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.item-content')) {
					onEdit(item)
				}
			}}
		>
			<button
				onClick={(e) => {
					e.stopPropagation()
					onToggle(item.id, item.isChecked)
				}}
				className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
					item.isChecked ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"
				}`}
			>
				{item.isChecked && <Check className="h-4 w-4" />}
			</button>

			<div className="flex-1 item-content">
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
					{item.estimatedPrice && (
						<span className="ml-2">
							• R$ {item.estimatedPrice.toFixed(2)}
							{item.quantity > 1 && ` (Total: R$ ${totalPrice.toFixed(2)})`}
						</span>
					)}
				</div>
			</div>

			<div className="flex items-center gap-2">
				{totalPrice > 0 && (
					<div className="text-right">
						<div className="text-sm font-medium">R$ {totalPrice.toFixed(2)}</div>
						{item.quantity > 1 && (
							<div className="text-xs text-gray-500">
								{item.quantity}x R$ {(item.estimatedPrice || 0).toFixed(2)}
							</div>
						)}
					</div>
				)}
				<Button 
					variant="destructive" 
					size="sm" 
					onClick={(e) => {
						e.stopPropagation()
						onDelete(item)
					}} 
					title="Remover item"
				>
					<Trash2 className="h-3 w-3" />
				</Button>
			</div>
		</div>
	)
}
