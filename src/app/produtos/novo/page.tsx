"use client"

import { ArrowLeft, Loader2, ScanLine } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { NutritionalInfoForm } from "@/components/nutritional-info-form"
import { NutritionalScanner } from "@/components/nutritional-scanner"
import { BarcodeAutofillDialog } from "@/components/products/barcode-autofill-dialog"
import { BarcodeManager } from "@/components/products/barcode-manager"
import { ProductNameInput } from "@/components/products/product-name-input"
import { BrandSelect } from "@/components/selects/brand-select"
import { BrandSelectDialog } from "@/components/selects/brand-select-dialog"
import { CategorySelect } from "@/components/selects/category-select"
import { CategorySelectDialog } from "@/components/selects/category-select-dialog"
import { UnitSelectDialog } from "@/components/selects/unit-select-dialog"
import { StepsWizard } from "@/components/steps-wizard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	useAllCategoriesQuery,
	useCreateBrandMutation,
	useCreateProductMutation,
	useUIPreferences,
} from "@/hooks"
import { parseGeminiResponse } from "@/lib/gemini-parser"
import { TempStorage } from "@/lib/temp-storage"
import { AppToasts } from "@/lib/toasts"
import type { Category, NutritionalInfo, Product } from "@/types"

const units = ["unidade", "kg", "g", "litro", "ml", "pacote", "caixa", "garrafa", "lata", "saco"]

const steps = [
	{
		id: "main",
		label: "Básico",
		description: "Nome, marca e categoria",
	},
	{
		id: "nutritional",
		label: "Nutrição",
		description: "Informações nutricionais",
	},
	{
		id: "inventory",
		label: "Controle",
		description: "Estoque e validade",
	},
]

export default function NovoProdutoPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { selectStyle } = useUIPreferences()

	// IDs para os inputs (devem estar no topo do componente)
	const packageSizeId = useId()
	const unitId = useId()
	const hasStockId = useId()
	const hasExpirationId = useId()
	const minStockId = useId()
	const maxStockId = useId()
	const shelfLifeId = useId()

	const [currentStep, setCurrentStep] = useState(0)
	const [loading, setLoading] = useState(false)
	const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
	const { data: categories = [] } = useAllCategoriesQuery()
	// const { data: brands = [] } = useAllBrandsQuery() // Desabilitado por enquanto
	const createProductMutation = useCreateProductMutation()
	const createBrandMutation = useCreateBrandMutation()

	const [showNutritionalScanner, setShowNutritionalScanner] = useState(false)
	const [isScanning, setIsScanning] = useState(false)

	// Estados para barcode autofill
	const [showAutofillDialog, setShowAutofillDialog] = useState(false)
	const [barcodeForLookup, setBarcodeForLookup] = useState("")
	const [isLookingUpBarcode, setIsLookingUpBarcode] = useState(false)

	const [formData, setFormData] = useState({
		name: "",
		barcode: "",
		categoryId: "",
		brandId: "",
		unit: "unidade",
		packageSize: "",
		hasStock: false,
		minStock: "",
		maxStock: "",
		hasExpiration: false,
		defaultShelfLifeDays: "",
	})

	const [nutritionalData, setNutritionalData] = useState<Partial<NutritionalInfo>>({})
	const [barcodes, setBarcodes] = useState<string[]>([])

	// Estados para erros específicos de campos
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

	useEffect(() => {
		const nameParam = searchParams.get("name")
		const barcodeParam = searchParams.get("barcode")

		if (nameParam || barcodeParam) {
			setFormData((prev) => ({
				...prev,
				...(nameParam && { name: nameParam }),
				...(barcodeParam && { barcode: barcodeParam }),
			}))

			// Se veio um barcode, adicionar ao array de barcodes
			if (barcodeParam) {
				setBarcodes((prev) => (prev.includes(barcodeParam) ? prev : [barcodeParam, ...prev]))
			}
		}
	}, [searchParams])

const showNutritionalFields = (() => {
		if (!formData.categoryId || categories.length === 0) return false
		const selectedCategory = categories.find((cat: Category) => cat.id === formData.categoryId)
		return selectedCategory?.isFood === true
	})()

	const clearFieldError = (field: string) => {
		setFieldErrors((prev) => {
			const newErrors = { ...prev }
			delete newErrors[field]
			return newErrors
		})
	}

	const setFieldError = (field: string, message: string) => {
		setFieldErrors((prev) => ({
			...prev,
			[field]: message,
		}))
	}

	const clearAllErrors = () => {
		setFieldErrors({})
	}

	const handleSubmit = async () => {
		clearAllErrors()

		if (!formData.name.trim()) {
			setFieldError("name", "O nome do produto é obrigatório")
			return
		}

		setLoading(true)
		try {
			const hasNutritionalData = Object.values(nutritionalData).some(
				(v) => v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true),
			)
			const dataToSubmit: Omit<Product, "id" | "createdAt" | "updatedAt" | "barcodes"> & { barcodes?: string[] } = {
				name: formData.name,
				barcode: formData.barcode || undefined,
				barcodes: barcodes.length > 0 ? barcodes : undefined,
				categoryId: formData.categoryId || undefined,
				brandId: formData.brandId || undefined,
				unit: formData.unit,
				packageSize: formData.packageSize || undefined,
				hasStock: formData.hasStock,
				minStock: formData.minStock ? parseFloat(formData.minStock) : undefined,
				maxStock: formData.maxStock ? parseFloat(formData.maxStock) : undefined,
				hasExpiration: formData.hasExpiration,
				defaultShelfLifeDays: formData.defaultShelfLifeDays ? parseInt(formData.defaultShelfLifeDays, 10) : undefined,
				nutritionalInfo: hasNutritionalData ? (nutritionalData as NutritionalInfo) : undefined,
			}
			const newProduct = await createProductMutation.mutateAsync(dataToSubmit)
			AppToasts.success("Produto criado com sucesso!")

			const returnTo = searchParams.get("returnTo")
			const storageKey = searchParams.get("storageKey")
			if (returnTo && storageKey) {
				const preservedData = TempStorage.get(storageKey)
				if (preservedData) {
					const updatedData = {
						...preservedData,
						newProductId: newProduct.id,
					}
					const newStorageKey = TempStorage.save(updatedData)
					TempStorage.remove(storageKey)
					setTimeout(() => {
						router.push(`${returnTo}?storageKey=${newStorageKey}`)
					}, 100)
				} else {
					setTimeout(() => {
						router.push(returnTo)
					}, 100)
				}
			} else {
				setTimeout(() => {
					router.push("/produtos")
				}, 100)
			}
		} catch (error) {
			AppToasts.error(error, "Erro ao criar produto")
		} finally {
			setLoading(false)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))

		if (fieldErrors[name]) {
			clearFieldError(name)
		}
	}

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => {
			return { ...prev, [name]: value }
		})
	}

	const handleBarcodeScanned = (barcode: string) => {
		setFormData((prev) => ({ ...prev, barcode }))
		setBarcodes([barcode])
		setShowBarcodeScanner(false)
		// Não disparar autofill automaticamente - usuário deve clicar no botão de IA
	}

const handleBarcodeLookup = async (barcode: string) => {
		const cleanBarcode = barcode.trim()
		if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode)) {
			toast.error("Código de barras inválido. Use 8, 12, 13 ou 14 dígitos.")
			return
		}

		setIsLookingUpBarcode(true)
		setBarcodeForLookup(cleanBarcode)
		setShowAutofillDialog(true)
	}

	const handleAutofillApply = async (data: { name?: string; packageSize?: string; brandId?: string; shouldCreateBrand?: boolean; brandName?: string; categoryId?: string }) => {
		try {
			if (data.name && data.name.length > 0) {
				setFormData((prev) => ({ ...prev, name: data.name }))
			}

			if (data.packageSize && data.packageSize.length > 0) {
				setFormData((prev) => ({ ...prev, packageSize: data.packageSize }))
			}

			if (data.brandId && data.brandId.length > 0) {
				setFormData((prev) => ({ ...prev, brandId: data.brandId }))
			} else if (data.shouldCreateBrand && data.brandName && data.brandName.length > 0) {
				const newBrand = await createBrandMutation.mutateAsync({
					name: data.brandName,
				})
				setFormData((prev) => ({ ...prev, brandId: newBrand.id }))
				toast.success(`Marca "${data.brandName}" criada automaticamente!`)
			}

			if (data.categoryId && data.categoryId.length > 0) {
				setFormData((prev) => ({ ...prev, categoryId: data.categoryId }))
			}
		} catch (error) {
			console.error("Erro ao aplicar autofill:", error)
			toast.error("Erro ao preencher dados automaticamente")
		} finally {
			setIsLookingUpBarcode(false)
			setShowAutofillDialog(false)
		}
	}

	const handleNutritionalScanComplete = (geminiResponse: unknown) => {
		setIsScanning(true)
		setShowNutritionalScanner(false)
		try {
			if (!geminiResponse) {
				throw new Error("A API não retornou uma resposta.")
			}
			const parsedData = parseGeminiResponse(geminiResponse)
			setNutritionalData(parsedData)
			toast.success("Dados nutricionais preenchidos pela IA!")
		} catch (error) {
			toast.error("Não foi possível processar os dados do rótulo.")
			console.error("Erro ao processar resposta do Gemini:", error)
		} finally {
			setIsScanning(false)
		}
	}

	const handleStepChange = (step: number) => {
		setCurrentStep(step)
	}

	const handleNext = () => {
		// Determinar os steps filtrados
		const filteredSteps = steps.filter((step) => step.id !== "nutritional" || showNutritionalFields)
		const currentFilteredIndex = filteredSteps.findIndex((s) => s.id === steps[currentStep].id)

		if (currentFilteredIndex < filteredSteps.length - 1) {
			// Ir para o próximo step filtrado
			const nextFilteredStep = filteredSteps[currentFilteredIndex + 1]
			const nextStepIndex = steps.findIndex((s) => s.id === nextFilteredStep.id)
			setCurrentStep(nextStepIndex)
		} else {
			handleSubmit()
		}
	}

	const handlePrevious = () => {
		// Determinar os steps filtrados
		const filteredSteps = steps.filter((step) => step.id !== "nutritional" || showNutritionalFields)
		const currentFilteredIndex = filteredSteps.findIndex((s) => s.id === steps[currentStep].id)

		if (currentFilteredIndex > 0) {
			// Voltar para o step anterior filtrado
			const prevFilteredStep = filteredSteps[currentFilteredIndex - 1]
			const prevStepIndex = steps.findIndex((s) => s.id === prevFilteredStep.id)
			setCurrentStep(prevStepIndex)
		}
	}

	const renderStepContent = () => {
		switch (currentStep) {
			case 0: // Informações Principais
				return (
					<div className="space-y-6">
						{/* Product Name */}
						<div className="space-y-3">
							<ProductNameInput
								value={formData.name}
								onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
								placeholder="Digite o nome do produto"
								disabled={loading}
								fieldError={fieldErrors.name}
								onClearError={() => clearFieldError("name")}
								brandId={formData.brandId}
								categoryId={formData.categoryId}
								currentBarcode={formData.barcode}
							/>
						</div>

						{/* Brand and Category */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="brandId" className="text-sm font-medium">Marca</Label>
								{selectStyle === "dialog" ? (
									<BrandSelectDialog
										value={formData.brandId || undefined}
										onValueChange={(value) => handleSelectChange("brandId", value || "")}
									/>
								) : (
									<BrandSelect
										value={formData.brandId || undefined}
										onValueChange={(value) => handleSelectChange("brandId", value || "")}
									/>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="categoryId" className="text-sm font-medium">Categoria</Label>
								{selectStyle === "dialog" ? (
									<CategorySelectDialog
										value={formData.categoryId || undefined}
										onValueChange={(value) => handleSelectChange("categoryId", value || "")}
									/>
								) : (
									<CategorySelect
										value={formData.categoryId || undefined}
										onValueChange={(value) => handleSelectChange("categoryId", value || "")}
									/>
								)}
							</div>
						</div>

						{/* Barcode */}
						<div className="space-y-3 pt-2">
							<BarcodeManager
								initialBarcodes={barcodes.map((barcode) => ({
									id: Math.random().toString(),
									barcode,
									isPrimary: false,
								}))}
								onBarcodesChange={(codes) => {
									setBarcodes(codes)
									if (codes.length > 0) {
										setFormData((prev) => ({ ...prev, barcode: codes[0] }))
									}
								}}
								onBarcodeLookup={handleBarcodeLookup}
							/>
						</div>

						{/* Package Size and Unit */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
							<div className="space-y-2">
								<Label htmlFor={packageSizeId} className="text-sm font-medium">
									Peso/Volume
								</Label>
								<Input
									id={packageSizeId}
									name="packageSize"
									value={formData.packageSize}
									onChange={handleChange}
									placeholder="Ex: 2L, 500g, 1kg"
									className="h-10"
								/>
								<p className="text-xs text-muted-foreground">
									Tamanho da embalagem (opcional)
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor={unitId} className="text-sm font-medium">
									Unidade
								</Label>
								{selectStyle === "dialog" ? (
									<UnitSelectDialog
										value={formData.unit}
										onValueChange={(value) => handleSelectChange("unit", value)}
									/>
								) : (
									<Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
										<SelectTrigger className="h-10">
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
								)}
							</div>
						</div>
					</div>
				)

			case 1: // Informações Nutricionais
				return (
					<div className="space-y-6">
						{/* Header */}
						<div>
							<h3 className="text-lg font-semibold mb-1">Informações Nutricionais</h3>
							<p className="text-sm text-muted-foreground">
								Adicione detalhes nutricionais do produto (opcional)
							</p>
						</div>

						{/* AI Scanner CTA */}
						<div className="flex flex-col items-center justify-center py-8 px-4 bg-muted/30 rounded-lg border border-dashed">
							<ScanLine className="h-12 w-12 text-muted-foreground mb-4" />
							<h4 className="text-base font-semibold mb-2">Escaneie o rótulo nutricional</h4>
							<p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
								Use nossa IA para extrair automaticamente as informações nutricionais
							</p>
							<Button
								type="button"
								onClick={() => setShowNutritionalScanner(true)}
								disabled={isScanning}
								size="lg"
								className="shadow-md"
							>
								{isScanning ? (
									<>
										<Loader2 className="mr-2 h-5 w-5 animate-spin" />
										Processando...
									</>
								) : (
									<>
										<ScanLine className="mr-2 h-5 w-5" />
										Escanear com IA
									</>
								)}
							</Button>
						</div>

						{/* Manual Form */}
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<div className="h-px flex-1 bg-border" />
								<span className="text-xs text-muted-foreground font-medium">ou preencha manualmente</span>
								<div className="h-px flex-1 bg-border" />
							</div>
							<NutritionalInfoForm initialData={nutritionalData} onDataChange={setNutritionalData} />
						</div>
					</div>
				)

			case 2: // Controle de Estoque e Validade
				return (
					<div className="space-y-8">
						{/* Header */}
						<div>
							<h3 className="text-lg font-semibold mb-1">Controle de Estoque e Validade</h3>
							<p className="text-sm text-muted-foreground">
								Configure o monitoramento de estoque e validade do produto
							</p>
						</div>

						{/* Stock Control */}
						<div className="space-y-4">
							<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
								<Checkbox
									id={hasStockId}
									checked={formData.hasStock}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											hasStock: checked as boolean,
										}))
									}
									className="mt-1"
								/>
								<div className="flex-1 space-y-1">
									<Label htmlFor={hasStockId} className="text-base font-medium cursor-pointer">
										Controlar estoque
									</Label>
									<p className="text-sm text-muted-foreground">
										Ative para monitorar a quantidade disponível do produto
									</p>
								</div>
							</div>

							{formData.hasStock && (
								<div className="pl-12 space-y-4 animate-in slide-in-from-top-2 duration-300">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor={minStockId} className="text-sm font-medium">
												Estoque Mínimo
											</Label>
											<Input
												id={minStockId}
												name="minStock"
												type="number"
												step="0.01"
												value={formData.minStock}
												onChange={handleChange}
												placeholder="5"
												className="h-10"
											/>
											<p className="text-xs text-muted-foreground">
												Quantidade mínima antes do alerta
											</p>
										</div>
										<div className="space-y-2">
											<Label htmlFor={maxStockId} className="text-sm font-medium">
												Estoque Máximo
											</Label>
											<Input
												id={maxStockId}
												name="maxStock"
												type="number"
												step="0.01"
												value={formData.maxStock}
												onChange={handleChange}
												placeholder="20"
												className="h-10"
											/>
											<p className="text-xs text-muted-foreground">
												Quantidade máxima recomendada
											</p>
										</div>
									</div>
								</div>
							)}
						</div>

						{/* Expiration Control */}
						<div className="space-y-4">
							<div className="flex items-start gap-4 p-4 rounded-lg border bg-card">
								<Checkbox
									id={hasExpirationId}
									checked={formData.hasExpiration}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											hasExpiration: checked as boolean,
										}))
									}
									className="mt-1"
								/>
								<div className="flex-1 space-y-1">
									<Label htmlFor={hasExpirationId} className="text-base font-medium cursor-pointer">
										Controlar validade
									</Label>
									<p className="text-sm text-muted-foreground">
										Ative para rastrear a data de vencimento do produto
									</p>
								</div>
							</div>

							{formData.hasExpiration && (
								<div className="pl-12 space-y-4 animate-in slide-in-from-top-2 duration-300">
									<div className="space-y-2">
										<Label htmlFor={shelfLifeId} className="text-sm font-medium">
											Prazo de Validade Padrão (dias)
										</Label>
										<Input
											id={shelfLifeId}
											name="defaultShelfLifeDays"
											type="number"
											value={formData.defaultShelfLifeDays}
											onChange={handleChange}
											placeholder="30"
											className="h-10 max-w-xs"
										/>
										<p className="text-xs text-muted-foreground">
											Duração típica do produto após a compra
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<div className="container w-full mx-auto px-4 py-6 space-y-8">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<Link href="/produtos">
						<Button variant="ghost" size="icon" className="rounded-full">
							<ArrowLeft className="h-5 w-5" />
						</Button>
					</Link>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Novo Produto</h1>
						<p className="text-sm text-muted-foreground">Preencha as informações do produto</p>
					</div>
				</div>
			</div>

			{/* Wizard Card */}
			<Card className="border-0 shadow-lg">
				<CardContent className="p-6 md:p-8">
					<StepsWizard
						steps={steps.filter((step) => step.id !== "nutritional" || showNutritionalFields)}
						allSteps={steps}
						currentStep={currentStep}
						onStepChange={handleStepChange}
						onNext={handleNext}
						onPrevious={handlePrevious}
						canGoNext={true}
						canGoPrevious={currentStep > 0}
						isSubmitting={loading}
					>
						{renderStepContent()}
					</StepsWizard>
				</CardContent>
			</Card>

			{/* Dialogs */}
			<BarcodeScanner
				isOpen={showBarcodeScanner}
				onScan={handleBarcodeScanned}
				onClose={() => setShowBarcodeScanner(false)}
			/>

			<BarcodeAutofillDialog
				open={showAutofillDialog}
				onOpenChange={setShowAutofillDialog}
				barcode={barcodeForLookup}
				onApply={handleAutofillApply}
				isLoading={isLookingUpBarcode}
			/>

			<Dialog open={showNutritionalScanner} onOpenChange={setShowNutritionalScanner}>
				<DialogContent className="max-w-2xl">
					<NutritionalScanner
						onScanComplete={handleNutritionalScanComplete}
						onClose={() => setShowNutritionalScanner(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
