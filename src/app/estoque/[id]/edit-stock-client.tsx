"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Calendar, DollarSign, FileText, MapPin, Package, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { ProductSelect } from "@/components/selects/product-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatLocalDate, toDateInputValue } from "@/lib/date-utils"

interface StockItem {
	id: string
	productId: string
	quantity: number
	expirationDate?: string
	batchNumber?: string
	location?: string
	unitCost?: number
	notes?: string
	addedDate: string
	product: {
		id: string
		name: string
		unit: string
		brand?: { name: string }
		category?: { name: string }
	}
}

interface EditStockClientProps {
	stockItem: StockItem
	products: any[]
}

export function EditStockClient({ stockItem, products }: EditStockClientProps) {
	const router = useRouter()
	const [saving, setSaving] = useState(false)

	const [formData, setFormData] = useState({
		productId: stockItem.productId,
		quantity: stockItem.quantity,
		expirationDate: stockItem.expirationDate ? format(new Date(stockItem.expirationDate), "yyyy-MM-dd") : "",
		batchNumber: stockItem.batchNumber || "",
		location: stockItem.location || "Despensa",
		unitCost: stockItem.unitCost || 0,
		notes: stockItem.notes || "",
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)

		try {
			const response = await fetch(`/api/stock/${stockItem.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			})

			if (response.ok) {
				toast.success("Item atualizado com sucesso!")
				router.push("/estoque")
				router.refresh()
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao atualizar item")
			}
		} catch (error) {
			console.error("Erro ao atualizar item:", error)
			toast.error("Erro ao atualizar item")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Voltar
				</Button>
				<div>
					<h1 className="text-3xl font-bold">Editar Item do Estoque</h1>
					<p className="text-gray-600 mt-2">Atualize as informações do item no estoque</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								Informações do Item
							</CardTitle>
							<CardDescription>Edite os detalhes do item no estoque</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="space-y-2">
									<Label>Produto *</Label>
									<ProductSelect
										value={formData.productId}
										products={products}
										onValueChange={(value) => setFormData((prev) => ({ ...prev, productId: value }))}
										disabled={saving}
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Quantidade *</Label>
										<Input
											type="number"
											step="0.01"
											min="0.01"
											value={formData.quantity}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													quantity: parseFloat(e.target.value) || 0,
												}))
											}
											disabled={saving}
											required
										/>
									</div>
									<div className="space-y-2">
										<Label>Preço Unitário</Label>
										<Input
											type="number"
											step="0.01"
											min="0"
											value={formData.unitCost}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													unitCost: parseFloat(e.target.value) || 0,
												}))
											}
											disabled={saving}
											placeholder="0.00"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Data de Validade</Label>
									<Input
										type="date"
										value={toDateInputValue(formData.expirationDate)}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												expirationDate: e.target.value,
											}))
										}
										disabled={saving}
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label>Localização</Label>
										<Select
											value={formData.location}
											onValueChange={(value) => setFormData((prev) => ({ ...prev, location: value }))}
											disabled={saving}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="Despensa">Despensa</SelectItem>
												<SelectItem value="Geladeira">Geladeira</SelectItem>
												<SelectItem value="Freezer">Freezer</SelectItem>
												<SelectItem value="Área de Serviço">Área de Serviço</SelectItem>
												<SelectItem value="Outro">Outro</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label>Lote/Batch</Label>
										<Input
											value={formData.batchNumber}
											onChange={(e) =>
												setFormData((prev) => ({
													...prev,
													batchNumber: e.target.value,
												}))
											}
											disabled={saving}
											placeholder="Ex: L2024001"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label>Observações</Label>
									<Input
										value={formData.notes}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												notes: e.target.value,
											}))
										}
										disabled={saving}
										placeholder="Observações sobre o produto..."
									/>
								</div>

								<div className="flex gap-2 pt-4">
									<Button type="submit" disabled={saving} className="flex-1">
										<Save className="h-4 w-4 mr-2" />
										{saving ? "Salvando..." : "Salvar Alterações"}
									</Button>
									<Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
										Cancelar
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Produto Atual</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div>
								<p className="font-medium">{stockItem.product.name}</p>
								{stockItem.product.brand && <p className="text-sm text-gray-600">{stockItem.product.brand.name}</p>}
							</div>

							<div className="space-y-2 text-sm">
								<div className="flex items-center gap-2">
									<Package className="h-3 w-3 text-gray-400" />
									<span>
										{stockItem.quantity} {stockItem.product.unit}
									</span>
								</div>

								{stockItem.location && (
									<div className="flex items-center gap-2">
										<MapPin className="h-3 w-3 text-gray-400" />
										<span>{stockItem.location}</span>
									</div>
								)}

								{stockItem.expirationDate && (
									<div className="flex items-center gap-2">
										<Calendar className="h-3 w-3 text-gray-400" />
										<span>
											{formatLocalDate(stockItem.expirationDate, "dd/MM/yyyy", {
												locale: ptBR,
											})}
										</span>
									</div>
								)}

								{stockItem.unitCost && stockItem.unitCost > 0 && (
									<div className="flex items-center gap-2">
										<DollarSign className="h-3 w-3 text-gray-400" />
										<span>R$ {stockItem.unitCost.toFixed(2)}</span>
									</div>
								)}

								{stockItem.notes && (
									<div className="flex items-center gap-2">
										<FileText className="h-3 w-3 text-gray-400" />
										<span>{stockItem.notes}</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Informações</CardTitle>
						</CardHeader>
						<CardContent className="text-sm">
							<p className="text-gray-600">
								Adicionado em: {format(new Date(stockItem.addedDate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
