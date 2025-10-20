"use client"

import { AlertTriangle, DollarSign, Package } from "lucide-react"
import * as React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface StockItem {
	id: string
	quantity: number
	unitCost?: number
	product: {
		name: string
		unit: string
		brand?: { name: string }
	}
}

interface WasteDialogProps {
	stockItem: StockItem
	open: boolean
	onOpenChange: (open: boolean) => void
	onSuccess?: () => void
}

const wasteReasons = [
	"Vencido",
	"Estragado/Deteriorado",
	"Mofado",
	"Contaminado",
	"Embalagem danificada",
	"Erro de armazenamento",
	"Acidente/Queda",
	"Prazo vencido",
	"Mudança de gosto",
	"Outro",
]

export function WasteDialog({ stockItem, open, onOpenChange, onSuccess }: WasteDialogProps) {
	const [formData, setFormData] = useState({
		quantity: 0,
		wasteReason: "",
		customReason: "",
		notes: "",
	})
	const [loading, setLoading] = useState(false)

	React.useEffect(() => {
		if (open) {
			setFormData({
				quantity: stockItem.quantity,
				wasteReason: "",
				customReason: "",
				notes: "",
			})
		}
	}, [open, stockItem])

	const handleSubmit = async () => {
		if (!formData.quantity || formData.quantity <= 0) {
			toast.error("Quantidade deve ser maior que zero")
			return
		}

		if (formData.quantity > stockItem.quantity) {
			toast.error(`Quantidade não pode ser maior que ${stockItem.quantity} ${stockItem.product.unit}`)
			return
		}

		if (!formData.wasteReason) {
			toast.error("Selecione o motivo do desperdício")
			return
		}

		if (formData.wasteReason === "Outro" && !formData.customReason.trim()) {
			toast.error("Descreva o motivo do desperdício")
			return
		}

		setLoading(true)
		try {
			const finalReason = formData.wasteReason === "Outro" ? formData.customReason : formData.wasteReason

			const response = await fetch("/api/stock/waste", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					stockItemId: stockItem.id,
					quantity: formData.quantity,
					wasteReason: finalReason,
					notes: formData.notes,
				}),
			})

			if (response.ok) {
				toast.success("Desperdício registrado com sucesso!")
				onOpenChange(false)
				onSuccess?.()
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao registrar desperdício")
			}
		} catch (error) {
			console.error("Erro ao registrar desperdício:", error)
			toast.error("Erro ao registrar desperdício")
		} finally {
			setLoading(false)
		}
	}

	const calculatedWasteValue = (stockItem.unitCost || 0) * formData.quantity

	return (
		<ResponsiveFormDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Registrar Desperdício"
			description="Informe os detalhes do item a ser descartado."
			onSubmit={handleSubmit}
			onCancel={() => onOpenChange(false)}
			submitText={loading ? "Registrando..." : "Registrar Desperdício"}
			submitVariant="destructive"
			isLoading={loading}
			isSubmitDisabled={!formData.wasteReason || formData.quantity <= 0}
			maxWidth="md"
		>
			<div className="space-y-4">
				{/* Informações do produto */}
				<div className="p-3 bg-gray-50 rounded-lg space-y-2">
					<div className="flex items-center gap-2">
						<Package className="size-4 text-gray-500" />
						<span className="font-medium">{stockItem.product.name}</span>
					</div>
					{stockItem.product.brand && (
						<div className="text-sm text-gray-600">Marca: {stockItem.product.brand.name}</div>
					)}
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-600">Disponível em estoque:</span>
						<Badge variant="secondary">
							{stockItem.quantity} {stockItem.product.unit}
						</Badge>
					</div>
					{stockItem.unitCost && (
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-600">Valor unitário:</span>
							<span className="text-sm font-medium">R$ {stockItem.unitCost.toFixed(2)}</span>
						</div>
					)}
				</div>

				{/* Quantidade desperdiçada */}
				<div className="space-y-2">
					<Label htmlFor="quantity">Quantidade desperdiçada *</Label>
					<Input
						id="quantity"
						type="number"
						step="0.01"
						min="0.01"
						max={stockItem.quantity}
						value={formData.quantity}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								quantity: parseFloat(e.target.value) || 0,
							}))
						}
						placeholder={`Máx: ${stockItem.quantity} ${stockItem.product.unit}`}
						required
					/>
				</div>

				{/* Motivo do desperdício */}
				<div className="space-y-2">
					<Label htmlFor="wasteReason">Motivo do desperdício *</Label>
					<Select
						value={formData.wasteReason}
						onValueChange={(value) => setFormData((prev) => ({ ...prev, wasteReason: value }))}
					>
						<SelectTrigger>
							<SelectValue placeholder="Selecione o motivo" />
						</SelectTrigger>
						<SelectContent>
							{wasteReasons.map((reason) => (
								<SelectItem key={reason} value={reason}>
									{reason}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Motivo personalizado */}
				{formData.wasteReason === "Outro" && (
					<div className="space-y-2">
						<Label htmlFor="customReason">Descreva o motivo *</Label>
						<Input
							id="customReason"
							value={formData.customReason}
							onChange={(e) =>
								setFormData((prev) => ({
									...prev,
									customReason: e.target.value,
								}))
							}
							placeholder="Descreva o motivo do desperdício..."
							required
						/>
					</div>
				)}

				{/* Observações */}
				<div className="space-y-2">
					<Label htmlFor="notes">Observações adicionais</Label>
					<Textarea
						id="notes"
						value={formData.notes}
						onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
						placeholder="Observações sobre o desperdício..."
						rows={3}
					/>
				</div>

				{/* Valor do desperdício */}
				{calculatedWasteValue > 0 && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
						<div className="flex items-center gap-2 text-red-600">
							<DollarSign className="size-4" />
							<span className="font-medium">Valor do desperdício: R$ {calculatedWasteValue.toFixed(2)}</span>
						</div>
						<p className="text-xs text-red-500 mt-1">Este valor será contabilizado nas estatísticas de desperdício</p>
					</div>
				)}

				{/* Alerta */}
				<div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
					<AlertTriangle className="size-4 text-yellow-600 mt-0.5 shrink-0" />
					<div className="text-sm text-yellow-800">
						<p className="font-medium">Atenção!</p>
						<p>Este item será removido do estoque e registrado como desperdício. Esta ação não pode ser desfeita.</p>
					</div>
				</div>
			</div>
		</ResponsiveFormDialog>
	)
}
