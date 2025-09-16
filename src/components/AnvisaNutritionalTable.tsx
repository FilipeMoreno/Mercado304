"use client"

import type { NutritionalInfo } from "@/types"

interface AnvisaNutritionalTableProps {
	nutritionalInfo: NutritionalInfo | null
}

// Helper para formatar os valores numéricos
const formatValue = (value: number | null | undefined, precision = 0) => {
	if (value === null || typeof value === "undefined") return "-"
	return value.toFixed(precision)
}

// Helper para extrair o valor numérico da porção (ex: "30g" -> 30)
const getServingValue = (servingSize?: string): number => {
	if (!servingSize) return 0
	const match = servingSize.match(/(\d+[.,]?\d*)/)
	return match ? parseFloat(match[1].replace(",", ".")) : 0
}

export function AnvisaNutritionalTable({ nutritionalInfo }: AnvisaNutritionalTableProps) {
	if (!nutritionalInfo) {
		return <p className="text-center text-sm text-muted-foreground py-8">Informações nutricionais não disponíveis.</p>
	}

	const servingValue = getServingValue(nutritionalInfo.servingSize)
	const multiplier = servingValue / 100

	const nutrients = [
		{ label: "Valor energético (kcal)", value100g: nutritionalInfo.calories, unit: "kcal" },
		{ label: "Carboidratos (g)", value100g: nutritionalInfo.carbohydrates, unit: "g" },
		{ label: "Açúcares totais (g)", value100g: nutritionalInfo.totalSugars, unit: "g", indent: true },
		{ label: "Açúcares adicionados (g)", value100g: nutritionalInfo.addedSugars, unit: "g", indent: true },
		{ label: "Lactose (g)", value100g: nutritionalInfo.lactose, unit: "g", indent: true },
		{ label: "Galactose (g)", value100g: nutritionalInfo.galactose, unit: "g", indent: true },
		{ label: "Proteínas (g)", value100g: nutritionalInfo.proteins, unit: "g" },
		{ label: "Gorduras totais (g)", value100g: nutritionalInfo.totalFat, unit: "g" },
		{ label: "Gorduras saturadas (g)", value100g: nutritionalInfo.saturatedFat, unit: "g", indent: true },
		{ label: "Gorduras trans (g)", value100g: nutritionalInfo.transFat, unit: "g", indent: true },
		{ label: "Fibra alimentar (g)", value100g: nutritionalInfo.fiber, unit: "g" },
		{ label: "Sódio (mg)", value100g: nutritionalInfo.sodium, unit: "mg" },
	]

	return (
		<div className="w-full max-w-md mx-auto border-2 border-black font-sans text-black bg-white p-2">
			<h2 className="text-center font-bold text-lg uppercase">Informação Nutricional</h2>
			<p className="text-center text-sm mt-2">
				Porções por embalagem: - <br />
				Porção: {nutritionalInfo.servingSize || "-"}
			</p>
			<div className="border-t-8 border-black my-2"></div>
			<table className="w-full text-left">
				<thead>
					<tr>
						<th className="font-bold pb-1"></th>
						<th className="font-bold pb-1 text-center">100 g</th>
						<th className="font-bold pb-1 text-center">{nutritionalInfo.servingSize || "Porção"}</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-black">
					{nutrients
						.filter((n) => typeof n.value100g !== "undefined" && n.value100g !== null)
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