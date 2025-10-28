"use client"

import { Check, Loader2, Package, X } from "lucide-react"
import Image from "next/image"
import { useId, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Separator } from "@/components/ui/separator"

interface BarcodeAutofillDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	barcode: string
	onApply: (data: AutofillData) => void
	isLoading?: boolean // Nova prop para controlar loading externo
}

interface CosmosProduct {
	gtin: number
	description: string
	avg_price?: number
	brand?: { name: string }
	thumbnail?: string
}

interface AutofillData {
	name?: string
	packageSize?: string
	brandId?: string
	brandName?: string
	shouldCreateBrand?: boolean
	categoryId?: string
}

interface BarcodeResponse {
	cosmos: CosmosProduct
	suggestions: {
		name: string
		packageSize?: string
		brand?: {
			id?: string
			name: string
			exists: boolean
			shouldCreate?: boolean
		}
		categories: Array<{
			id: string
			name: string
			icon?: string
			color?: string
		}>
		categoryKeywords: string[]
		thumbnail?: string
	}
}

export function BarcodeAutofillDialog({ open, onOpenChange, barcode, onApply, isLoading: externalLoading = false }: BarcodeAutofillDialogProps) {
	const [loading, setLoading] = useState(false)
	const [data, setData] = useState<BarcodeResponse | null>(null)
	const [error, setError] = useState<string | null>(null)
	const nameId = useId()
	const packageSizeId = useId()
	const brandId = useId()
	const categoryId = useId()

	// Campos selecionados para autofill
	const [selectedFields, setSelectedFields] = useState({
		name: true,
		packageSize: true,
		brand: true,
		category: false,
	})

	// Categoria selecionada
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

	// Buscar dados quando o dialog abre
	const fetchData = async () => {
		if (!barcode || data) return

		console.log("🔍 BarcodeAutofillDialog: Iniciando busca para barcode:", barcode)
		setLoading(true)
		setError(null)

		try {
			// Usar nova API do Gemini em vez da Cosmos (que tem limite de 25 req/dia)
			const response = await fetch(`/api/products/barcode/gemini-lookup/${barcode}`)
			console.log("📡 BarcodeAutofillDialog: Resposta da API:", response.status)

			if (!response.ok) {
				const errorData = await response.json()
				console.error("❌ BarcodeAutofillDialog: Erro da API:", errorData)
				throw new Error(errorData.error || "Erro ao buscar produto")
			}

			const result = await response.json()
			console.log("✅ BarcodeAutofillDialog: Dados recebidos:", result)

			// Converter resposta do Gemini para o formato esperado
			const convertedResult: BarcodeResponse = {
				cosmos: {
					gtin: Number.parseInt(barcode, 10),
					description: result.suggestions.name || "",
					avg_price: result.suggestions.estimatedPrice || undefined,
					brand: result.suggestions.brand?.name ? { name: result.suggestions.brand.name } : undefined,
					thumbnail: undefined,
				},
				suggestions: {
					name: result.suggestions.name || "",
					packageSize: result.suggestions.packageSize || undefined,
					brand: result.suggestions.brand
						? {
								id: result.suggestions.brand.id || undefined,
								name: result.suggestions.brand.name,
								exists: !!result.suggestions.brand.id,
								shouldCreate: result.suggestions.brand.shouldCreate || false,
							}
						: undefined,
					categories: result.suggestions.category
						? [
								{
									id: result.suggestions.category.id,
									name: result.suggestions.category.name,
									icon: undefined,
									color: undefined,
								},
							]
						: [],
					categoryKeywords: [],
					thumbnail: undefined,
				},
			}

			setData(convertedResult)

			// Pré-selecionar categoria se houver
			if (result.suggestions.category) {
				setSelectedCategoryId(result.suggestions.category.id)
				setSelectedFields((prev) => ({ ...prev, category: true }))
			}
		} catch (err: unknown) {
			console.error("Erro ao buscar dados do barcode:", err)
			setError(err instanceof Error ? err.message : "Erro desconhecido")
		} finally {
			setLoading(false)
		}
	}

	// Quando o dialog abre, buscar dados
	const handleOpenChange = (isOpen: boolean) => {
		console.log("🔄 BarcodeAutofillDialog: handleOpenChange chamado com:", { isOpen, barcode, hasData: !!data, isLoading: loading })
		if (isOpen && !data && !loading) {
			console.log("🚀 BarcodeAutofillDialog: Iniciando fetchData")
			fetchData()
		}
		onOpenChange(isOpen)
	}

	// Aplicar seleções
	const handleApply = () => {
		if (!data) return

		const autofillData: AutofillData = {}

		if (selectedFields.name) {
			autofillData.name = data.suggestions.name
		}

		if (selectedFields.packageSize && data.suggestions.packageSize) {
			autofillData.packageSize = data.suggestions.packageSize
		}

		if (selectedFields.brand && data.suggestions.brand) {
			if (data.suggestions.brand.exists && data.suggestions.brand.id) {
				autofillData.brandId = data.suggestions.brand.id
			} else if (data.suggestions.brand.shouldCreate) {
				autofillData.brandName = data.suggestions.brand.name
				autofillData.shouldCreateBrand = true
			}
		}

		if (selectedFields.category && selectedCategoryId) {
			autofillData.categoryId = selectedCategoryId
		}

		onApply(autofillData)
		toast.success("Informações preenchidas automaticamente!")
		onOpenChange(false)
	}

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={handleOpenChange}
			title="Informações do Produto"
			description={`Dados encontrados via IA para o código EAN/GTIN ${barcode}`}
			maxWidth="2xl"
			maxHeight={true}
		>
			<div className="space-y-4">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span className="text-xs font-normal px-2 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full">
						✨ IA Gemini
					</span>
				</div>

				{/* Estado de Loading - Melhorado */}
				{(loading || externalLoading) && (
					<div className="flex flex-col items-center justify-center py-12 min-h-[300px]">
						<Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
						<p className="text-lg font-medium text-muted-foreground mb-2">
							Buscando dados do produto...
						</p>
						<p className="text-sm text-muted-foreground text-center max-w-md">
							Nossa IA está analisando o código de barras <strong>{barcode}</strong> para encontrar informações do produto.
						</p>
					</div>
				)}

				{/* Estado de Erro */}
				{error && !loading && !externalLoading && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<div className="flex items-center gap-3 mb-2">
							<X className="h-5 w-5 text-red-600" />
							<h3 className="font-semibold text-red-800">Erro ao buscar produto</h3>
						</div>
						<p className="text-sm text-red-600">{error}</p>
						<p className="text-xs text-red-500 mt-2">
							Você pode tentar novamente ou preencher as informações manualmente.
						</p>
					</div>
				)}

				{/* Estado de Dados Encontrados */}
				{data && !loading && !externalLoading && (
					<div className="space-y-6">
						{/* Preview do Produto */}
						<div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
							{data.suggestions.thumbnail ? (
								<Image
									src={data.suggestions.thumbnail}
									alt={data.cosmos.description}
									width={80}
									height={80}
									className="rounded object-cover"
								/>
							) : (
								<div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
									<Package className="h-8 w-8 text-gray-400" />
								</div>
							)}
							<div className="flex-1">
								<h3 className="font-semibold">
									{data.cosmos.description || data.suggestions.name || "Produto não identificado"}
								</h3>
								{data.cosmos.brand && <p className="text-sm text-gray-600 mt-1">Marca: {data.cosmos.brand.name}</p>}
								{data.cosmos.avg_price && (
									<p className="text-sm text-gray-600">Preço médio: R$ {data.cosmos.avg_price.toFixed(2)}</p>
								)}
							</div>
						</div>

						<Separator />

						{/* Selecionar campos para preencher */}
						<div className="space-y-4">
							<h4 className="font-semibold text-sm">Selecione as informações que deseja preencher automaticamente:</h4>

							{/* Nome do Produto - sempre mostrar se houver nome */}
							{data.suggestions.name && (
								<div className="flex items-start space-x-3">
									<Checkbox
										id={nameId}
										checked={selectedFields.name}
										onCheckedChange={(checked) => setSelectedFields((prev) => ({ ...prev, name: !!checked }))}
									/>
									<div className="flex-1">
										<Label htmlFor={nameId} className="font-medium cursor-pointer">
											Nome do Produto
										</Label>
										<p className="text-sm text-gray-600">{data.suggestions.name}</p>
									</div>
								</div>
							)}

							{/* Tamanho/Volume */}
							{data.suggestions.packageSize && (
								<div className="flex items-start space-x-3">
									<Checkbox
										id={packageSizeId}
										checked={selectedFields.packageSize}
										onCheckedChange={(checked) => setSelectedFields((prev) => ({ ...prev, packageSize: !!checked }))}
									/>
									<div className="flex-1">
										<Label htmlFor={packageSizeId} className="font-medium cursor-pointer">
											Tamanho/Volume
										</Label>
										<p className="text-sm text-gray-600">{data.suggestions.packageSize}</p>
									</div>
								</div>
							)}

							{/* Marca */}
							{data.suggestions.brand && (
								<div className="flex items-start space-x-3">
									<Checkbox
										id={brandId}
										checked={selectedFields.brand}
										onCheckedChange={(checked) => setSelectedFields((prev) => ({ ...prev, brand: !!checked }))}
									/>
									<div className="flex-1">
										<Label htmlFor={brandId} className="font-medium cursor-pointer">
											Marca
										</Label>
										<p className="text-sm text-gray-600">
											{data.suggestions.brand.name}
											{data.suggestions.brand.shouldCreate && (
												<span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
													Será criada automaticamente
												</span>
											)}
										</p>
									</div>
								</div>
							)}

							{/* Categoria */}
							{data.suggestions.categories.length > 0 && (
								<div className="flex items-start space-x-3">
									<Checkbox
										id={categoryId}
										checked={selectedFields.category}
										onCheckedChange={(checked) => setSelectedFields((prev) => ({ ...prev, category: !!checked }))}
									/>
									<div className="flex-1">
										<Label htmlFor={categoryId} className="font-medium cursor-pointer">
											Categoria
										</Label>
										<p className="text-xs text-gray-500 mb-2">
											Palavras-chave: {data.suggestions.categoryKeywords.join(", ")}
										</p>
										<div className="space-y-2">
											{data.suggestions.categories.map((category) => (
												<label
													key={category.id}
													className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
														selectedCategoryId === category.id
															? "border-primary bg-primary/5"
															: "border-gray-200 hover:border-gray-300"
													}`}
												>
													<input
														type="radio"
														name="category"
														value={category.id}
														checked={selectedCategoryId === category.id}
														onChange={(e) => setSelectedCategoryId(e.target.value)}
														disabled={!selectedFields.category}
														className="w-4 h-4"
													/>
													<span className="text-lg">{category.icon || "📦"}</span>
													<span className="text-sm flex-1">{category.name}</span>
													{selectedCategoryId === category.id && <Check className="h-4 w-4 text-primary" />}
												</label>
											))}
										</div>
									</div>
								</div>
							)}

							{/* Mensagem quando não há dados para preencher */}
							{!data.suggestions.name &&
								!data.suggestions.packageSize &&
								!data.suggestions.brand &&
								data.suggestions.categories.length === 0 && (
									<div className="text-center py-4">
										<Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
										<p className="text-sm text-gray-600">
											Nenhuma informação adicional foi encontrada para este código de barras.
										</p>
										<p className="text-xs text-gray-500 mt-1">
											Você pode preencher manualmente as informações do produto.
										</p>
									</div>
								)}
						</div>
					</div>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading || externalLoading}>
						<X className="h-4 w-4 mr-2" />
						Cancelar
					</Button>
					<Button type="button" onClick={handleApply} disabled={loading || externalLoading || !data}>
						{loading || externalLoading ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Processando...
							</>
						) : (
							<>
								<Check className="h-4 w-4 mr-2" />
								Aplicar Selecionados
							</>
						)}
					</Button>
				</DialogFooter>
			</div>
		</ResponsiveDialog>
	)
}
