"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface WasteRecord {
	id: string
	productName: string
	quantity: number
	unit: string
	wasteReason: string
	wasteDate: string
	expirationDate?: string
	location?: string
	unitCost?: number
	totalValue?: number
	notes?: string
	category?: string
	brand?: string
	batchNumber?: string
}

interface WasteFormProps {
	initialData?: WasteRecord
	onSubmit: (data: Omit<WasteRecord, "id">) => void
	onCancel: () => void
}

const wasteReasonLabels = {
	EXPIRED: "Vencido",
	DAMAGED: "Danificado",
	OVERSTOCK: "Excesso de Estoque",
	QUALITY: "Problema de Qualidade",
	POWER_OUTAGE: "Falta de Energia",
	FORGOTTEN: "Esquecido",
	OTHER: "Outro",
}

export function WasteForm({ initialData, onSubmit, onCancel }: WasteFormProps) {
	const productNameId = useId()
	const categoryId = useId()
	const quantityId = useId()
	const unitId = useId()
	const wasteReasonId = useId()
	const wasteDateId = useId()
	const expirationDateId = useId()
	const locationId = useId()
	const totalValueId = useId()
	const notesId = useId()

	const [formData, setFormData] = useState({
		productName: initialData?.productName || "",
		quantity: initialData?.quantity || 0,
		unit: initialData?.unit || "unidade",
		wasteReason: initialData?.wasteReason || "EXPIRED",
		wasteDate: initialData?.wasteDate
			? new Date(initialData.wasteDate).toISOString().split("T")[0]
			: new Date().toISOString().split("T")[0],
		expirationDate: initialData?.expirationDate ? new Date(initialData.expirationDate).toISOString().split("T")[0] : "",
		location: initialData?.location || "",
		batchNumber: initialData?.batchNumber || "",
		totalValue: initialData?.totalValue || 0,
		category: initialData?.category || "",
		brand: initialData?.brand || "",
		notes: initialData?.notes || "",
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [errors, setErrors] = useState<Record<string, string>>({})

	const validateForm = () => {
		const newErrors: Record<string, string> = {}

		if (!formData.productName.trim()) {
			newErrors.productName = "Nome do produto é obrigatório"
		}
		if (!formData.quantity || formData.quantity <= 0) {
			newErrors.quantity = "Quantidade deve ser maior que zero"
		}
		if (!formData.unit.trim()) {
			newErrors.unit = "Unidade é obrigatória"
		}
		if (!formData.wasteReason.trim()) {
			newErrors.wasteReason = "Motivo do desperdício é obrigatório"
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
			const expDate = formData.expirationDate ? new Date(formData.expirationDate).toISOString() : undefined;
			const { expirationDate: _exp, wasteDate, ...restFormData } = formData;
			await onSubmit({
				...restFormData,
				wasteDate: new Date(wasteDate || new Date()).toISOString(),
				...(expDate ? { expirationDate: expDate } : {}),
			})
		} catch (error) {
			console.error("Erro ao submeter formulário:", error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor={productNameId} className="block text-sm font-medium mb-2">
						Nome do Produto *
					</label>
					<Input
						id={productNameId}
						value={formData.productName}
						onChange={(e) => {
							setFormData((prev) => ({ ...prev, productName: e.target.value }))
							if (errors.productName) {
								setErrors((prev) => ({ ...prev, productName: "" }))
							}
						}}
						required
						disabled={isSubmitting}
						className={errors.productName ? "border-red-500" : ""}
					/>
					{errors.productName && <p className="text-red-500 text-sm mt-1">{errors.productName}</p>}
				</div>
				<div>
					<label htmlFor={categoryId} className="block text-sm font-medium mb-2">
						Categoria
					</label>
					<Input
						id={categoryId}
						value={formData.category}
						onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<div className="grid grid-cols-3 gap-4">
				<div>
					<label htmlFor={quantityId} className="block text-sm font-medium mb-2">
						Quantidade *
					</label>
					<Input
						id={quantityId}
						type="number"
						step="0.01"
						min="0"
						value={formData.quantity || ""}
						onChange={(e) => {
							const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
							setFormData((prev) => ({ ...prev, quantity: value }))
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
					<label htmlFor={unitId} className="block text-sm font-medium mb-2">
						Unidade *
					</label>
					<Select
						value={formData.unit}
						onValueChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
						disabled={isSubmitting}
					>
						<SelectTrigger id={unitId}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="unidade">Unidade</SelectItem>
							<SelectItem value="kg">kg</SelectItem>
							<SelectItem value="g">g</SelectItem>
							<SelectItem value="litro">Litro</SelectItem>
							<SelectItem value="ml">ml</SelectItem>
							<SelectItem value="pacote">Pacote</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div>
					<label htmlFor={totalValueId} className="block text-sm font-medium mb-2">
						Valor Total
					</label>
					<Input
						id={totalValueId}
						type="number"
						step="0.01"
						value={formData.totalValue}
						onChange={(e) => setFormData((prev) => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor={wasteReasonId} className="block text-sm font-medium mb-2">
						Motivo *
					</label>
					<Select
						value={formData.wasteReason}
						onValueChange={(value) => {
							setFormData((prev) => ({ ...prev, wasteReason: value }))
							if (errors.wasteReason) {
								setErrors((prev) => ({ ...prev, wasteReason: "" }))
							}
						}}
						disabled={isSubmitting}
					>
						<SelectTrigger id={wasteReasonId} className={errors.wasteReason ? "border-red-500" : ""}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(wasteReasonLabels).map(([value, label]) => (
								<SelectItem key={value} value={value}>
									{label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.wasteReason && <p className="text-red-500 text-sm mt-1">{errors.wasteReason}</p>}
				</div>
				<div>
					<label htmlFor={locationId} className="block text-sm font-medium mb-2">
						Localização
					</label>
					<Input
						id={locationId}
						value={formData.location}
						onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
						disabled={isSubmitting}
					/>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4">
				<div>
					<label htmlFor={wasteDateId} className="block text-sm font-medium mb-2">
						Data do Desperdício *
					</label>
					<Input
						id={wasteDateId}
						type="date"
						value={formData.wasteDate}
						onChange={(e) => setFormData((prev) => ({ ...prev, wasteDate: e.target.value }))}
						required
						disabled={isSubmitting}
					/>
				</div>
				<div>
					<label htmlFor={expirationDateId} className="block text-sm font-medium mb-2">
						Data de Validade
					</label>
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
				<label htmlFor={notesId} className="block text-sm font-medium mb-2">
					Observações
				</label>
				<Textarea
					id={notesId}
					value={formData.notes}
					onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
					placeholder="Detalhes adicionais sobre o desperdício..."
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
							<div className="animate-spin rounded-full size-4 border-b-2 border-white mr-2" />
							{initialData ? "Atualizando..." : "Registrando..."}
						</>
					) : initialData ? (
						"Atualizar"
					) : (
						"Registrar"
					)}
				</Button>
			</div>
		</form>
	)
}
