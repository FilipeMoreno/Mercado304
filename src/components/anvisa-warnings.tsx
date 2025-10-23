"use client"

import { cn } from "@/lib/utils"
import type { NutritionalInfo } from "@/types"

interface AnvisaWarningsProps {
	nutritionalInfo: NutritionalInfo | null
	unit: string
	/** Define o layout dos alertas.
	 * - `vertical`: Blocos empilhados verticalmente (padrão).
	 * - `horizontal-stacked`: Bloco "ALTO EM" à esquerda, nutrientes empilhados à direita.
	 * - `horizontal-inline`: Uma etiqueta individual e completa para cada nutriente.
	 */
	layout?: "vertical" | "horizontal-stacked" | "horizontal-inline"
}

// Subcomponente para a Lupa e o texto "ALTO EM"
const LupaHeader = ({ className }: { className?: string }) => (
	<div
		className={cn(
			"flex h-full items-center gap-1.5 border border-red-300 bg-red-50 px-2 py-1.5 text-red-700 rounded-l-md",
			"dark:border-red-600 dark:bg-red-950/30 dark:text-red-300", // Estilos para o Dark Mode
			className,
		)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="h-4 w-4 flex-shrink-0"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<span className="block font-semibold text-xs leading-tight">ALTO EM</span>
	</div>
)

// Subcomponente para cada nutriente
const NutrientBlock = ({ nutrient, className }: { nutrient: string; className?: string }) => (
	<div
		className={cn(
			"border border-red-300 bg-red-100 px-2 py-1.5 text-center text-red-800 rounded-r-md",
			"dark:border-red-600 dark:bg-red-900/50 dark:text-red-200", // Estilos para o Dark Mode
			className,
		)}
	>
		<span className="block font-semibold text-xs leading-tight">{nutrient}</span>
	</div>
)

// Subcomponente para uma etiqueta de alerta individual completa
const IndividualWarningLabel = ({ nutrient }: { nutrient: string }) => (
	<div className="inline-flex items-stretch font-sans">
		<LupaHeader />
		<NutrientBlock nutrient={nutrient} className="-ml-px" />
	</div>
)

export function AnvisaWarnings({ nutritionalInfo, unit, layout = "vertical" }: AnvisaWarningsProps) {
	if (!nutritionalInfo) return null

	const warnings: string[] = []
	const isLiquid = ["ml", "litro"].includes(unit.toLowerCase())

	// Thresholds da ANVISA são por porção de consumo, não por 100g/ml
	// Nossos dados do DB são por 100g/ml, então precisamos converter para a porção
	const thresholds = {
		addedSugars: isLiquid ? 7.5 : 15,
		saturatedFat: isLiquid ? 3 : 6,
		sodium: isLiquid ? 300 : 600,
	}

	// Helper para extrair o valor numérico da porção (ex: "30g" -> 30)
	const getServingValue = (servingSize?: string): number => {
		if (!servingSize) return 100 // Se não há porção definida, usa 100g/ml como padrão
		const match = servingSize.match(/(\d+[.,]?\d*)/)
		return match ? parseFloat(match[1].replace(",", ".")) : 100
	}

	// Converte valores de 100g/ml para a porção real
	const servingValue = getServingValue(nutritionalInfo.servingSize)
	const multiplier = servingValue / 100

	// Converte os valores para a porção e compara com os thresholds
	if (nutritionalInfo.addedSugars && nutritionalInfo.addedSugars > 0) {
		const addedSugarsPerServing = nutritionalInfo.addedSugars * multiplier
		console.log("DEBUG ANVISA - Açúcar Adicionado:", {
			value100g: nutritionalInfo.addedSugars,
			servingSize: nutritionalInfo.servingSize,
			multiplier,
			valuePerServing: addedSugarsPerServing,
			threshold: thresholds.addedSugars,
			isHigh: addedSugarsPerServing >= thresholds.addedSugars,
		})
		if (addedSugarsPerServing >= thresholds.addedSugars) {
			warnings.push("AÇÚCAR ADICIONADO")
		}
	}

	if (nutritionalInfo.saturatedFat && nutritionalInfo.saturatedFat > 0) {
		const saturatedFatPerServing = nutritionalInfo.saturatedFat * multiplier
		console.log("DEBUG ANVISA - Gordura Saturada:", {
			value100g: nutritionalInfo.saturatedFat,
			servingSize: nutritionalInfo.servingSize,
			multiplier,
			valuePerServing: saturatedFatPerServing,
			threshold: thresholds.saturatedFat,
			isHigh: saturatedFatPerServing >= thresholds.saturatedFat,
		})
		if (saturatedFatPerServing >= thresholds.saturatedFat) {
			warnings.push("GORDURA SATURADA")
		}
	}

	if (nutritionalInfo.sodium && nutritionalInfo.sodium > 0) {
		const sodiumPerServing = nutritionalInfo.sodium * multiplier
		console.log("DEBUG ANVISA - Sódio:", {
			value100g: nutritionalInfo.sodium,
			servingSize: nutritionalInfo.servingSize,
			multiplier,
			valuePerServing: sodiumPerServing,
			threshold: thresholds.sodium,
			isHigh: sodiumPerServing >= thresholds.sodium,
			unit,
			isLiquid,
		})
		if (sodiumPerServing >= thresholds.sodium) {
			warnings.push("SÓDIO")
		}
	}

	if (warnings.length === 0) return null

	let content = null

	if (layout === "horizontal-inline") {
		content = (
			<div className="flex flex-wrap items-center gap-2">
				{warnings.map((warning) => (
					<IndividualWarningLabel key={warning} nutrient={warning} />
				))}
			</div>
		)
	} else if (layout === "vertical") {
		content = (
			<div className="inline-flex flex-col font-sans">
				<div className="flex items-stretch">
					<LupaHeader className="border-r-0" />
					<NutrientBlock nutrient={warnings[0]} className="flex-grow" />
				</div>
				{warnings.slice(1).map((warning) => (
					<NutrientBlock key={warning} nutrient={warning} className="-mt-[2px]" />
				))}
			</div>
		)
	} else if (layout === "horizontal-stacked") {
		content = (
			<div className="inline-flex items-stretch font-sans">
				<LupaHeader />
				<div className="flex flex-col">
					{warnings.map((warning, index) => (
						<NutrientBlock key={warning} className={cn("border-l-0", index > 0 && "-mt-[2px]")} nutrient={warning} />
					))}
				</div>
			</div>
		)
	}

	return <div className="my-6">{content}</div>
}
