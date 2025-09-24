"use client"

import { useId, useState } from "react"
import { ProductSelect } from "@/components/selects/product-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/types"

interface StockItem {
	id: string
	productId: string
	product: {
		id: string
		name: string
		unit: string
		brand?: { name: string }
		category?: { name: string }
	}
	quantity: number
	location: string
	expirationDate?: string
	unitCost?: number
	totalValue?: number
	notes?: string
}

interface StockFormProps {
	initialData?: StockItem
	products: Product[]
	onSubmit: (data: Omit<StockItem, "id">) => Promise<void>
	onCancel: () => void
}

export function StockForm({ initialData, products, onSubmit, onCancel }: StockFormProps) {
	const productId = useId()
	const quantityId = useId()
	const locationId = useId()
	const expirationDateId = useId()
	const unitCostId = useId()
	const notesId = useId()

	const [formData, setFormData] = useState({
		productId: initialData?.product.id || "",
		quantity: initialData?.quantity || "",
		location: initialData?.location || "Despensa",
		expirationDate: initialData?.expirationDate ? new Date(initialData.expirationDate).toISOString().split("T")[0] : "",
		unitCost: initialData?.unitCost || "",
		notes: initialData?.notes || "",
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})

	const validateForm = () => {
		const newErrors: Record<string, string> = {}

		if (!formData.productId) {
			newErrors.productId = "Produto é obrigatório"
		}
		if (!formData.quantity || parseFloat(formData.quantity.toString()) <= 0) {
			newErrors.quantity = "Quantidade deve ser maior que zero"
		}
		if (!formData.location.trim()) {
			newErrors.location = "Localização é obrigatória"
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!validateForm()) {
			return
		}

		setIsSubmitting(true)
		try {
			const selectedProduct = products.find((p) => p.id === formData.productId)
			if (!selectedProduct) {
				throw new Error("Produto não encontrado")
			}

			await onSubmit({
				productId: selectedProduct.id,
				product: selectedProduct,
				quantity: parseFloat(formData.quantity.toString()),
				location: formData.location,
				expirationDate: formData.expirationDate ? new Date(formData.expirationDate).toISOString() : undefined,
				unitCost: parseFloat(formData.unitCost.toString()) || 0,
				totalValue: parseFloat(formData.quantity.toString()) * (parseFloat(formData.unitCost.toString()) || 0),
				notes: formData.notes,
			})
		} catch (error) {
			console.error("Erro ao submeter formulário:", error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<Label htmlFor={productId}>Produto *</Label>
				<ProductSelect
					value={formData.productId}
					products={products}
					onValueChange={(value) => {
						setFormData((prev) => ({ ...prev, productId: value }))
						if (errors.productId) {
							setErrors((prev) => ({ ...prev, productId: "" }))
						}
					}}
					disabled={isSubmitting}
				/>
				{errors.productId && <p className="text-red-500 text-sm mt-1">{errors.productId}</p>}
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label htmlFor={quantityId}>Quantidade *</Label>
					<Input
						id={quantityId}
						type="number"
						step="0.01"
						min="0"
						value={formData.quantity}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, quantity: e.target.value }))
							if (errors.quantity) {
								setErrors((prev) => ({ ...prev, quantity: "" }))
							}
						}}
						onFocus={(e) => e.target.select()}
						required
						disabled={isSubmitting}
						className={errors.quantity ? "border-red-500" : ""}
					/>
					{errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
				</div>
				<div>
					<Label htmlFor={unitCostId}>Custo Unitário</Label>
					<Input
						id={unitCostId}
						type="number"
						step="0.01"
						min="0"
						value={formData.unitCost}
						onChange={(e) => setFormData((prev) => ({ ...prev, unitCost: e.target.value }))}
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<Label htmlFor={locationId}>Localização *</Label>
					<Select
						value={formData.location}
						onValueChange={(value) => {
							setFormData((prev) => ({ ...prev, location: value }))
							if (errors.location) {
								setErrors((prev) => ({ ...prev, location: "" }))
							}
						}}
						disabled={isSubmitting}
					>
						<SelectTrigger id={locationId} className={errors.location ? "border-red-500" : ""}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="Despensa">Despensa</SelectItem>
							<SelectItem value="Geladeira">Geladeira</SelectItem>
							<SelectItem value="Freezer">Freezer</SelectItem>
							<SelectItem value="Armário">Armário</SelectItem>
							<SelectItem value="Garagem">Garagem</SelectItem>
						</SelectContent>
					</Select>
					{errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
				</div>
				<div>
					<Label htmlFor={expirationDateId}>Data de Validade</Label>
					<Input
						id={expirationDateId}
						type="date"
						value={formData.expirationDate}
						onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<div>
				<Label htmlFor={notesId}>Observações</Label>
				<Textarea
					id={notesId}
					value={formData.notes}
					onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
					placeholder="Observações adicionais..."
					rows={3}
					disabled={isSubmitting}
				/>
			</div>

			<div className="flex justify-end gap-3 pt-4">
				<Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
					Cancelar
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? (
						<>
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
							{initialData ? "Atualizando..." : "Adicionando..."}
						</>
					) : initialData ? (
						"Atualizar"
					) : (
						"Adicionar"
					)}
				</Button>
			</div>
		</form>
	)
}
