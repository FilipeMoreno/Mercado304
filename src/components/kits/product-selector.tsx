"use client"

import { Plus, X } from "lucide-react"
import { useState } from "react"
import { ProductSelectDialog } from "@/components/selects/product-select-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export interface SelectedProduct {
	productId: string
	productName: string
	quantity: number
	unit?: string
	brand?: string
	packageSize?: string
}

interface ProductSelectorProps {
	selectedProducts: SelectedProduct[]
	onChange: (products: SelectedProduct[]) => void
	excludeProductIds?: string[]
}

export function ProductSelector({ selectedProducts, onChange, excludeProductIds: _excludeProductIds = [] }: ProductSelectorProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [selectedProductId, setSelectedProductId] = useState<string>("")

	const handleAddProduct = async (productId: string) => {
		// Verificar se já não foi adicionado
		if (selectedProducts.some((p) => p.productId === productId)) {
			return
		}

		// Buscar dados completos do produto
		try {
			const response = await fetch(`/api/products/${productId}`)
			if (!response.ok) return

			const product = await response.json()

			onChange([
				...selectedProducts,
				{
					productId: product.id,
					productName: product.name,
					quantity: 1,
					unit: product.unit,
					brand: product.brand?.name,
				packageSize: product.packageSize,
				},
			])

			// Fechar o dialog e limpar seleção
			setIsDialogOpen(false)
			setSelectedProductId("")
		} catch (error) {
			console.error("Erro ao buscar produto:", error)
		}
	}

	const handleDialogValueChange = (productId: string) => {
		if (productId) {
			setSelectedProductId(productId)
			handleAddProduct(productId)
		}
	}

	const handleRemoveProduct = (productId: string) => {
		onChange(selectedProducts.filter((p) => p.productId !== productId))
	}

	const handleQuantityChange = (productId: string, quantity: number) => {
		onChange(selectedProducts.map((p) => (p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p)))
	}

	return (
		<div className="space-y-4">
			{/* Selected Products List */}
			{selectedProducts.length > 0 && (
				<div className="space-y-2">
					{selectedProducts.map((product) => (
						<Card key={product.productId}>
							<CardContent className="p-4">
								<div className="flex items-center gap-3">
									<div className="flex-1">
										<p className="font-medium">{product.productName}</p>
								{product.packageSize && (
									<p className="text-sm text-muted-foreground mt-0.5">
										{product.packageSize}
									</p>
								)}
								{product.brand && (
											<Badge variant="outline" className="text-xs mt-1">
												{product.brand}
											</Badge>
										)}
									</div>

									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleQuantityChange(product.productId, product.quantity - 1)}
											disabled={product.quantity <= 1}
										>
											-
										</Button>

										<Input
											type="number"
											value={product.quantity}
											onChange={(e) => handleQuantityChange(product.productId, parseInt(e.target.value, 10) || 1)}
											className="w-16 text-center"
											min={1}
										/>

										<Button
											variant="outline"
											size="sm"
											onClick={() => handleQuantityChange(product.productId, product.quantity + 1)}
										>
											+
										</Button>

										<Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(product.productId)}>
											<X className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

		{/* Add Product Button */}
		
			<Button 
				type="button" 
				variant="outline" 
				className="w-full" 
				onClick={() => setIsDialogOpen(true)}
			>
				<Plus className="h-4 w-4 mr-2" />
				Adicionar Produto
			</Button>

			<ProductSelectDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				value={selectedProductId}
				onValueChange={handleDialogValueChange}
				placeholder="Selecione um produto"
				showScanButton={true}
			/>
		
			

			{selectedProducts.length === 0 && (
				<p className="text-sm text-muted-foreground text-center py-4">
					Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
				</p>
			)}
		</div>
	)
}
