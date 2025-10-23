"use client"

import type { NutritionalInfo } from "@/types"

interface AnvisaNutritionalTableProps {
	nutritionalInfo: NutritionalInfo | null
}

// Helper para formatar os valores numéricos
const formatValue = (value: number | null | undefined, precision = 1) => {
	if (value === null || typeof value === "undefined" || value === 0) return "0"

	// Usa toLocaleString para formatar no padrão pt-BR
	// e controla os decimais de forma inteligente.
	return value.toLocaleString("pt-BR", {
		minimumFractionDigits: 0, // Não força decimais em números inteiros (ex: 45)
		maximumFractionDigits: precision, // Mostra até 'precision' casas se houver (ex: 42,5)
	})
}

// Helper para extrair o valor numérico da porção (ex: "30g" -> 30)
const getServingValue = (servingSize?: string): number => {
	if (!servingSize) return 100
	const match = servingSize.match(/(\d+[.,]?\d*)/)
	return match ? parseFloat(match[1].replace(",", ".")) : 100
}

// Helper para extrair a unidade da porção (ex: "30g" -> "g", "200ml" -> "ml")
const getServingUnit = (servingSize?: string): string => {
	if (!servingSize) return "g"
	const match = servingSize.match(/\d+[.,]?\d*\s*([a-zA-Z]+)/)
	return match ? match[1] : "g"
}

// Valores de Referência Diários (VD) segundo a ANVISA RDC 429/2020
// Baseado em uma dieta de 2000 kcal
const DAILY_VALUES: Record<string, number> = {
	calories: 2000, // kcal
	carbohydrates: 300, // g
	totalSugars: 50, // g (açúcares totais)
	addedSugars: 50, // g (açúcares adicionados)
	proteins: 75, // g (para crianças >4 anos e adultos)
	totalFat: 55, // g
	saturatedFat: 22, // g
	transFat: 0, // Não possui VD (consumo deve ser o menor possível)
	fiber: 25, // g
	sodium: 2400, // mg
	// Vitaminas
	vitaminA: 600, // mcg
	vitaminD: 5, // mcg
	vitaminC: 45, // mg
	vitaminE: 10, // mg
	vitaminK: 65, // mcg
	thiamine: 1.2, // mg (B1)
	riboflavin: 1.3, // mg (B2)
	niacin: 16, // mg (B3)
	vitaminB6: 1.3, // mg
	folate: 240, // mcg
	vitaminB12: 2.4, // mcg
	biotin: 30, // mcg
	pantothenicAcid: 5, // mg (B5)
	// Minerais
	calcium: 1000, // mg
	iron: 14, // mg
	magnesium: 260, // mg
	phosphorus: 700, // mg
	potassium: 3500, // mg (segundo RDC 54/2012)
	zinc: 7, // mg
	copper: 900, // mcg
	manganese: 2.3, // mg
	selenium: 34, // mcg
	iodine: 130, // mcg
	chromium: 35, // mcg
	molybdenum: 45, // mcg
}

// Helper para calcular o %VD baseado na porção
const calculateVD = (nutrientKey: string, valuePerServing: number | null | undefined): string => {
	if (!valuePerServing || valuePerServing === 0) return "0"

	const dailyValue = DAILY_VALUES[nutrientKey]
	if (!dailyValue || dailyValue === 0) return "**"

	const percentage = (valuePerServing / dailyValue) * 100

	// Formata com no máximo 1 casa decimal
	return percentage.toLocaleString("pt-BR", {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0, // ANVISA usa valores inteiros
	})
}

export function AnvisaNutritionalTable({ nutritionalInfo }: AnvisaNutritionalTableProps) {
	if (!nutritionalInfo) {
		return <p className="text-center text-sm text-muted-foreground py-8">Informações nutricionais não disponíveis.</p>
	}

	const servingValue = getServingValue(nutritionalInfo.servingSize)
	const servingUnit = getServingUnit(nutritionalInfo.servingSize)
	const multiplier = servingValue / 100

	// Nutrientes obrigatórios segundo ANVISA
	const mandatoryNutrients = [
		{ key: "calories", label: "Valor energético", value100g: nutritionalInfo.calories, unit: "kcal", mandatory: true },
		{ key: "carbohydrates", label: "Carboidratos", value100g: nutritionalInfo.carbohydrates, unit: "g", mandatory: true },
		{
			key: "totalSugars",
			label: "Açúcares totais",
			value100g: nutritionalInfo.totalSugars,
			unit: "g",
			indent: true,
			mandatory: false,
		},
		{
			key: "addedSugars",
			label: "Açúcares adicionados",
			value100g: nutritionalInfo.addedSugars,
			unit: "g",
			indent: true,
			mandatory: false,
		},
		{ key: "proteins", label: "Proteínas", value100g: nutritionalInfo.proteins, unit: "g", mandatory: true },
		{ key: "totalFat", label: "Gorduras totais", value100g: nutritionalInfo.totalFat, unit: "g", mandatory: true },
		{
			key: "saturatedFat",
			label: "Gorduras saturadas",
			value100g: nutritionalInfo.saturatedFat,
			unit: "g",
			indent: true,
			mandatory: true,
		},
		{
			key: "transFat",
			label: "Gorduras trans",
			value100g: nutritionalInfo.transFat,
			unit: "g",
			indent: true,
			mandatory: true,
		},
		{ key: "fiber", label: "Fibra alimentar", value100g: nutritionalInfo.fiber, unit: "g", mandatory: true },
		{ key: "sodium", label: "Sódio", value100g: nutritionalInfo.sodium, unit: "mg", mandatory: true },
	]

	// Nutrientes opcionais
	const optionalNutrients = [
		// Outros açúcares
		{ key: "lactose", label: "Lactose", value100g: nutritionalInfo.lactose, unit: "g", indent: true },
		{ key: "galactose", label: "Galactose", value100g: nutritionalInfo.galactose, unit: "g", indent: true },

		// Gorduras detalhadas
		{
			key: "monounsaturatedFat",
			label: "Gorduras monoinsaturadas",
			value100g: nutritionalInfo.monounsaturatedFat,
			unit: "g",
			indent: true,
		},
		{
			key: "polyunsaturatedFat",
			label: "Gorduras poli-insaturadas",
			value100g: nutritionalInfo.polyunsaturatedFat,
			unit: "g",
			indent: true,
		},
		{ key: "cholesterol", label: "Colesterol", value100g: nutritionalInfo.cholesterol, unit: "mg", indent: true },

		// Vitaminas
		{ key: "vitaminA", label: "Vitamina A", value100g: nutritionalInfo.vitaminA, unit: "mcg" },
		{ key: "vitaminC", label: "Vitamina C", value100g: nutritionalInfo.vitaminC, unit: "mg" },
		{ key: "vitaminD", label: "Vitamina D", value100g: nutritionalInfo.vitaminD, unit: "mcg" },
		{ key: "vitaminE", label: "Vitamina E", value100g: nutritionalInfo.vitaminE, unit: "mg" },
		{ key: "vitaminK", label: "Vitamina K", value100g: nutritionalInfo.vitaminK, unit: "mcg" },
		{ key: "thiamine", label: "Tiamina (B1)", value100g: nutritionalInfo.thiamine, unit: "mg" },
		{ key: "riboflavin", label: "Riboflavina (B2)", value100g: nutritionalInfo.riboflavin, unit: "mg" },
		{ key: "niacin", label: "Niacina (B3)", value100g: nutritionalInfo.niacin, unit: "mg" },
		{ key: "vitaminB6", label: "Vitamina B6", value100g: nutritionalInfo.vitaminB6, unit: "mg" },
		{ key: "folate", label: "Folato", value100g: nutritionalInfo.folate, unit: "mcg" },
		{ key: "vitaminB12", label: "Vitamina B12", value100g: nutritionalInfo.vitaminB12, unit: "mcg" },
		{ key: "biotin", label: "Biotina", value100g: nutritionalInfo.biotin, unit: "mcg" },
		{ key: "pantothenicAcid", label: "Ácido Pantotênico (B5)", value100g: nutritionalInfo.pantothenicAcid, unit: "mg" },

		// Minerais
		{ key: "calcium", label: "Cálcio", value100g: nutritionalInfo.calcium, unit: "mg" },
		{ key: "iron", label: "Ferro", value100g: nutritionalInfo.iron, unit: "mg" },
		{ key: "magnesium", label: "Magnésio", value100g: nutritionalInfo.magnesium, unit: "mg" },
		{ key: "phosphorus", label: "Fósforo", value100g: nutritionalInfo.phosphorus, unit: "mg" },
		{ key: "potassium", label: "Potássio", value100g: nutritionalInfo.potassium, unit: "mg" },
		{ key: "zinc", label: "Zinco", value100g: nutritionalInfo.zinc, unit: "mg" },
		{ key: "copper", label: "Cobre", value100g: nutritionalInfo.copper, unit: "mcg" },
		{ key: "manganese", label: "Manganês", value100g: nutritionalInfo.manganese, unit: "mg" },
		{ key: "selenium", label: "Selênio", value100g: nutritionalInfo.selenium, unit: "mcg" },
		{ key: "iodine", label: "Iodo", value100g: nutritionalInfo.iodine, unit: "mcg" },
		{ key: "chromium", label: "Cromo", value100g: nutritionalInfo.chromium, unit: "mcg" },
		{ key: "molybdenum", label: "Molibdênio", value100g: nutritionalInfo.molybdenum, unit: "mcg" },

		// Ácidos graxos especiais
		{ key: "omega3", label: "Ômega 3", value100g: nutritionalInfo.omega3, unit: "mg" },
		{ key: "omega6", label: "Ômega 6", value100g: nutritionalInfo.omega6, unit: "g" },
		{ key: "epa", label: "EPA", value100g: nutritionalInfo.epa, unit: "mg" },
		{ key: "dha", label: "DHA", value100g: nutritionalInfo.dha, unit: "mg" },
		{ key: "linolenicAcid", label: "Ácido Linolênico", value100g: nutritionalInfo.linolenicAcid, unit: "mg" },

		// Outros compostos
		{ key: "taurine", label: "Taurina", value100g: nutritionalInfo.taurine, unit: "mg" },
		{ key: "caffeine", label: "Cafeína", value100g: nutritionalInfo.caffeine, unit: "mg" },
		{ key: "alcoholContent", label: "Teor Alcoólico", value100g: nutritionalInfo.alcoholContent, unit: "%" },
	]

	// Filtra apenas nutrientes com valor (exclui 0, null, undefined)
	const nutrientsToShow = [...mandatoryNutrients, ...optionalNutrients].filter(
		(n) => n.value100g !== null && n.value100g !== undefined && n.value100g > 0,
	)

	// Identifica nutrientes obrigatórios ausentes (sem quantidade significativa)
	const missingMandatoryNutrients = mandatoryNutrients
		.filter((n) => !n.value100g || n.value100g === 0)
		.map((n) => n.label.toLowerCase())

	return (
		<div className="w-full max-w-md mx-auto border-2 border-black font-sans text-black bg-white p-2">
			<h2 className="text-center font-bold text-lg uppercase">Informação Nutricional</h2>
			<p className="text-center text-sm mt-2">
				Porções por embalagem: {nutritionalInfo.servingsPerPackage || "-"}
			</p>
			<p className="text-center text-sm font-semibold">Porção: {nutritionalInfo.servingSize || "-"}</p>
			<div className="border-t-8 border-black my-2"></div>
			<table className="w-full text-left text-xs">
				<thead>
					<tr className="border-b-2 border-black">
						<th className="font-bold pb-1"></th>
						<th className="font-bold pb-1 text-center">100{servingUnit}</th>
						<th className="font-bold pb-1 text-center">{nutritionalInfo.servingSize || "Porção"}</th>
						<th className="font-bold pb-1 text-center">%VD (*)</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-black">
					{nutrientsToShow.map((nutrient, index) => {
						const valuePerServing = (nutrient.value100g || 0) * multiplier
						const vd = calculateVD(nutrient.key, valuePerServing)

						return (
							<tr key={index}>
								<td className={`py-0.5 ${nutrient.indent ? "pl-4 text-xs" : "font-semibold"}`}>{nutrient.label}</td>
								<td className="py-0.5 text-center">
									{formatValue(nutrient.value100g)} {nutrient.unit}
								</td>
								<td className="py-0.5 text-center">
									{formatValue(valuePerServing)} {nutrient.unit}
								</td>
								<td className="py-0.5 text-center font-semibold">{vd}</td>
							</tr>
						)
					})}
				</tbody>
			</table>

			{/* Mensagem sobre nutrientes não significativos */}
			{missingMandatoryNutrients.length > 0 && (
				<div className="mt-2">
					<p className="text-xs leading-tight">
						Não contém quantidades significativas de {missingMandatoryNutrients.join(", ")}.
					</p>
				</div>
			)}

			<hr className="border-t-2 border-black my-2" />

			<p className="text-xs leading-tight">
				Percentual de valores diários fornecidos pela porção.
			</p>
		</div>
	)
}
