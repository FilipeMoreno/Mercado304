"use client"

import { ArrowLeft, Loader2, Package, Save, ScanLine } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { NutritionalInfoForm } from "@/components/nutritional-info-form"
import { NutritionalScanner } from "@/components/nutritional-scanner"
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
import { useUIPreferences } from "@/hooks"
import { parseGeminiResponse } from "@/lib/gemini-parser"
import { useDataStore } from "@/store/useDataStore"
import type { NutritionalInfo, Product } from "@/types"

// REMOVIDO: OcrDebugDialog não é mais necessário aqui

const units = ["unidade", "kg", "g", "litro", "ml", "pacote", "caixa", "garrafa", "lata", "saco"]

export default function EditarProdutoPage() {
	const params = useParams()
	const router = useRouter()
	const productId = params.id as string
	const { selectStyle } = useUIPreferences()
	const { categories, fetchCategories } = useDataStore()

	const [product, setProduct] = useState<Product | null>(null)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)

	const [showNutritionalScanner, setShowNutritionalScanner] = useState(false)
	const [isScanning, setIsScanning] = useState(false)

	const [formData, setFormData] = useState({
		name: "",
		categoryId: "",
		unit: "unidade",
		brandId: "",
		barcode: "",
		hasStock: false,
		minStock: "",
		maxStock: "",
		hasExpiration: false,
		defaultShelfLifeDays: "",
	})

	const [nutritionalData, setNutritionalData] = useState<Partial<NutritionalInfo> | null>(null)

	// Estados para erros específicos de campos
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
	const [showFieldErrors, setShowFieldErrors] = useState(false)

	useEffect(() => {
		fetchCategories()
	}, [fetchCategories])

	const showNutritionalFields = useMemo(() => {
		if (!formData.categoryId || categories.length === 0) return false
		const selectedCategory = categories.find((cat) => cat.id === formData.categoryId)
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
	const parseApiError = (error: string, status: number) => {
		clearAllErrors()

		// Erro de conflito - código de barras duplicado
		if (status === 409) {
			if (error.includes("Código de barras") || error.includes("código de barras")) {
				setFieldError("barcode", error)
				toast.error("⚠️ Código de barras já existe!")
				return
			}
		}

		// Erro de validação - campo obrigatório
		if (status === 400) {
			if (error.includes("Nome é obrigatório") || error.includes("name")) {
				setFieldError("name", "Por favor, digite o nome do produto")
				toast.error("❌ Nome do produto é obrigatório")
				return
			}
		}

		// Erros relacionados ao código de barras
		if (error.toLowerCase().includes("barcode") || error.toLowerCase().includes("código")) {
			setFieldError("barcode", error)
			toast.error("❌ Erro no código de barras")
			return
		}

		// Erros relacionados ao nome
		if (error.toLowerCase().includes("name") || error.toLowerCase().includes("nome")) {
			setFieldError("name", error)
			toast.error("❌ Erro no nome do produto")
			return
		}

		// Erro genérico se não conseguir mapear
		toast.error(`❌ ${error}`)
	}

	useEffect(() => {
		if (productId) {
			fetchData()
		}
	}, [productId])

	const fetchData = async () => {
		try {
			const productRes = await fetch(`/api/products/${productId}`)
			if (!productRes.ok) {
				toast.error("Produto não encontrado")
				router.push("/produtos")
				return
			}
			const productData = await productRes.json()
			setProduct(productData)

			setFormData({
				name: productData.name,
				categoryId: productData.categoryId || "",
				unit: productData.unit,
				brandId: productData.brandId || "",
				barcode: productData.barcode || "",
				hasStock: productData.hasStock || false,
				minStock: productData.minStock?.toString() || "",
				maxStock: productData.maxStock?.toString() || "",
				hasExpiration: productData.hasExpiration || false,
				defaultShelfLifeDays: productData.defaultShelfLifeDays?.toString() || "",
			})

			const nutritionRes = await fetch(`/api/products/${productId}/scan-nutrition`)
			if (nutritionRes.ok) {
				setNutritionalData(await nutritionRes.json())
			}
		} catch (error) {
			console.error("Erro ao buscar dados:", error)
			toast.error("Erro ao carregar dados")
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		// Limpar erros anteriores
		clearAllErrors()

		// Validação local
		if (!formData.name.trim()) {
			setFieldError("name", "Nome do produto é obrigatório")
			return
		}

		setSaving(true)
		try {
			const hasNutritionalData = Object.values(nutritionalData || {}).some(
				(v) => v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true),
			)
			const dataToSubmit = {
				...formData,
				minStock: formData.minStock ? parseFloat(formData.minStock) : null,
				maxStock: formData.maxStock ? parseFloat(formData.maxStock) : null,
				defaultShelfLifeDays: formData.defaultShelfLifeDays ? parseInt(formData.defaultShelfLifeDays, 10) : null,
				nutritionalInfo: hasNutritionalData ? nutritionalData : null,
			}
			const response = await fetch(`/api/products/${productId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSubmit),
			})
			if (response.ok) {
				toast.success("Produto atualizado com sucesso!")
				router.push(`/produtos/${productId}`)
				router.refresh()
			} else {
				const errorData = await response.json()
				parseApiError(errorData.error || "Erro ao atualizar produto", response.status)
			}
		} catch (error) {
			console.error("Erro ao atualizar produto:", error)
			toast.error("Erro ao atualizar produto")
		} finally {
			setSaving(false)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))

		// Limpar erro do campo quando o usuário começar a digitar
		if (fieldErrors[name]) {
			clearFieldError(name)
		}
	}

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	// --- FUNÇÃO ATUALIZADA ---
	const handleNutritionalScanComplete = (geminiResponse: any) => {
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

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
					<div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
				</div>
				<Card>
					<CardHeader>
						<div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{Array.from({ length: 8 }).map((_, i) => (
								<div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!product) {
		return null
	}

	return (
		<div className="space-y-6">
			{/* Header Responsivo */}
			<div className="space-y-4">
				{/* Ícone + Título */}
				<div className="flex items-start gap-3">
					<div className="flex-1 min-w-0">
						<div className="flex flex-col sm:flex-row sm:items-center gap-2">
							<h1 className="text-xl md:text-3xl font-bold break-words leading-tight">{product.name}</h1>
						</div>
						<p className="text-sm md:text-base text-gray-600 mt-2">Atualize as informações do produto</p>
					</div>
				</div>

				{/* Botão Voltar abaixo do título */}
				<div>
					<Link href={`/produtos/${productId}`}>
						<Button variant="outline" size="sm" className="w-full sm:w-auto">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar para detalhes
						</Button>
					</Link>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Informações do Produto</CardTitle>
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
									placeholder="Ex: Leite Integral"
									required
									className={fieldErrors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
								/>
								{fieldErrors.name && <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>}
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="brandId">Marca</Label>
									{selectStyle === "dialog" ? (
										<BrandSelectDialog
											value={formData.brandId}
											onValueChange={(value) => handleSelectChange("brandId", value)}
										/>
									) : (
										<BrandSelect
											value={formData.brandId}
											onValueChange={(value) => handleSelectChange("brandId", value)}
										/>
									)}
								</div>
								<div className="space-y-2">
									<Label htmlFor="categoryId">Categoria</Label>
									{selectStyle === "dialog" ? (
										<CategorySelectDialog
											value={formData.categoryId}
											onValueChange={(value) => handleSelectChange("categoryId", value)}
										/>
									) : (
										<CategorySelect
											value={formData.categoryId}
											onValueChange={(value) => handleSelectChange("categoryId", value)}
										/>
									)}
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
								<div className="space-y-2">
									<Label htmlFor="barcode">Código de Barras</Label>
									<Input
										id="barcode"
										name="barcode"
										value={formData.barcode}
										onChange={handleChange}
										placeholder="Ex: 7891234567890"
										className={fieldErrors.barcode ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
									/>
									{fieldErrors.barcode && <p className="text-sm text-red-600 mt-1">{fieldErrors.barcode}</p>}
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
								<p className="text-sm text-gray-600">Escaneie o rótulo para preencher ou atualizar os campos abaixo.</p>
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

						<NutritionalInfoForm initialData={nutritionalData} onDataChange={(data) => setNutritionalData(data)} />
					</>
				)}

				<div className="flex gap-3 pt-4">
					<Button type="submit" disabled={saving}>
						<Save className="h-4 w-4 mr-2" />
						{saving ? "Salvando..." : "Salvar Alterações"}
					</Button>
					<Link href={`/produtos/${productId}`}>
						<Button type="button" variant="outline">
							Cancelar
						</Button>
					</Link>
				</div>
			</form>

			<Dialog open={showNutritionalScanner} onOpenChange={setShowNutritionalScanner}>
				<DialogContent className="max-w-2xl">
					<NutritionalScanner
						onClose={() => setShowNutritionalScanner(false)}
						onScanComplete={handleNutritionalScanComplete}
					/>
				</DialogContent>
			</Dialog>
		</div>
	)
}
