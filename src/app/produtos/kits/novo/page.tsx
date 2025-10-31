"use client"

import { ArrowLeft, Package, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, Activity } from "react"
import { toast } from "sonner"
import { ProductSelector, type SelectedProduct } from "@/components/kits/product-selector"
import { BarcodeManager } from "@/components/products/barcode-manager"
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
import { Textarea } from "@/components/ui/textarea"
import { useCreateProductKitMutation, useCreateProductMutation, useUIPreferences } from "@/hooks"

export default function NewProductKitPage() {
	const router = useRouter()
	const createKitMutation = useCreateProductKitMutation()
	const createProductMutation = useCreateProductMutation()
	const { selectStyle } = useUIPreferences()

	const [kitName, setKitName] = useState("")
	const [kitDescription, setKitDescription] = useState("")
	const [kitBarcodes, setKitBarcodes] = useState<string[]>([])
	const [kitBrandId, setKitBrandId] = useState<string>("")
	const [kitCategoryId, setKitCategoryId] = useState<string>("")
	const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)

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
			// Step 1: Create the kit product
			const kitProductResponse = await createProductMutation.mutateAsync({
				name: kitName,
				unit: "kit",
				hasStock: false, // Kits don't have direct stock
				brandId: kitBrandId || undefined,
				categoryId: kitCategoryId || undefined,
				barcode: kitBarcodes.length > 0 ? kitBarcodes[0] : undefined,
				barcodes: kitBarcodes.length > 0 ? kitBarcodes : undefined,
				packageSize: undefined, // Kits não têm peso/volume específico
			})

			console.log("Kit Product Response:", kitProductResponse)

			// A API de produtos retorna o produto diretamente
			const kitProductId = kitProductResponse?.id || kitProductResponse?.data?.id

			if (!kitProductId) {
				toast.error("Erro ao criar produto do kit")
				console.error("kitProductId not found in response:", kitProductResponse)
				setIsSubmitting(false)
				return
			}

			// Step 2: Create the kit with its items
			const kitResponse = await createKitMutation.mutateAsync({
				kitProductId,
				description: kitDescription || undefined,
				barcode: kitBarcodes.length > 0 ? kitBarcodes[0] : undefined,
				brandId: kitBrandId || undefined,
				categoryId: kitCategoryId || undefined,
				items: selectedProducts.map((p) => ({
					productId: p.productId,
					quantity: p.quantity,
				})),
			})

			console.log("Kit created:", kitResponse)

			// Sucesso - aguardar invalidação do cache antes de redirecionar
			await new Promise((resolve) => setTimeout(resolve, 1000))
			router.push("/produtos/kits")
		} catch (error) {
			console.error("Error creating kit:", error)
			setIsSubmitting(false)
			// Error is already handled by the mutation hooks
		}
	}

	const handleCancel = () => {
		router.push("/produtos/kits")
	}

	const isFormValid = kitName.trim() && selectedProducts.length > 0

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
								Criar Novo Kit/Combo
							</h1>
							<p className="text-muted-foreground mt-1">Cadastre um combo promocional que o mercado oferece</p>
						</div>
					</div>

					<Button type="submit" disabled={!isFormValid || isSubmitting} size="lg">
						<Save className="h-4 w-4 mr-2" />
						{isSubmitting ? "Salvando..." : "Salvar Kit"}
					</Button>
				</div>

				{/* Basic Information */}
				<Card>
					<CardHeader>
						<CardTitle>Informações Básicas</CardTitle>
						<CardDescription>Defina o nome do combo/kit promocional que você comprou</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label>
								Nome do Kit/Combo <span className="text-destructive">*</span>
							</Label>
							<Input
								placeholder="Ex: Kit 2 Refris Carrefour, Combo Café da Manhã Extra..."
								value={kitName}
								onChange={(e) => setKitName(e.target.value)}
								required
							/>
							<p className="text-xs text-muted-foreground">Dê um nome que identifique o combo promocional do mercado</p>
						</div>

						<div className="space-y-2">
							<Label>Descrição (Opcional)</Label>
							<Textarea
								placeholder="Ex: Combo promocional do Carrefour, economiza R$ 2,00..."
								value={kitDescription}
								onChange={(e) => setKitDescription(e.target.value)}
								rows={3}
							/>
							<p className="text-xs text-muted-foreground">Observações sobre o combo ou qual mercado oferece</p>
						</div>

						<Separator />

						<div className="space-y-2">
							<BarcodeManager
								initialBarcodes={kitBarcodes.map((barcode) => ({
									id: Math.random().toString(),
									barcode,
									isPrimary: false,
								}))}
								onBarcodesChange={(codes) => {
									setKitBarcodes(codes)
								}}
							/>
							<p className="text-xs text-muted-foreground">Código(s) de barras específico(s) do kit, se houver</p>
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
					</CardContent>
				</Card>

				{/* Products */}
				<Card>
					<CardHeader>
						<CardTitle>Produtos Inclusos no Combo</CardTitle>
						<CardDescription>Selecione os produtos que vêm neste combo promocional</CardDescription>
					</CardHeader>
					<CardContent>
						<ProductSelector selectedProducts={selectedProducts} onChange={setSelectedProducts} />

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
			<Activity mode={kitName && selectedProducts.length > 0 ? 'visible' : 'hidden'}>
				<Card className="border-primary/50">
					<CardHeader>
						<CardTitle className="text-lg">Preview do Kit</CardTitle>
						<CardDescription>Veja como o kit ficará antes de salvar</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							<div>
								<h3 className="font-semibold">{kitName}</h3>
								<Activity mode={kitDescription ? 'visible' : 'hidden'}>
									<p className="text-sm text-muted-foreground mt-1">{kitDescription}</p>
								</Activity>
								</div>

								<Separator />

								<div className="space-y-2">
									<p className="text-sm font-semibold text-muted-foreground">Produtos inclusos:</p>
									{selectedProducts.map((product) => (
										<div
											key={product.productId}
											className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/30"
										>
											<div className="flex items-center gap-2 flex-1 min-w-0">
												<span className="font-medium text-primary">{product.quantity}x</span>
												<div className="flex flex-col min-w-0">
													<span className="truncate">{product.productName}</span>
													{product.packageSize && (
														<span className="text-xs text-muted-foreground">
															{product.packageSize}
														</span>
													)}
												</div>
											</div>
											{product.brand && (
												<Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
													{product.brand}
												</Badge>
											)}
										</div>
									))}
								</div>
							</div>
						</CardContent>
					</Card>
				</Activity>

				{/* Actions */}
				<div className="flex items-center justify-end gap-3">
					<Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
						Cancelar
					</Button>
					<Button type="submit" disabled={!isFormValid || isSubmitting}>
						<Save className="h-4 w-4 mr-2" />
						{isSubmitting ? "Salvando..." : "Salvar Kit"}
					</Button>
				</div>
			</form>
		</div>
	)
}
