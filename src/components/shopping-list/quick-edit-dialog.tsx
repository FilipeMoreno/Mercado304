"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"

interface ShoppingListItem {
	id: string
	quantity: number | string
	estimatedPrice?: number
	isChecked: boolean
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

interface QuickEditDialogProps {
	item: ShoppingListItem | null
	isOpen: boolean
	onClose: () => void
	onUpdate: (itemId: string, updates: { quantity: number; estimatedPrice?: number }) => void
	onDelete: (item: ShoppingListItem) => void
}

export function QuickEditDialog({ item, isOpen, onClose, onUpdate, onDelete }: QuickEditDialogProps) {
	const [quantity, setQuantity] = useState("")
	const [estimatedPrice, setEstimatedPrice] = useState("")

	// Atualizar valores quando o item mudar
	useEffect(() => {
		if (item) {
			setQuantity(item.quantity.toString())
			setEstimatedPrice(item.estimatedPrice?.toString() || "")
		}
	}, [item])

	if (!item) return null

	const handleSave = () => {
		const price = estimatedPrice ? parseFloat(estimatedPrice) : undefined
		const qty = parseFloat(quantity) || 0
		if (qty <= 0) {
			toast.error("Quantidade deve ser maior que zero")
			return
		}
		onUpdate(item.id, { quantity: qty, estimatedPrice: price })
		onClose()
	}

	const handleQuantityChange = (newQuantity: string) => {
		// Permitir campo vazio
		if (newQuantity === "") {
			setQuantity("")
			return
		}
		
		// Normalizar vírgula para ponto
		const normalized = newQuantity.replace(',', '.')
		
		// Validar se é um número válido (incluindo decimais)
		const numberRegex = /^\d*\.?\d*$/
		if (numberRegex.test(normalized)) {
			const parsed = parseFloat(normalized)
			if (!isNaN(parsed) && parsed >= 0) {
				setQuantity(normalized)
			}
		}
	}

	const handleQuantityIncrement = () => {
		const current = parseFloat(quantity) || 0
		setQuantity((current + 1).toString())
	}

	const handleQuantityDecrement = () => {
		const current = parseFloat(quantity) || 0
		if (current > 0.001) {
			setQuantity(Math.max(0.001, current - 1).toString())
		}
	}

	const totalPrice = (parseFloat(quantity) || 0) * (parseFloat(estimatedPrice) || 0)
	const productName = item.product?.name || item.productName || "Item"
	const productUnit = item.product?.unit || item.productUnit || "unidade"

	return (
		<ResponsiveFormDialog
			open={isOpen}
			onOpenChange={(open) => !open && onClose()}
			title={productName}
			description={`Editar quantidade e preço do item`}
		>
			<div className="space-y-6">
				{/* Informações do produto */}
				<div className="text-center p-4 bg-gray-50 rounded-lg">
					<h3 className="font-medium text-gray-900">{productName}</h3>
					{item.product?.brand && (
						<p className="text-sm text-gray-600">{item.product.brand.name}</p>
					)}
				</div>

				{/* Quantidade */}
				<div className="space-y-2">
					<Label htmlFor="quantity">Quantidade</Label>
					<div className="flex items-center gap-3">
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleQuantityDecrement}
							disabled={parseFloat(quantity) <= 0.001}
							className="h-12 w-12"
						>
							<Minus className="h-4 w-4" />
						</Button>
						<div className="flex-1 text-center">
							<Input
								id="quantity"
								type="text"
								inputMode="decimal"
								value={quantity}
								onChange={(e) => handleQuantityChange(e.target.value)}
								className="text-center text-lg font-medium h-12"
								placeholder="0,000"
							/>
							<p className="text-sm text-gray-500 mt-1">{productUnit}</p>
						</div>
						<Button
							type="button"
							variant="outline"
							size="icon"
							onClick={handleQuantityIncrement}
							className="h-12 w-12"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Preço unitário */}
				<div className="space-y-2">
					<Label htmlFor="price">Preço unitário (R$)</Label>
					<Input
						id="price"
						type="number"
						step="0.01"
						placeholder="0,00"
						value={estimatedPrice}
						onChange={(e) => setEstimatedPrice(e.target.value)}
						className="text-lg"
					/>
				</div>

				{/* Valor total */}
				{totalPrice > 0 && (
					<div className="p-4 bg-blue-50 rounded-lg">
						<div className="flex justify-between items-center">
							<span className="font-medium text-blue-900">Valor Total:</span>
							<span className="text-xl font-bold text-blue-900">
								R$ {totalPrice.toFixed(2)}
							</span>
						</div>
						{parseFloat(quantity) > 1 && (
							<p className="text-sm text-blue-700 mt-1">
								{parseFloat(quantity)} × R$ {(parseFloat(estimatedPrice) || 0).toFixed(2)}
							</p>
						)}
					</div>
				)}

				{/* Botões de ação */}
				<div className="flex gap-3 pt-4">
					<Button
						type="button"
						variant="destructive"
						onClick={() => {
							onDelete(item)
							onClose()
						}}
						className="flex-1"
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Remover
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						className="flex-2"
					>
						Salvar Alterações
					</Button>
				</div>
			</div>
		</ResponsiveFormDialog>
	)
}
