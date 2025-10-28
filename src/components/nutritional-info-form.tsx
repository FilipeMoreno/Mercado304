// src/components/nutritional-info-form.tsx
"use client"

import { AlertTriangle, Apple, Check, Plus, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { cn } from "@/lib/utils"
import type { NutritionalInfo } from "@/types"

// ... (as constantes commonAllergens, requiredFields e optionalFields permanecem as mesmas)
// Lista de alérgenos comuns no Brasil (em ordem alfabética)
const commonAllergens = [
	"Amêndoa",
	"Amendoim",
	"Aveia",
	"Avelã",
	"Castanha-de-caju",
	"Castanha-do-Pará",
	"Centeio",
	"Cevada",
	"Crustáceos",
	"Glúten",
	"Látex",
	"Leite",
	"Macadâmia",
	"Nozes",
	"Ovos",
	"Pecã",
	"Peixe",
	"Pistache",
	"Soja",
	"Trigo",
	"Triticale",
]

// Campos obrigatórios da tabela nutricional
const requiredFields = [
	{ key: "calories", label: "Calorias (kcal)", unit: "kcal" },
	{ key: "carbohydrates", label: "Carboidratos (g)", unit: "g" },
	{ key: "proteins", label: "Proteínas (g)", unit: "g" },
	{ key: "totalFat", label: "Gorduras Totais (g)", unit: "g" },
	{ key: "saturatedFat", label: "Gord. Saturadas (g)", unit: "g" },
	{ key: "transFat", label: "Gord. Trans (g)", unit: "g" },
	{ key: "fiber", label: "Fibra Alimentar (g)", unit: "g" },
	{ key: "sodium", label: "Sódio (mg)", unit: "mg" },
	{ key: "totalSugars", label: "Açúcares Totais (g)", unit: "g" },
	{ key: "addedSugars", label: "Açúcares Adic. (g)", unit: "g" },
]

// Elementos opcionais disponíveis
const optionalFields = [
	// Outros (Lactose e Galactose movidos para cá)
	{ key: "lactose", label: "Lactose", unit: "g", category: "Outros" },
	{ key: "galactose", label: "Galactose", unit: "g", category: "Outros" },
	{ key: "taurine", label: "Taurina", unit: "mg", category: "Outros" },
	{ key: "caffeine", label: "Cafeína", unit: "mg", category: "Outros" },
	{ key: "alcoholContent", label: "Teor Alcoólico", unit: "%", category: "Outros" },
	// Ácidos graxos e gorduras especiais
	{ key: "omega3", label: "Ômega 3", unit: "mg", category: "Ácidos Graxos" },
	{ key: "omega6", label: "Ômega 6", unit: "g", category: "Ácidos Graxos" },
	{ key: "monounsaturatedFat", label: "Gordura Monoinsaturada", unit: "g", category: "Ácidos Graxos" },
	{ key: "polyunsaturatedFat", label: "Gordura Poli-insaturada", unit: "g", category: "Ácidos Graxos" },
	{ key: "cholesterol", label: "Colesterol", unit: "mg", category: "Ácidos Graxos" },
	{ key: "epa", label: "EPA", unit: "mg", category: "Ácidos Graxos" },
	{ key: "dha", label: "DHA", unit: "mg", category: "Ácidos Graxos" },
	{ key: "linolenicAcid", label: "Ácido Linolênico", unit: "mg", category: "Ácidos Graxos" },
	// Vitaminas
	{ key: "vitaminA", label: "Vitamina A", unit: "mcg", category: "Vitaminas" },
	{ key: "vitaminC", label: "Vitamina C", unit: "mg", category: "Vitaminas" },
	{ key: "vitaminD", label: "Vitamina D", unit: "mcg", category: "Vitaminas" },
	{ key: "vitaminE", label: "Vitamina E", unit: "mg", category: "Vitaminas" },
	{ key: "vitaminK", label: "Vitamina K", unit: "mcg", category: "Vitaminas" },
	{
		key: "thiamine",
		label: "Vitamina B1 (Tiamina)",
		unit: "mg",
		category: "Vitaminas",
	},
	{
		key: "riboflavin",
		label: "Vitamina B2 (Riboflavina)",
		unit: "mg",
		category: "Vitaminas",
	},
	{
		key: "niacin",
		label: "Vitamina B3 (Niacina)",
		unit: "mg",
		category: "Vitaminas",
	},
	{ key: "vitaminB6", label: "Vitamina B6", unit: "mg", category: "Vitaminas" },
	{ key: "folate", label: "Folato", unit: "mcg", category: "Vitaminas" },
	{
		key: "vitaminB12",
		label: "Vitamina B12",
		unit: "mcg",
		category: "Vitaminas",
	},
	{ key: "biotin", label: "Biotina", unit: "mcg", category: "Vitaminas" },
	{
		key: "pantothenicAcid",
		label: "Vitamina B5 (Ácido Pantotênico)",
		unit: "mg",
		category: "Vitaminas",
	},
	// Minerais
	{ key: "calcium", label: "Cálcio", unit: "mg", category: "Minerais" },
	{ key: "iron", label: "Ferro", unit: "mg", category: "Minerais" },
	{ key: "magnesium", label: "Magnésio", unit: "mg", category: "Minerais" },
	{ key: "phosphorus", label: "Fósforo", unit: "mg", category: "Minerais" },
	{ key: "potassium", label: "Potássio", unit: "mg", category: "Minerais" },
	{ key: "zinc", label: "Zinco", unit: "mg", category: "Minerais" },
	{ key: "copper", label: "Cobre", unit: "mg", category: "Minerais" },
	{ key: "manganese", label: "Manganês", unit: "mg", category: "Minerais" },
	{ key: "selenium", label: "Selênio", unit: "mcg", category: "Minerais" },
	{ key: "iodine", label: "Iodo", unit: "μg", category: "Minerais" },
	{ key: "chromium", label: "Cromo", unit: "mcg", category: "Minerais" },
	{ key: "molybdenum", label: "Molibdênio", unit: "mcg", category: "Minerais" },
]

interface NutritionalInfoFormProps {
	initialData?: Partial<NutritionalInfo> | null
	onDataChange: (data: Partial<NutritionalInfo>) => void
}

export function NutritionalInfoForm({ initialData, onDataChange }: NutritionalInfoFormProps) {
	const [formData, setFormData] = useState<Partial<NutritionalInfo>>({})
	const [activeOptionalFields, setActiveOptionalFields] = useState<string[]>([])
	const [fieldsToAdd, setFieldsToAdd] = useState<string[]>([])

	useEffect(() => {
		if (initialData) {
			setFormData(initialData)
			// CORREÇÃO: Derivar campos ativos a partir das CHAVES do objeto, não dos VALORES.
			// Isso garante que campos adicionados (com valor `undefined`) sejam exibidos.
			const activeKeys = optionalFields
				.filter((field) => Object.hasOwn(initialData, field.key))
				.map((field) => field.key)
			setActiveOptionalFields(activeKeys)
		}
	}, [initialData])

	const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		const numericValue = value === "" ? undefined : parseFloat(value)
		const updatedData = { ...formData, [name]: numericValue }
		setFormData(updatedData)
		onDataChange(updatedData)
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		const updatedData = { ...formData, [name]: value }
		setFormData(updatedData)
		onDataChange(updatedData)
	}

	const handleAllergenChange = (allergen: string, type: "contains" | "mayContain") => {
		const key = type === "contains" ? "allergensContains" : "allergensMayContain"
		const currentAllergens = formData[key] || []
		let newAllergens: string[]
		if (currentAllergens.includes(allergen)) {
			newAllergens = currentAllergens.filter((a) => a !== allergen)
		} else {
			newAllergens = [...currentAllergens, allergen]
		}
		const updatedData = { ...formData, [key]: newAllergens }
		setFormData(updatedData)
		onDataChange(updatedData)
	}

	const addOptionalFields = () => {
		if (fieldsToAdd.length > 0) {
			// Adiciona os novos campos à lista de campos ativos
			setActiveOptionalFields((prev) => Array.from(new Set([...prev, ...fieldsToAdd])))

			// Atualiza o objeto de dados principal para incluir as novas chaves (com valor undefined)
			// e notifica o componente pai.
			const updatedData = { ...formData }
			fieldsToAdd.forEach((fieldKey) => {
				updatedData[fieldKey] = undefined
			})
			onDataChange(updatedData)

			setFieldsToAdd([]) // Limpa a seleção
		}
	}

	const removeOptionalField = (fieldKey: string) => {
		// Remove o campo da lista de campos ativos
		setActiveOptionalFields((prev) => prev.filter((f) => f !== fieldKey))

		// Remove a chave do objeto de dados e notifica o componente pai
		const updatedData = { ...formData }
		delete updatedData[fieldKey as keyof NutritionalInfo]
		onDataChange(updatedData)
	}

	const availableOptionalFields = optionalFields.filter((field) => !activeOptionalFields.includes(field.key))
	const optionalFieldOptions = availableOptionalFields.map((field) => ({
		value: field.key,
		label: `${field.label} (${field.unit})`,
	}))

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Apple className="h-5 w-5 text-green-600" />
					Informações Nutricionais
				</CardTitle>
				<CardDescription>Preencha os valores nutricionais do produto.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Informações da Porção */}
				<div className="space-y-4">
					<h4 className="font-medium text-gray-900">Informações da Porção</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="servingSize">Porção de Referência</Label>
							<Input
								id="servingSize"
								name="servingSize"
								value={formData.servingSize || ""}
								onChange={handleChange}
								placeholder="Ex: 100g, 200ml, 1 unidade"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="servingsPerPackage">Quantidade de Porções</Label>
							<Input
								id="servingsPerPackage"
								name="servingsPerPackage"
								type="number"
								step="0.1"
								value={String(formData.servingsPerPackage ?? "")}
								onChange={handleNumericChange}
								placeholder="Ex: 4, 2.5"
							/>
						</div>
					</div>
				</div>

				{/* Campos Obrigatórios */}
				<div className="space-y-4">
					<h4 className="font-medium text-gray-900">Informações Nutricionais Obrigatórias</h4>
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{requiredFields.map((field) => (
							<div key={field.key} className="space-y-2">
								<Label htmlFor={field.key}>{field.label}</Label>
								<Input
									id={field.key}
									name={field.key}
									type="number"
									step="0.1"
									value={String(formData[field.key as keyof NutritionalInfo] ?? "")}
									onChange={handleNumericChange}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Campos Opcionais Ativos */}
				{activeOptionalFields.length > 0 && (
					<div className="space-y-4">
						<h4 className="font-medium text-gray-900">Elementos Nutricionais Adicionais</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{activeOptionalFields.map((fieldKey) => {
								const field = optionalFields.find((f) => f.key === fieldKey)
								if (!field) return null

								return (
									<div key={field.key} className="space-y-2 relative">
										<div className="flex items-center justify-between">
											<Label htmlFor={field.key}>
												{field.label} ({field.unit})
											</Label>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												onClick={() => removeOptionalField(field.key)}
												className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
											>
												<X className="h-3 w-3" />
											</Button>
										</div>
										<Input
											id={field.key}
											name={field.key}
											type="number"
											step="0.1"
											value={String(formData[field.key as keyof NutritionalInfo] ?? "")}
											onChange={handleNumericChange}
										/>
									</div>
								)
							})}
						</div>
					</div>
				)}

				{/* Adicionar Elementos Opcionais */}
				{availableOptionalFields.length > 0 && (
					<div className="space-y-4 pt-4 border-t">
						<h4 className="font-medium text-gray-900">Adicionar Elementos Nutricionais</h4>
						<div className="flex gap-2">
							<MultiSelect
								selected={fieldsToAdd}
								onSelectedChange={setFieldsToAdd}
								options={optionalFieldOptions}
								placeholder="Selecione elementos..."
								className="w-full"
							/>
							<Button type="button" variant="outline" onClick={addOptionalFields} disabled={fieldsToAdd.length === 0}>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* Seção de Alergênicos */}
				<div className="space-y-6 pt-4 border-t">
					<Card className="border-red-200 bg-red-50/50">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-sm text-red-800">
								<AlertTriangle className="h-4 w-4" />
								ALÉRGICOS: CONTÉM
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{commonAllergens.map((allergen) => {
									const isSelected = formData.allergensContains?.includes(allergen)
									return (
										<Button
											key={`contains-${allergen}`}
											type="button"
											variant={isSelected ? "destructive" : "outline"}
											size="sm"
											onClick={() => handleAllergenChange(allergen, "contains")}
										>
											{isSelected && <Check className="mr-2 h-4 w-4" />}
											{allergen}
										</Button>
									)
								})}
							</div>
						</CardContent>
					</Card>

					<Card className="border-orange-200 bg-orange-50/50">
						<CardHeader className="pb-4">
							<CardTitle className="flex items-center gap-2 text-sm text-orange-800">
								<AlertTriangle className="h-4 w-4" />
								ALÉRGICOS: PODE CONTER
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex flex-wrap gap-2">
								{commonAllergens.map((allergen) => {
									const isSelected = formData.allergensMayContain?.includes(allergen)
									return (
										<Button
											key={`may-contain-${allergen}`}
											type="button"
											variant={isSelected ? "secondary" : "outline"}
											size="sm"
											className={cn(
												isSelected && "bg-orange-500 text-white hover:bg-orange-500/90",
												"border-orange-200",
											)}
											onClick={() => handleAllergenChange(allergen, "mayContain")}
										>
											{isSelected && <Check className="mr-2 h-4 w-4" />}
											{allergen}
										</Button>
									)
								})}
							</div>
						</CardContent>
					</Card>
				</div>
			</CardContent>
		</Card>
	)
}
