"use client"

import { ArrowRight, Edit, Package, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface TemporaryItemCardProps {
	item: {
		id: string
		productName?: string
		quantity: number
		productUnit?: string
		estimatedPrice?: number
		isChecked: boolean
		isTemporary?: boolean
		tempDescription?: string
		tempBarcode?: string
		tempBrand?: string
		tempCategory?: string
		tempNotes?: string
	}
	onUpdateItem: (itemId: string, updates: any) => void
	onDeleteItem: (itemId: string) => void
	onConvertToProduct?: (itemId: string, productData: any) => void
}

export function TemporaryItemCard({ item, onUpdateItem, onDeleteItem, onConvertToProduct }: TemporaryItemCardProps) {
	const [isEditing, setIsEditing] = useState(false)
	const [showConvertDialog, setShowConvertDialog] = useState(false)
	const [editData, setEditData] = useState({
		productName: item.productName || "",
		quantity: item.quantity,
		productUnit: item.productUnit || "un",
		estimatedPrice: item.estimatedPrice?.toString() || "",
		tempDescription: item.tempDescription || "",
		tempBarcode: item.tempBarcode || "",
		tempBrand: item.tempBrand || "",
		tempCategory: item.tempCategory || "",
		tempNotes: item.tempNotes || "",
	})

	const [convertData, setConvertData] = useState({
		name: item.productName || "",
		barcode: item.tempBarcode || "",
		brandName: item.tempBrand || "",
		categoryName: item.tempCategory || "",
		unit: item.productUnit || "un",
		hasStock: false,
		hasExpiration: false,
		defaultShelfLifeDays: 30,
	})

	const handleSaveEdit = () => {
		onUpdateItem(item.id, {
			...editData,
			estimatedPrice: editData.estimatedPrice ? parseFloat(editData.estimatedPrice) : undefined,
		})
		setIsEditing(false)
	}

	const handleConvertToProduct = () => {
		if (onConvertToProduct) {
			onConvertToProduct(item.id, convertData)
			setShowConvertDialog(false)
		}
	}

	const totalPrice = item.estimatedPrice ? item.quantity * item.estimatedPrice : 0

	if (isEditing) {
		return (
			<Card className="border-orange-200 bg-orange-50">
				<CardContent className="p-4">
					<div className="space-y-3">
						<div>
							<Label htmlFor="edit-name" className="text-sm">
								Nome
							</Label>
							<Input
								id="edit-name"
								value={editData.productName}
								onChange={(e) => setEditData((prev) => ({ ...prev, productName: e.target.value }))}
							/>
						</div>

						<div className="grid grid-cols-2 gap-2">
							<div>
								<Label htmlFor="edit-qty" className="text-sm">
									Quantidade
								</Label>
								<Input
									id="edit-qty"
									type="number"
									min="0.1"
									step="0.1"
									value={editData.quantity}
									onChange={(e) => setEditData((prev) => ({ ...prev, quantity: parseFloat(e.target.value) }))}
								/>
							</div>
							<div>
								<Label htmlFor="edit-unit" className="text-sm">
									Unidade
								</Label>
								<Input
									id="edit-unit"
									value={editData.productUnit}
									onChange={(e) => setEditData((prev) => ({ ...prev, productUnit: e.target.value }))}
								/>
							</div>
						</div>

						<div>
							<Label htmlFor="edit-price" className="text-sm">
								Preço (R$)
							</Label>
							<Input
								id="edit-price"
								type="number"
								min="0"
								step="0.01"
								value={editData.estimatedPrice}
								onChange={(e) => setEditData((prev) => ({ ...prev, estimatedPrice: e.target.value }))}
							/>
						</div>

						<div className="flex gap-2">
							<Button onClick={handleSaveEdit} size="sm" className="flex-1">
								Salvar
							</Button>
							<Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
								Cancelar
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="border-orange-200 bg-orange-50">
			<CardContent className="p-4">
				<div className="flex items-start gap-3">
					<Checkbox
						checked={item.isChecked}
						onCheckedChange={(checked) => onUpdateItem(item.id, { isChecked: checked })}
						className="mt-1"
					/>

					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1">
							<Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
								Temporário
							</Badge>
							<h4 className={`font-medium ${item.isChecked ? "line-through text-gray-500" : ""}`}>
								{item.productName || "Item sem nome"}
							</h4>
						</div>

						<div className="text-sm text-gray-600 space-y-1">
							<div>
								{item.quantity} {item.productUnit}
								{totalPrice > 0 && <span className="ml-2 text-green-600 font-medium">R$ {totalPrice.toFixed(2)}</span>}
							</div>

							{item.tempBrand && <div className="text-xs text-gray-500">Marca: {item.tempBrand}</div>}

							{item.tempCategory && <div className="text-xs text-gray-500">Categoria: {item.tempCategory}</div>}

							{item.tempDescription && <div className="text-xs text-gray-500 italic">{item.tempDescription}</div>}
						</div>
					</div>

					<div className="flex gap-1">
						{onConvertToProduct && (
							<Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
								<DialogTrigger asChild>
									<Button variant="outline" size="sm" className="size-8 p-0">
										<Package className="h-3 w-3" />
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Converter em Produto</DialogTitle>
										<DialogDescription>
											Cadastre este item temporário como um produto permanente no sistema.
										</DialogDescription>
									</DialogHeader>

									<div className="space-y-4">
										<div>
											<Label htmlFor="convert-name">Nome do Produto</Label>
											<Input
												id="convert-name"
												value={convertData.name}
												onChange={(e) => setConvertData((prev) => ({ ...prev, name: e.target.value }))}
											/>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="convert-brand">Marca</Label>
												<Input
													id="convert-brand"
													value={convertData.brandName}
													onChange={(e) => setConvertData((prev) => ({ ...prev, brandName: e.target.value }))}
												/>
											</div>
											<div>
												<Label htmlFor="convert-category">Categoria</Label>
												<Input
													id="convert-category"
													value={convertData.categoryName}
													onChange={(e) => setConvertData((prev) => ({ ...prev, categoryName: e.target.value }))}
												/>
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="convert-unit">Unidade</Label>
												<Input
													id="convert-unit"
													value={convertData.unit}
													onChange={(e) => setConvertData((prev) => ({ ...prev, unit: e.target.value }))}
												/>
											</div>
											<div>
												<Label htmlFor="convert-barcode">Código de Barras</Label>
												<Input
													id="convert-barcode"
													value={convertData.barcode}
													onChange={(e) => setConvertData((prev) => ({ ...prev, barcode: e.target.value }))}
												/>
											</div>
										</div>

										<div className="flex gap-2">
											<Button onClick={handleConvertToProduct} className="flex-1">
												<ArrowRight className="size-4 mr-2" />
												Converter
											</Button>
											<Button variant="outline" onClick={() => setShowConvertDialog(false)}>
												Cancelar
											</Button>
										</div>
									</div>
								</DialogContent>
							</Dialog>
						)}

						<Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="size-8 p-0">
							<Edit className="h-3 w-3" />
						</Button>

						<Button
							variant="outline"
							size="sm"
							onClick={() => onDeleteItem(item.id)}
							className="size-8 p-0 text-red-600 hover:text-red-700"
						>
							<Trash2 className="h-3 w-3" />
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
