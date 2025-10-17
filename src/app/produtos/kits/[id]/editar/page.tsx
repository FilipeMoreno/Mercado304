"use client"

import { AlertCircle, ArrowLeft, Loader2, Package, Save } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ProductSelector, type SelectedProduct } from "@/components/kits/product-selector"
import { BrandSelect } from "@/components/selects/brand-select"
import { BrandSelectDialog } from "@/components/selects/brand-select-dialog"
import { CategorySelect } from "@/components/selects/category-select"
import { CategorySelectDialog } from "@/components/selects/category-select-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useUIPreferences } from "@/hooks"
import { useProductKitQuery, useUpdateProductKitMutation, useUpdateProductMutation } from "@/hooks/use-react-query"

export default function EditProductKitPage() {
	const router = useRouter()
	const params = useParams()
	const kitId = params.id as string

	const updateKitMutation = useUpdateProductKitMutation()
	const updateProductMutation = useUpdateProductMutation()
	const { selectStyle } = useUIPreferences()

	// Load kit data
	const { data: kitData, isLoading, error } = useProductKitQuery(kitId)

	const [kitName, setKitName] = useState("")
	const [kitDescription, setKitDescription] = useState("")
	const [kitBarcode, setKitBarcode] = useState("")
	const [kitBrandId, setKitBrandId] = useState<string>("")
	const [kitCategoryId, setKitCategoryId] = useState<string>("")
	const [isActive, setIsActive] = useState(true)
	const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isInitialized, setIsInitialized] = useState(false)

	// Initialize form with kit data
	useEffect(() => {
		if (kitData?.data && !isInitialized) {
			const kit = kitData.data
			setKitName(kit.kitProduct.name)
			setKitDescription(kit.description || "")
			setKitBarcode(kit.barcode || "")
			setKitBrandId(kit.brandId || "")
			setKitCategoryId(kit.categoryId || "")
			setIsActive(kit.isActive)
			setSelectedProducts(
				kit.items.map((item: { product: { id: string; name: string; unit: string; brand?: { name: string } }; quantity: number }) => ({
					productId: item.product.id,
					productName: item.product.name,
					quantity: item.quantity,
					unit: item.product.unit,
					brand: item.product.brand?.name,
				})),
			)
			setIsInitialized(true)
		}
	}, [kitData, isInitialized])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Validations
		if (!kitName.trim()) {
			toast.error("Nome do kit é obrigatório")
			return
		}

		if (selectedProducts.length === 0) {
			toast.error("Adicione pelo menos um produto ao kit")
			return
		}

		setIsSubmitting(true)

		try {
			// Step 1: Update the kit product name if changed
			if (kitData?.data.kitProduct.name !== kitName) {
				await updateProductMutation.mutateAsync({
					id: kitData.data.kitProductId,
					data: {
						name: kitName,
					},
				})
			}

			// Step 2: Update the kit (description, barcode, brand, category, isActive, and items)
			await updateKitMutation.mutateAsync({
				id: kitData?.data.id || "",
				data: {
					description: kitDescription || undefined,
					barcode: kitBarcode || undefined,
					brandId: kitBrandId || undefined,
					categoryId: kitCategoryId || undefined,
					isActive,
					items: selectedProducts.map((p) => ({
						productId: p.productId,
						quantity: p.quantity,
					})),
				},
			})

			toast.success("Kit atualizado com sucesso!")
			router.push(`/produtos/kits/${kitId}`)
		} catch (error) {
			console.error("Error updating kit:", error)
			// Error is already handled by the mutation hooks
			setIsSubmitting(false)
		}
	}

	const handleCancel = () => {
		router.push(`/produtos/kits/${kitId}`)
	}

	const isFormValid = kitName.trim() && selectedProducts.length > 0

	// Check if form has changes
	const hasChanges = () => {
		if (!kitData?.data) return false

		const kit = kitData.data
		const nameChanged = kit.kitProduct.name !== kitName
		const descriptionChanged = (kit.description || "") !== kitDescription
		const barcodeChanged = (kit.barcode || "") !== kitBarcode
		const brandChanged = (kit.brandId || "") !== kitBrandId
		const categoryChanged = (kit.categoryId || "") !== kitCategoryId
		const statusChanged = kit.isActive !== isActive

		// Check if products changed
		const currentProductIds = kit.items.map((i: { product: { id: string } }) => i.product.id).sort()
		const selectedProductIds = selectedProducts.map((p) => p.productId).sort()
		const productsChanged = JSON.stringify(currentProductIds) !== JSON.stringify(selectedProductIds)

		// Check if quantities changed
		const quantitiesChanged = kit.items.some((item: { product: { id: string }; quantity: number }) => {
			const selectedProduct = selectedProducts.find((p) => p.productId === item.product.id)
			return selectedProduct?.quantity !== item.quantity
		})

		return (
			nameChanged ||
			descriptionChanged ||
			barcodeChanged ||
			brandChanged ||
			categoryChanged ||
			statusChanged ||
			productsChanged ||
			quantitiesChanged
		)
	}

	// Loading state
	if (isLoading) {
		return (
			<div className="container mx-auto py-8 px-4 max-w-4xl">
				<div className="space-y-6">
					<div className="flex items-center gap-3">
						<Skeleton className="h-10 w-10" />
						<Skeleton className="h-10 w-64" />
					</div>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-48 mb-2" />
							<Skeleton className="h-4 w-64" />
						</CardHeader>
						<CardContent className="space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-24 w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		)
	}

	// Error state
	if (error || !kitData?.data) {
		return (
			<div className="container mx-auto py-8 px-4 w-full">
				<Card className="border-destructive">
					<CardContent className="p-6">
						<div className="flex items-center gap-3">
							<AlertCircle className="h-8 w-8 text-destructive" />
							<div>
								<h3 className="font-semibold text-destructive">Erro ao carregar kit</h3>
								<p className="text-sm text-muted-foreground mt-1">
									{error instanceof Error ? error.message : "Kit não encontrado"}
								</p>
							</div>
						</div>
						<Button variant="outline" className="mt-4" onClick={() => router.push("/produtos/kits")}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar para Kits
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 px-4 w-full">
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<Button type="button" variant="ghost" size="icon" onClick={handleCancel}>
							<ArrowLeft className="h-5 w-5" />
						</Button>
						<div>
							<h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
								<Package className="h-8 w-8 text-primary" />
								Editar Kit
							</h1>
							<p className="text-muted-foreground mt-1">Atualize as informações do kit</p>
						</div>
					</div>

					<Button type="submit" disabled={!isFormValid || isSubmitting || !hasChanges()} size="lg">
						{isSubmitting ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Salvando...
							</>
						) : (
							<>
								<Save className="h-4 w-4 mr-2" />
								Salvar Alterações
							</>
						)}
					</Button>
				</div>

				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Informações Básicas</CardTitle>
						<CardDescription>Atualize o nome e descrição do kit</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>
								Nome do Kit <span className="text-destructive">*</span>
							</Label>
							<Input
								placeholder="Ex: Kit Refrigerantes Mix, Kit Café da Manhã..."
								value={kitName}
								onChange={(e) => setKitName(e.target.value)}
								required
							/>
							<p className="text-xs text-muted-foreground">Um nome descritivo para identificar o kit</p>
						</div>

						<div className="space-y-2">
							<Label>Descrição (Opcional)</Label>
							<Textarea
								placeholder="Descreva o kit e seus benefícios..."
								value={kitDescription}
								onChange={(e) => setKitDescription(e.target.value)}
								rows={3}
							/>
							<p className="text-xs text-muted-foreground">Informações adicionais sobre o kit</p>
						</div>

						<Separator />

						<div className="space-y-2">
							<Label>Código de Barras (Opcional)</Label>
							<Input
								placeholder="Ex: 7891234567890"
								value={kitBarcode}
								onChange={(e) => setKitBarcode(e.target.value)}
							/>
							<p className="text-xs text-muted-foreground">Código de barras específico do kit, se houver</p>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Marca (Opcional)</Label>
								{selectStyle === "dialog" ? (
									<BrandSelectDialog
										value={kitBrandId || undefined}
										onValueChange={(value) => setKitBrandId(value || "")}
										placeholder="Selecione uma marca"
									/>
								) : (
									<BrandSelect
										value={kitBrandId || undefined}
										onValueChange={(value) => setKitBrandId(value || "")}
										placeholder="Selecione uma marca"
									/>
								)}
								<p className="text-xs text-muted-foreground">Marca do kit/combo</p>
							</div>

							<div className="space-y-2">
								<Label>Categoria (Opcional)</Label>
								{selectStyle === "dialog" ? (
									<CategorySelectDialog
										value={kitCategoryId || undefined}
										onValueChange={(value) => setKitCategoryId(value || "")}
										placeholder="Selecione uma categoria"
									/>
								) : (
									<CategorySelect
										value={kitCategoryId || undefined}
										onValueChange={(value) => setKitCategoryId(value || "")}
										placeholder="Selecione uma categoria"
									/>
								)}
								<p className="text-xs text-muted-foreground">Categoria do kit/combo</p>
							</div>
						</div>

						<Separator />

						<div className="flex items-center justify-between p-4 border rounded-lg">
							<div className="space-y-0.5">
								<Label>Status do Kit</Label>
								<p className="text-sm text-muted-foreground">Kits inativos não aparecem em vendas</p>
							</div>
							<Switch checked={isActive} onCheckedChange={setIsActive} />
						</div>
					</CardContent>
				</Card>

				{/* Products */}
				<Card>
					<CardHeader>
						<CardTitle>Produtos do Kit</CardTitle>
						<CardDescription>Atualize os produtos que fazem parte deste kit</CardDescription>
					</CardHeader>
					<CardContent>
						<ProductSelector
							selectedProducts={selectedProducts}
							onChange={setSelectedProducts}
							excludeProductIds={[kitData.data.kitProductId]}
						/>

						{selectedProducts.length > 0 && (
							<>
								<Separator className="my-4" />
								<div className="flex items-center justify-between text-sm">
									<span className="text-muted-foreground">Total de produtos no kit:</span>
									<Badge variant="secondary">
										{selectedProducts.length} produto{selectedProducts.length !== 1 ? "s" : ""}
									</Badge>
								</div>
								<div className="flex items-center justify-between text-sm mt-2">
									<span className="text-muted-foreground">Quantidade total de itens:</span>
									<Badge variant="secondary">{selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} unidades</Badge>
								</div>
							</>
						)}
					</CardContent>
				</Card>

				{/* Preview */}
				{kitName && selectedProducts.length > 0 && (
					<Card className="border-primary/50">
						<CardHeader>
							<CardTitle className="text-lg">Preview do Kit</CardTitle>
							<CardDescription>Veja como o kit ficará após as alterações</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex items-start justify-between">
									<div>
										<h3 className="font-semibold">{kitName}</h3>
										{kitDescription && <p className="text-sm text-muted-foreground mt-1">{kitDescription}</p>}
									</div>
									<Badge variant={isActive ? "default" : "secondary"}>{isActive ? "Ativo" : "Inativo"}</Badge>
								</div>

								<Separator />

								<div className="space-y-2">
									<p className="text-sm font-semibold text-muted-foreground">Produtos inclusos:</p>
									{selectedProducts.map((product) => (
										<div
											key={product.productId}
											className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/30"
										>
											<div className="flex items-center gap-2">
												<span className="font-medium text-primary">{product.quantity}x</span>
												<span>{product.productName}</span>
											</div>
											{product.brand && (
												<Badge variant="outline" className="text-xs">
													{product.brand}
												</Badge>
											)}
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Actions */}
				<div className="flex items-center justify-between">
					<Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
						Cancelar
					</Button>

					<div className="flex items-center gap-3">
						{hasChanges() && (
							<Badge variant="outline" className="text-sm">
								{isSubmitting ? "Salvando..." : "Alterações não salvas"}
							</Badge>
						)}
						<Button type="submit" disabled={!isFormValid || isSubmitting || !hasChanges()}>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Salvando...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Salvar Alterações
								</>
							)}
						</Button>
					</div>
				</div>
			</form>
		</div>
	)
}
