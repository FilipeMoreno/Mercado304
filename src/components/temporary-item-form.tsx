"use client"

import { useState } from "react"
import { Plus, Barcode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TemporaryItemFormProps {
	onAddItem: (itemData: any) => void
	onCancel: () => void
}

export function TemporaryItemForm({ onAddItem, onCancel }: TemporaryItemFormProps) {
	const [formData, setFormData] = useState({
		productName: "",
		quantity: 1,
		productUnit: "un",
		estimatedPrice: "",
		tempDescription: "",
		tempBarcode: "",
		tempBrand: "",
		tempCategory: "",
		tempNotes: "",
	})

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!formData.productName.trim()) {
			alert("Nome do produto é obrigatório")
			return
		}

		const itemData = {
			...formData,
			isTemporary: true,
			estimatedPrice: formData.estimatedPrice ? parseFloat(formData.estimatedPrice) : undefined,
		}

		onAddItem(itemData)
		
		// Reset form
		setFormData({
			productName: "",
			quantity: 1,
			productUnit: "un",
			estimatedPrice: "",
			tempDescription: "",
			tempBarcode: "",
			tempBrand: "",
			tempCategory: "",
			tempNotes: "",
		})
	}

	const handleInputChange = (field: string, value: string | number) => {
		setFormData(prev => ({
			...prev,
			[field]: value
		}))
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Plus className="h-5 w-5 text-orange-500" />
					<CardTitle className="text-lg">Adicionar Item Temporário</CardTitle>
				</div>
				<CardDescription>
					Adicione um produto que não está cadastrado no sistema
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Nome do produto */}
					<div>
						<Label htmlFor="productName">Nome do Produto *</Label>
						<Input
							id="productName"
							value={formData.productName}
							onChange={(e) => handleInputChange("productName", e.target.value)}
							placeholder="Ex: Sabonete Dove Original 90g"
							required
						/>
					</div>

					{/* Quantidade e Unidade */}
					<div className="grid grid-cols-2 gap-4">
						<div>
							<Label htmlFor="quantity">Quantidade *</Label>
							<Input
								id="quantity"
								type="number"
								min="0.1"
								step="0.1"
								value={formData.quantity}
								onChange={(e) => handleInputChange("quantity", parseFloat(e.target.value))}
								required
							/>
						</div>
						<div>
							<Label htmlFor="productUnit">Unidade</Label>
							<Input
								id="productUnit"
								value={formData.productUnit}
								onChange={(e) => handleInputChange("productUnit", e.target.value)}
								placeholder="un, kg, L, etc."
							/>
						</div>
					</div>

					{/* Preço estimado */}
					<div>
						<Label htmlFor="estimatedPrice">Preço Estimado (R$)</Label>
						<Input
							id="estimatedPrice"
							type="number"
							min="0"
							step="0.01"
							value={formData.estimatedPrice}
							onChange={(e) => handleInputChange("estimatedPrice", e.target.value)}
							placeholder="Ex: 3.50"
						/>
					</div>

					{/* Informações adicionais */}
					<div className="space-y-4 border-t pt-4">
						<h4 className="font-medium text-sm text-gray-700">Informações Adicionais (Opcional)</h4>
						
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="tempBrand">Marca</Label>
								<Input
									id="tempBrand"
									value={formData.tempBrand}
									onChange={(e) => handleInputChange("tempBrand", e.target.value)}
									placeholder="Ex: Dove, Nestle, etc."
								/>
							</div>
							<div>
								<Label htmlFor="tempCategory">Categoria</Label>
								<Input
									id="tempCategory"
									value={formData.tempCategory}
									onChange={(e) => handleInputChange("tempCategory", e.target.value)}
									placeholder="Ex: Higiene, Limpeza, etc."
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="tempBarcode">Código de Barras</Label>
							<div className="flex gap-2">
								<Input
									id="tempBarcode"
									value={formData.tempBarcode}
									onChange={(e) => handleInputChange("tempBarcode", e.target.value)}
									placeholder="Ex: 7891234567890"
								/>
								<Button type="button" variant="outline" size="icon">
									<Barcode className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div>
							<Label htmlFor="tempDescription">Descrição</Label>
							<Textarea
								id="tempDescription"
								value={formData.tempDescription}
								onChange={(e) => handleInputChange("tempDescription", e.target.value)}
								placeholder="Descrição adicional do produto..."
								rows={2}
							/>
						</div>

						<div>
							<Label htmlFor="tempNotes">Observações</Label>
							<Textarea
								id="tempNotes"
								value={formData.tempNotes}
								onChange={(e) => handleInputChange("tempNotes", e.target.value)}
								placeholder="Anotações especiais sobre este item..."
								rows={2}
							/>
						</div>
					</div>

					{/* Preview do item */}
					{formData.productName && (
						<div className="border-t pt-4">
							<Label className="text-sm font-medium text-gray-700">Preview do Item:</Label>
							<div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
								<div className="flex items-center gap-2 mb-2">
									<Badge variant="outline" className="text-orange-600 border-orange-300">
										Temporário
									</Badge>
									<span className="font-medium">{formData.productName}</span>
								</div>
								<div className="text-sm text-gray-600 space-y-1">
									<div>Quantidade: {formData.quantity} {formData.productUnit}</div>
									{formData.estimatedPrice && (
										<div>Preço estimado: R$ {parseFloat(formData.estimatedPrice).toFixed(2)}</div>
									)}
									{formData.tempBrand && <div>Marca: {formData.tempBrand}</div>}
									{formData.tempCategory && <div>Categoria: {formData.tempCategory}</div>}
								</div>
							</div>
						</div>
					)}

					{/* Botões */}
					<div className="flex gap-2 pt-4">
						<Button type="submit" className="flex-1">
							<Plus className="h-4 w-4 mr-2" />
							Adicionar à Lista
						</Button>
						<Button type="button" variant="outline" onClick={onCancel}>
							Cancelar
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}