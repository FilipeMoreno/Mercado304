"use client"

import { Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ShoppingListItem {
	id: string
	quantity: number
	estimatedPrice?: number
	isChecked: boolean
	bestPriceAlert?: any
	productName?: string // Pode ser undefined temporariamente ao carregar
	productUnit?: string // Pode ser undefined temporariamente ao carregar
	brand?: string
	category?: string
	notes?: string
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
	onEdit: (item: any) => void
	onDelete: (item: any) => void
	onQuickEdit?: (item: any) => void
}

export function ShoppingListItemComponent({ item, onToggle, onEdit, onDelete, onQuickEdit }: ShoppingListItemProps) {
	const totalPrice = item.quantity * (item.estimatedPrice || 0)

	return (
		<div
			className={`flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 cursor-pointer ${item.isChecked ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
				}`}
			onClick={(e) => {
				// Evita abrir o dialog se clicar no checkbox ou botão de delete
				if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.item-content')) {
					if (onQuickEdit) {
						onQuickEdit(item)
					} else {
						onEdit(item)
					}
				}
			}}
		>
			<button
				onClick={(e) => {
					e.stopPropagation()
					onToggle(item.id, item.isChecked)
				}}
				className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${item.isChecked ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-green-400"
					}`}
			>
				{item.isChecked && <Check className="h-4 w-4" />}
			</button>

			<div className="flex-1 item-content">
				<div
					className={`font-medium transition-all duration-200 ${item.isChecked ? "line-through text-gray-500" : "text-gray-900"
						}`}
				>
					{item.product?.name || item.productName}
					{/* Mostra marca do produto cadastrado ou marca em texto livre */}
					{(item.product?.brand?.name || item.brand) && (
						<span className="text-gray-500 font-normal ml-2">
							- {item.product?.brand?.name || item.brand}
						</span>
					)}
					{/* Badge se não estiver vinculado a produto */}
					{!item.product && (
						<span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
							Texto livre
						</span>
					)}
				</div>
				<div className="text-sm text-gray-600 space-y-0.5">
					<div>
						{item.quantity} {item.product?.unit || item.productUnit || "unidades"}
						{item.estimatedPrice && (
							<span className="ml-2">
								• R$ {item.estimatedPrice.toFixed(2)}
								{item.quantity > 1 && ` (Total: R$ ${totalPrice.toFixed(2)})`}
							</span>
						)}
					</div>
					{/* Mostra categoria se houver (texto livre ou do produto) */}
					{(item.product?.category?.name || item.category) && (
						<div className="flex items-center gap-1 text-xs">
							{item.product?.category?.icon && <span>{item.product.category.icon}</span>}
							<span>{item.product?.category?.name || item.category}</span>
						</div>
					)}
					{/* Mostra notas se houver */}
					{item.notes && (
						<div className="text-xs text-gray-500 italic">
							💬 {item.notes}
						</div>
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
