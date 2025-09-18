"use client"

import type { NutritionalInfo } from "@/types"

interface AnvisaNutritionalTableProps {
	nutritionalInfo: NutritionalInfo | null
}

// Helper para formatar os valores numéricos
const formatValue = (value: number | null | undefined, precision = 1) => {
	if (value === null || typeof value === "undefined") return "-"

	// Usa toLocaleString para formatar no padrão pt-BR
	// e controla os decimais de forma inteligente.
	return value.toLocaleString("pt-BR", {
		minimumFractionDigits: 0, // Não força decimais em números inteiros (ex: 45)
		maximumFractionDigits: precision, // Mostra até 'precision' casas se houver (ex: 42,5)
	})
}

// Helper para extrair o valor numérico da porção (ex: "30g" -> 30)
const getServingValue = (servingSize?: string): number => {
	if (!servingSize) return 0
	const match = servingSize.match(/(\d+[.,]?\d*)/)
	return match ? parseFloat(match[1].replace(",", ".")) : 0
}

// Helper para extrair a unidade da porção (ex: "30g" -> "g", "200ml" -> "ml")
const getServingUnit = (servingSize?: string): string => {
	if (!servingSize) return "g"
	const match = servingSize.match(/\d+[.,]?\d*\s*([a-zA-Z]+)/)
	return match ? match[1] : "g"
}

export function AnvisaNutritionalTable({ nutritionalInfo }: AnvisaNutritionalTableProps) {
	if (!nutritionalInfo) {
		return <p className="text-center text-sm text-muted-foreground py-8">Informações nutricionais não disponíveis.</p>
	}

	const servingValue = getServingValue(nutritionalInfo.servingSize)
	const servingUnit = getServingUnit(nutritionalInfo.servingSize)
	const multiplier = servingValue / 100

	const nutrients = [
		// Informações obrigatórias
		{ label: "Valor energético (kcal)", value100g: nutritionalInfo.calories, unit: "kcal" },
		{ label: "Carboidratos (g)", value100g: nutritionalInfo.carbohydrates, unit: "g" },
		{ label: "Açúcares totais (g)", value100g: nutritionalInfo.totalSugars, unit: "g", indent: true },
		{ label: "Açúcares adicionados (g)", value100g: nutritionalInfo.addedSugars, unit: "g", indent: true },
		{ label: "Lactose (g)", value100g: nutritionalInfo.lactose, unit: "g", indent: true },
		{ label: "Galactose (g)", value100g: nutritionalInfo.galactose, unit: "g", indent: true },
		{ label: "Proteínas (g)", value100g: nutritionalInfo.proteins, unit: "g" },
		{ label: "Gorduras totais (g)", value100g: nutritionalInfo.totalFat, unit: "g" },
		{ label: "Gorduras saturadas (g)", value100g: nutritionalInfo.saturatedFat, unit: "g", indent: true },
		{ label: "Gorduras monoinsaturadas (g)", value100g: nutritionalInfo.monounsaturatedFat, unit: "g", indent: true },
		{ label: "Gorduras poli-insaturadas (g)", value100g: nutritionalInfo.polyunsaturatedFat, unit: "g", indent: true },
		{ label: "Gorduras trans (g)", value100g: nutritionalInfo.transFat, unit: "g", indent: true },
		{ label: "Colesterol (mg)", value100g: nutritionalInfo.cholesterol, unit: "mg", indent: true },
		{ label: "Fibra alimentar (g)", value100g: nutritionalInfo.fiber, unit: "g" },
		{ label: "Sódio (mg)", value100g: nutritionalInfo.sodium, unit: "mg" },

		// Vitaminas
		{ label: "Vitamina A (mcg)", value100g: nutritionalInfo.vitaminA, unit: "mcg" },
		{ label: "Vitamina C (mg)", value100g: nutritionalInfo.vitaminC, unit: "mg" },
		{ label: "Vitamina D (mcg)", value100g: nutritionalInfo.vitaminD, unit: "mcg" },
		{ label: "Vitamina E (mg)", value100g: nutritionalInfo.vitaminE, unit: "mg" },
		{ label: "Vitamina K (mcg)", value100g: nutritionalInfo.vitaminK, unit: "mcg" },
		{ label: "Tiamina - B1 (mg)", value100g: nutritionalInfo.thiamine, unit: "mg" },
		{ label: "Riboflavina - B2 (mg)", value100g: nutritionalInfo.riboflavin, unit: "mg" },
		{ label: "Niacina - B3 (mg)", value100g: nutritionalInfo.niacin, unit: "mg" },
		{ label: "Vitamina B6 (mg)", value100g: nutritionalInfo.vitaminB6, unit: "mg" },
		{ label: "Folato (mcg)", value100g: nutritionalInfo.folate, unit: "mcg" },
		{ label: "Vitamina B12 (mcg)", value100g: nutritionalInfo.vitaminB12, unit: "mcg" },
		{ label: "Biotina (mcg)", value100g: nutritionalInfo.biotin, unit: "mcg" },
		{ label: "Ácido Pantotênico - B5 (mg)", value100g: nutritionalInfo.pantothenicAcid, unit: "mg" },

		// Minerais
		{ label: "Cálcio (mg)", value100g: nutritionalInfo.calcium, unit: "mg" },
		{ label: "Ferro (mg)", value100g: nutritionalInfo.iron, unit: "mg" },
		{ label: "Magnésio (mg)", value100g: nutritionalInfo.magnesium, unit: "mg" },
		{ label: "Fósforo (mg)", value100g: nutritionalInfo.phosphorus, unit: "mg" },
		{ label: "Potássio (mg)", value100g: nutritionalInfo.potassium, unit: "mg" },
		{ label: "Zinco (mg)", value100g: nutritionalInfo.zinc, unit: "mg" },
		{ label: "Cobre (mg)", value100g: nutritionalInfo.copper, unit: "mg" },
		{ label: "Manganês (mg)", value100g: nutritionalInfo.manganese, unit: "mg" },
		{ label: "Selênio (mcg)", value100g: nutritionalInfo.selenium, unit: "mcg" },
		{ label: "Iodo (mcg)", value100g: nutritionalInfo.iodine, unit: "mcg" },
		{ label: "Cromo (mcg)", value100g: nutritionalInfo.chromium, unit: "mcg" },
		{ label: "Molibdênio (mcg)", value100g: nutritionalInfo.molybdenum, unit: "mcg" },

		// Ácidos graxos especiais
		{ label: "Ômega 3 (mg)", value100g: nutritionalInfo.omega3, unit: "mg" },
		{ label: "Ômega 6 (g)", value100g: nutritionalInfo.omega6, unit: "g" },
		{ label: "EPA (mg)", value100g: nutritionalInfo.epa, unit: "mg" },
		{ label: "DHA (mg)", value100g: nutritionalInfo.dha, unit: "mg" },
		{ label: "Ácido Linolênico (mg)", value100g: nutritionalInfo.linolenicAcid, unit: "mg" },

		// Outros compostos
		{ label: "Taurina (mg)", value100g: nutritionalInfo.taurine, unit: "mg" },
		{ label: "Cafeína (mg)", value100g: nutritionalInfo.caffeine, unit: "mg" },
		{ label: "Teor Alcoólico (%)", value100g: nutritionalInfo.alcoholContent, unit: "%" },
	]

	return (
		<div className="w-full max-w-md mx-auto border-2 border-black font-sans text-black bg-white p-2">
			<h2 className="text-center font-bold text-lg uppercase">Informação Nutricional</h2>
			<p className="text-center text-sm mt-2">
				Porções por embalagem: {nutritionalInfo.servingsPerPackage || "-"} <br />
				Porção: {nutritionalInfo.servingSize || "-"}
			</p>
			<div className="border-t-8 border-black my-2"></div>
			<table className="w-full text-left">
				<thead>
					<tr>
						<th className="font-bold pb-1"></th>
						<th className="font-bold pb-1 text-center">100 {servingUnit}</th>
						<th className="font-bold pb-1 text-center">{nutritionalInfo.servingSize || "Porção"}</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-black">
					{nutrients
						.filter((n) => typeof n.value100g !== "undefined" && n.value100g !== null && n.value100g !== 0)
						.map((nutrient, index) => (
							<tr key={index}>
								<td className={`py-0.5 ${nutrient.indent ? "pl-4" : "font-semibold"}`}>{nutrient.label}</td>
								<td className="py-0.5 text-center">{formatValue(nutrient.value100g)}</td>
								<td className="py-0.5 text-center">{formatValue((nutrient.value100g || 0) * multiplier)}</td>
							</tr>
						))}
				</tbody>
			</table>
			<div className="border-t-2 border-black my-2"></div>
			<p className="text-xs">*Percentual de valores diários fornecidos pela porção.</p>
		</div>
	)
}
