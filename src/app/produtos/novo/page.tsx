"use client"

import { ArrowLeft, Camera, Loader2, Package, Save, ScanLine, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { NutritionalInfoForm } from "@/components/nutritional-info-form"
import { NutritionalScanner } from "@/components/nutritional-scanner"
import { BarcodeAutofillDialog } from "@/components/products/barcode-autofill-dialog"
import { BrandSelect } from "@/components/selects/brand-select"
import { BrandSelectDialog } from "@/components/selects/brand-select-dialog"
import { CategorySelect } from "@/components/selects/category-select"
import { CategorySelectDialog } from "@/components/selects/category-select-dialog"
import { UnitSelectDialog } from "@/components/selects/unit-select-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
	useAllBrandsQuery,
	useAllCategoriesQuery,
	useCreateBrandMutation,
	useCreateProductMutation,
	useUIPreferences,
} from "@/hooks"
import { parseGeminiResponse } from "@/lib/gemini-parser"
import { TempStorage } from "@/lib/temp-storage"
import { AppToasts } from "@/lib/toasts"
import type { NutritionalInfo, Product } from "@/types"

// REMOVIDO: OcrDebugDialog não é mais necessário aqui

const units = ["unidade", "kg", "g", "litro", "ml", "pacote", "caixa", "garrafa", "lata", "saco"]

export default function NovoProdutoPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { selectStyle } = useUIPreferences()

	const [loading, setLoading] = useState(false)
	const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
	const { data: categories = [] } = useAllCategoriesQuery()
	const { data: brands = [] } = useAllBrandsQuery()
	const createProductMutation = useCreateProductMutation()
	const createBrandMutation = useCreateBrandMutation()

	const [showNutritionalScanner, setShowNutritionalScanner] = useState(false)
	const [isScanning, setIsScanning] = useState(false)

	// Estados para barcode autofill
	const [showAutofillDialog, setShowAutofillDialog] = useState(false)
	const [barcodeForLookup, setBarcodeForLookup] = useState("")
	const barcodeDebounceRef = useRef<NodeJS.Timeout | null>(null)

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

	// Estados para erros específicos de campos
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
	const [_showFieldErrors, setShowFieldErrors] = useState(false)

	useEffect(() => {
		const nameParam = searchParams.get("name")
		if (nameParam) {
			setFormData((prev) => ({ ...prev, name: nameParam }))
		}
	}, [searchParams])

	const showNutritionalFields = useMemo(() => {
		if (!formData.categoryId || categories.length === 0) return false
		const selectedCategory = categories.find((cat: any) => cat.id === formData.categoryId)
		return selectedCategory?.isFood === true
	}, [formData.categoryId, categories])

	// Funções para gerenciar erros de campos
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
		setShowFieldErrors(true)
	}

	const clearAllErrors = () => {
		setFieldErrors({})
		setShowFieldErrors(false)
	}

	// Função para mapear erros da API para campos específicos
	const _parseApiError = (error: string, status: number) => {
		clearAllErrors()

		// Erro de conflito - código de barras duplicado
		if (status === 409) {
			if (error.includes("Código de barras") || error.includes("código de barras")) {
				setFieldError("barcode", error)
				AppToasts.error("⚠️ Código de barras já existe!")
				return
			}
		}

		// Erro de validação - campo obrigatório
		if (status === 400) {
			if (error.includes("Nome é obrigatório") || error.includes("name")) {
				setFieldError("name", "Por favor, digite o nome do produto")
				AppToasts.error("❌ Nome do produto é obrigatório")
				return
			}
		}

		// Erros relacionados ao código de barras
		if (error.toLowerCase().includes("barcode") || error.toLowerCase().includes("código")) {
			setFieldError("barcode", error)
			AppToasts.error("❌ Erro no código de barras")
			return
		}

		// Erros relacionados ao nome
		if (error.toLowerCase().includes("name") || error.toLowerCase().includes("nome")) {
			setFieldError("name", error)
			AppToasts.error("❌ Erro no nome do produto")
			return
		}

		// Erro genérico se não conseguir mapear
		AppToasts.error(`❌ ${error}`)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Limpar erros anteriores
		clearAllErrors()

		// Validação local
		if (!formData.name.trim()) {
			setFieldError("name", "O nome do produto é obrigatório")
			return
		}

		setLoading(true)
		try {
			const hasNutritionalData = Object.values(nutritionalData).some(
				(v) => v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true),
			)
			const dataToSubmit: Omit<Product, "id" | "createdAt" | "updatedAt"> = {
				name: formData.name,
				barcode: formData.barcode || undefined,
				categoryId: formData.categoryId || undefined,
				brandId: formData.brandId || undefined,
				unit: formData.unit,
				packageSize: formData.packageSize || undefined,
				hasStock: formData.hasStock,
				minStock: formData.minStock ? parseFloat(formData.minStock) : undefined,
				maxStock: formData.maxStock ? parseFloat(formData.maxStock) : undefined,
				hasExpiration: formData.hasExpiration,
				defaultShelfLifeDays: formData.defaultShelfLifeDays ? parseInt(formData.defaultShelfLifeDays, 10) : undefined,
				nutritionalInfo: hasNutritionalData ? nutritionalData as NutritionalInfo : undefined,
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
					// Pequeno delay para garantir que a invalidação seja processada
					setTimeout(() => {
						router.push(`${returnTo}?storageKey=${newStorageKey}`)
					}, 100)
				} else {
					// Pequeno delay para garantir que a invalidação seja processada
					setTimeout(() => {
						router.push(returnTo)
					}, 100)
				}
			} else {
				// Pequeno delay para garantir que a invalidação seja processada
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

		// Limpar erro do campo quando o usuário começar a digitar
		if (fieldErrors[name]) {
			clearFieldError(name)
		}

		// Se for o campo de barcode, disparar lookup com debounce
		if (name === "barcode" && value) {
			triggerBarcodeLookup(value)
		}
	}

	const handleSelectChange = (name: string, value: string) => {
		console.log("[NovoProduto] handleSelectChange called:", { name, value })
		setFormData((prev) => {
			const newData = { ...prev, [name]: value }
			console.log("[NovoProduto] New formData:", newData)
			return newData
		})
	}

	const handleBarcodeScanned = (barcode: string) => {
		setFormData((prev) => ({ ...prev, barcode }))
		setShowBarcodeScanner(false)
		// Trigger autofill lookup
		triggerBarcodeLookup(barcode)
	}

	// Debounce para busca de barcode (espera 1.5s após parar de digitar)
	const triggerBarcodeLookup = useCallback((barcode: string) => {
		// Limpar timeout anterior
		if (barcodeDebounceRef.current) {
			clearTimeout(barcodeDebounceRef.current)
		}

		// Validar se tem formato de código de barras válido (8, 12, 13 ou 14 dígitos)
		const cleanBarcode = barcode.trim()
		if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode)) {
			return
		}

		// Setar timeout de 1.5 segundos
		barcodeDebounceRef.current = setTimeout(() => {
			setBarcodeForLookup(cleanBarcode)
			setShowAutofillDialog(true)
		}, 1500)
	}, [])

	// Handler para aplicar dados do autofill
	const handleAutofillApply = async (data: any) => {
		try {
			// Aplicar nome
			if (data.name) {
				setFormData(prev => ({ ...prev, name: data.name }))
			}

			// Aplicar tamanho/volume
			if (data.packageSize) {
				setFormData(prev => ({ ...prev, packageSize: data.packageSize }))
			}

			// Aplicar marca
			if (data.brandId) {
				setFormData(prev => ({ ...prev, brandId: data.brandId }))
			} else if (data.shouldCreateBrand && data.brandName) {
				// Criar marca automaticamente
				const newBrand = await createBrandMutation.mutateAsync({
					name: data.brandName,
				})
				setFormData(prev => ({ ...prev, brandId: newBrand.id }))
				toast.success(`Marca "${data.brandName}" criada automaticamente!`)
			}

			// Aplicar categoria
			if (data.categoryId) {
				setFormData(prev => ({ ...prev, categoryId: data.categoryId }))
			}

		} catch (error) {
			console.error("Erro ao aplicar autofill:", error)
			toast.error("Erro ao preencher dados automaticamente")
		}
	}

	// Limpar debounce ao desmontar
	useEffect(() => {
		return () => {
			if (barcodeDebounceRef.current) {
				clearTimeout(barcodeDebounceRef.current)
			}
		}
	}, [])

	// --- FUNÇÃO ATUALIZADA ---
	// Agora ela processa e preenche os dados diretamente, sem o diálogo de debug.
	const handleNutritionalScanComplete = (geminiResponse: any) => {
		setIsScanning(true)
		setShowNutritionalScanner(false) // Fecha o modal da câmera
		try {
			if (!geminiResponse) {
				throw new Error("A API não retornou uma resposta.")
			}
			// 1. Processa a resposta da API com o parser
			const parsedData = parseGeminiResponse(geminiResponse)
			// 2. Atualiza o estado do formulário nutricional
			setNutritionalData(parsedData)
			toast.success("Dados nutricionais preenchidos pela IA!")
		} catch (error) {
			toast.error("Não foi possível processar os dados do rótulo.")
			console.error("Erro ao processar resposta do Gemini:", error)
		} finally {
			setIsScanning(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/produtos">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Novo Produto</h1>
					<p className="text-gray-600 mt-2">Cadastre um novo produto</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Informações do Produto
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nome do Produto *</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									placeholder="Ex: Arroz Branco"
									required
									className={fieldErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
								/>
								{fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
							</div>
							<div className="space-y-2">
								<Label htmlFor="barcode">Código de Barras</Label>
								<div className="flex gap-2">
									<Input
										id="barcode"
										name="barcode"
										value={formData.barcode}
										onChange={handleChange}
										onBlur={(e) => {
											// Trigger lookup ao sair do campo
											if (e.target.value) {
												triggerBarcodeLookup(e.target.value)
											}
										}}
										placeholder="Digite ou escaneie o código"
										className={fieldErrors.barcode ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
									/>
									<Button type="button" variant="outline" onClick={() => setShowBarcodeScanner(true)}>
										<Camera className="h-4 w-4" />
									</Button>
									{formData.barcode && (
										<Button
											type="button"
											variant="outline"
											onClick={() => {
												setBarcodeForLookup(formData.barcode)
												setShowAutofillDialog(true)
											}}
											title="Buscar informações do produto"
										>
											<Sparkles className="h-4 w-4" />
										</Button>
									)}
								</div>
								{fieldErrors.barcode && <p className="text-sm text-red-600 mt-1">{fieldErrors.barcode}</p>}
								<p className="text-xs text-gray-500">
									Ao digitar ou escanear, buscaremos automaticamente as informações do produto
								</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="brandId">Marca</Label>
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
								<Label htmlFor="categoryId">Categoria</Label>
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
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="packageSize">Peso/Volume</Label>
									<Input
										id="packageSize"
										name="packageSize"
										value={formData.packageSize}
										onChange={handleChange}
										placeholder="Ex: 2L, 500g, 1kg"
									/>
									<p className="text-xs text-gray-500">
										Peso ou volume da embalagem (ex: 2L, 500g, 1kg, 250ml)
									</p>
								</div>
								<div className="space-y-2">
									<Label htmlFor="unit">Unidade de Medida</Label>
									{selectStyle === "dialog" ? (
										<UnitSelectDialog
											value={formData.unit}
											onValueChange={(value) => handleSelectChange("unit", value)}
										/>
									) : (
										<Select value={formData.unit} onValueChange={(value) => handleSelectChange("unit", value)}>
											<SelectTrigger>
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
							<div className="space-y-4 pt-4 border-t">
								<h3 className="text-lg font-medium">Controle de Estoque</h3>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="hasStock"
										checked={formData.hasStock}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												hasStock: checked as boolean,
											}))
										}
									/>
									<Label htmlFor="hasStock">Produto com controle de estoque</Label>
								</div>
								{formData.hasStock && (
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="minStock">Estoque Mínimo</Label>
											<Input
												id="minStock"
												name="minStock"
												type="number"
												step="0.01"
												value={formData.minStock}
												onChange={handleChange}
												placeholder="Ex: 5"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="maxStock">Estoque Máximo</Label>
											<Input
												id="maxStock"
												name="maxStock"
												type="number"
												step="0.01"
												value={formData.maxStock}
												onChange={handleChange}
												placeholder="Ex: 20"
											/>
										</div>
									</div>
								)}
							</div>
							<div className="space-y-4 pt-4 border-t">
								<h3 className="text-lg font-medium">Controle de Validade</h3>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="hasExpiration"
										checked={formData.hasExpiration}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												hasExpiration: checked as boolean,
											}))
										}
									/>
									<Label htmlFor="hasExpiration">Produto com validade</Label>
								</div>
								{formData.hasExpiration && (
									<div className="space-y-2">
										<Label htmlFor="defaultShelfLifeDays">Prazo de Validade Padrão (dias)</Label>
										<Input
											id="defaultShelfLifeDays"
											name="defaultShelfLifeDays"
											type="number"
											value={formData.defaultShelfLifeDays}
											onChange={handleChange}
											placeholder="Ex: 30"
										/>
										<p className="text-xs text-gray-500">Usado para calcular a validade ao adicionar ao estoque.</p>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{showNutritionalFields && (
					<>
						<Card>
							<CardHeader>
								<CardTitle>Scanner de Rótulo</CardTitle>
								<p className="text-sm text-gray-600">Escaneie o rótulo para preencher os campos nutricionais.</p>
							</CardHeader>
							<CardContent>
								<Button
									type="button"
									onClick={() => setShowNutritionalScanner(true)}
									disabled={isScanning}
									variant="outline"
									className="w-full md:w-auto"
								>
									{isScanning ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Aguarde...
										</>
									) : (
										<>
											<ScanLine className="mr-2 h-4 w-4" />
											Escanear Rótulo
										</>
									)}
								</Button>
							</CardContent>
						</Card>
						<NutritionalInfoForm initialData={nutritionalData} onDataChange={setNutritionalData} />
					</>
				)}

				<div className="flex gap-3 pt-4">
					<Button type="submit" disabled={loading}>
						<Save className="h-4 w-4 mr-2" />
						{loading ? "Salvando..." : "Salvar Produto"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							const returnTo = searchParams.get("returnTo")
							const storageKey = searchParams.get("storageKey")
							if (returnTo && storageKey) {
								TempStorage.remove(storageKey)
								router.push(returnTo)
							} else {
								router.push("/produtos")
							}
						}}
					>
						Cancelar
					</Button>
				</div>
			</form>

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
