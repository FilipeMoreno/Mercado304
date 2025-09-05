"use client";

import { NutritionalInfo } from "@/types";
import { cn } from "@/lib/utils";

interface AnvisaWarningsProps {
	nutritionalInfo: NutritionalInfo | null;
	unit: string;
	/** Define o layout dos alertas.
	 * - `vertical`: Blocos empilhados verticalmente (padrão).
	 * - `horizontal-stacked`: Bloco "ALTO EM" à esquerda, nutrientes empilhados à direita.
	 * - `horizontal-inline`: Uma etiqueta individual e completa para cada nutriente.
	 */
	layout?: "vertical" | "horizontal-stacked" | "horizontal-inline";
}

// Subcomponente para a Lupa e o texto "ALTO EM"
const LupaHeader = ({ className }: { className?: string }) => (
	<div
		className={cn(
			"flex h-full items-center gap-1 border-2 border-black bg-white p-2 text-black",
			"dark:border-white dark:bg-zinc-800 dark:text-white", // Estilos para o Dark Mode
			className,
		)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="3"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="h-6 w-6 flex-shrink-0"
		>
			<circle cx="11" cy="11" r="8" />
			<line x1="21" y1="21" x2="16.65" y2="16.65" />
		</svg>
		<span className="block font-extrabold text-xs leading-tight">ALTO EM</span>
	</div>
);

// Subcomponente para cada nutriente
const NutrientBlock = ({
	nutrient,
	className,
}: {
	nutrient: string;
	className?: string;
}) => (
	<div
		className={cn(
			"border-2 border-black bg-black p-2 text-center text-white",
			"dark:border-white dark:bg-white dark:text-black", // Estilos para o Dark Mode
			className,
		)}
	>
		<span className="block font-extrabold text-sm leading-tight">
			{nutrient}
		</span>
	</div>
);

// Subcomponente para uma etiqueta de alerta individual completa
const IndividualWarningLabel = ({ nutrient }: { nutrient: string }) => (
	<div className="inline-flex items-stretch font-sans">
		<LupaHeader />
		<NutrientBlock nutrient={nutrient} className="-ml-[2px]" />
	</div>
);


export function AnvisaWarnings({
	nutritionalInfo,
	unit,
	layout = "vertical",
}: AnvisaWarningsProps) {
	if (!nutritionalInfo) return null;

	const warnings: string[] = [];
	const isLiquid = ["ml", "litro"].includes(unit.toLowerCase());

	const thresholds = {
		addedSugars: isLiquid ? 7.5 : 15,
		saturatedFat: isLiquid ? 3 : 6,
		sodium: isLiquid ? 300 : 600,
	};

	if (
		nutritionalInfo.addedSugars &&
		nutritionalInfo.addedSugars >= thresholds.addedSugars
	) {
		warnings.push("AÇÚCAR ADICIONADO");
	}
	if (
		nutritionalInfo.saturatedFat &&
		nutritionalInfo.saturatedFat >= thresholds.saturatedFat
	) {
		warnings.push("GORDURA SATURADA");
	}
	if (nutritionalInfo.sodium && nutritionalInfo.sodium >= thresholds.sodium) {
		warnings.push("SÓDIO");
	}

	if (warnings.length === 0) return null;

	let content = null;

	if (layout === "horizontal-inline") {
		content = (
			<div className="flex flex-wrap items-center gap-2">
				{warnings.map((warning) => (
					<IndividualWarningLabel key={warning} nutrient={warning} />
				))}
			</div>
		);
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
		);
	} else if (layout === "horizontal-stacked") {
		content = (
			<div className="inline-flex items-stretch font-sans">
				<LupaHeader />
				<div className="flex flex-col">
					{warnings.map((warning, index) => (
						<NutrientBlock
							key={warning}
							className={cn("border-l-0", index > 0 && "-mt-[2px]")}
							nutrient={warning}
						/>
					))}
				</div>
			</div>
		);
	}

	return <div className="my-4">{content}</div>;
}