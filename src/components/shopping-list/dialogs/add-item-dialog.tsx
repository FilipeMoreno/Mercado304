"use client"

import { ChevronDown, ChevronUp, Plus, Save } from "lucide-react"
import { useState } from "react"
import { ProductSelect } from "@/components/selects/product-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const units = ["unidade", "kg", "g", "litro", "ml", "pacote", "caixa", "garrafa", "lata", "saco"]

interface NewItem {
	productId?: string
	productName: string
	quantity: number
	estimatedPrice?: number
	productUnit: string
	brand?: string
	category?: string
	notes?: string
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
	const [showAdvanced, setShowAdvanced] = useState(false)
	const [useProductSelect, setUseProductSelect] = useState(false)

	const handleProductSelected = (productId: string) => {
		const product = products.find(p => p.id === productId)
		if (product) {
			onNewItemChange({
				...newItem,
				productId: product.id,
				productName: product.name,
				productUnit: product.unit || 'unidade',
				brand: product.brand?.name || '',
				category: product.category?.name || '',
			})
		}
	}

	return (
		<ResponsiveDialog
			open={isOpen}
			onOpenChange={onClose}
			title="Adicionar Item à Lista"
			maxWidth="xl"
		>
			<div className="space-y-4 max-h-[70vh] overflow-y-auto">
				{/* Toggle entre texto livre e produto cadastrado */}
				<div className="flex gap-2">
					<Button
						type="button"
						variant={!useProductSelect ? "default" : "outline"}
						size="sm"
						onClick={() => setUseProductSelect(false)}
						className="flex-1"
					>
						Texto Livre
					</Button>
					<Button
						type="button"
						variant={useProductSelect ? "default" : "outline"}
						size="sm"
						onClick={() => setUseProductSelect(true)}
						className="flex-1"
					>
						Produto Cadastrado
					</Button>
				</div>

				{useProductSelect ? (
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<Label>Produto *</Label>
							<Button type="button" variant="outline" size="sm" onClick={onCreateQuickProduct}>
								<Plus className="h-3 w-3 mr-1" />
								Novo Produto
							</Button>
						</div>
						<div className="min-w-0">
							<ProductSelect
								value={newItem.productId}
								products={products}
								onValueChange={handleProductSelected}
								preserveFormData={preserveFormData}
							/>
						</div>
					</div>
				) : (
					<div className="space-y-2">
						<Label>Nome do Item *</Label>
						<Input
							value={newItem.productName}
							onChange={(e) =>
								onNewItemChange({
									...newItem,
									productName: e.target.value,
								})
							}
							placeholder="Ex: Arroz, Feijão, Macarrão..."
							autoFocus
						/>
					</div>
				)}

				<div className="grid grid-cols-2 gap-4">
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
						<Label>Unidade *</Label>
						<Select
							value={newItem.productUnit}
							onValueChange={(value) => onNewItemChange({ ...newItem, productUnit: value })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{units.map((unit) => (
									<SelectItem key={unit} value={unit}>
										{unit}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
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
								estimatedPrice: parseFloat(e.target.value) || undefined,
							})
						}
						placeholder="0.00"
					/>
				</div>

				{/* Informações adicionais (colapsável) */}
				{!useProductSelect && (
					<div className="space-y-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={() => setShowAdvanced(!showAdvanced)}
							className="w-full justify-between"
						>
							<span>Informações Adicionais (opcional)</span>
							{showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
						</Button>

						{showAdvanced && (
							<div className="space-y-3 pt-2 border-t">
								<div className="space-y-2">
									<Label>Marca</Label>
									<Input
										value={newItem.brand || ""}
										onChange={(e) =>
											onNewItemChange({
												...newItem,
												brand: e.target.value,
											})
										}
										placeholder="Ex: Tio João, Camil..."
									/>
								</div>

								<div className="space-y-2">
									<Label>Categoria</Label>
									<Input
										value={newItem.category || ""}
										onChange={(e) =>
											onNewItemChange({
												...newItem,
												category: e.target.value,
											})
										}
										placeholder="Ex: Grãos, Bebidas..."
									/>
								</div>

								<div className="space-y-2">
									<Label>Observações</Label>
									<Input
										value={newItem.notes || ""}
										onChange={(e) =>
											onNewItemChange({
												...newItem,
												notes: e.target.value,
											})
										}
										placeholder="Notas sobre o item..."
									/>
								</div>
							</div>
						)}
					</div>
				)}

				<div className="flex gap-2 pt-4">
					<Button
						onClick={onAdd}
						disabled={adding || !newItem.productName.trim()}
						className="flex-1"
					>
						<Save className="h-4 w-4 mr-2" />
						{adding ? "Adicionando..." : "Adicionar"}
					</Button>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	)
}
