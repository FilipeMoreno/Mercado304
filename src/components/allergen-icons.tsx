"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
	Milk, 
	Shell, 
	Fish, 
	Nut, 
	Wheat, 
	Sprout, 
	AlertTriangle,
	Cherry,
	Leaf
} from "lucide-react"
import type { NutritionalInfo } from "@/types"

interface AllergenIconsProps {
	nutritionalInfo: NutritionalInfo | null
}

// Mapeamento de alergénicos para ícones do Lucide
const allergenIconMap: { [key: string]: { icon: React.ComponentType<any>, color: string, bgColor: string } } = {
	leite: { icon: Milk, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" },
	lactose: { icon: Milk, color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800" },
	ovos: { icon: Cherry, color: "text-yellow-600 dark:text-yellow-400", bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" },
	peixe: { icon: Fish, color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800" },
	crustáceos: { icon: Shell, color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800" },
	amendoim: { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	soja: { icon: Sprout, color: "text-green-600 dark:text-green-400", bgColor: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" },
	trigo: { icon: Wheat, color: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" },
	centeio: { icon: Wheat, color: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" },
	cevada: { icon: Wheat, color: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" },
	aveia: { icon: Wheat, color: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" },
	glúten: { icon: Wheat, color: "text-yellow-700 dark:text-yellow-300", bgColor: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800" },
	amêndoa: { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	avelã: { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	"castanha-de-caju": { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	"castanha-do-pará": { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	macadâmia: { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	nozes: { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	pecã: { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	pistache: { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
	// Alérgenos genéricos
	frutos: { icon: Leaf, color: "text-red-600 dark:text-red-400", bgColor: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800" },
	"frutos secos": { icon: Nut, color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800" },
}

const AllergenIcon = ({ allergen, variant = "contains" }: { allergen: string, variant?: "contains" | "mayContain" }) => {
	const lowerAllergen = allergen.toLowerCase()
	// Encontra a chave no mapa que corresponde ao alergénico
	const iconKey = Object.keys(allergenIconMap).find((key) => lowerAllergen.includes(key))
	const allergenData = iconKey ? allergenIconMap[iconKey] : { 
		icon: AlertTriangle, 
		color: "text-gray-600 dark:text-gray-400", 
		bgColor: "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800" 
	}
	
	const IconComponent = allergenData.icon
	
	// Estilos diferentes para "contém" vs "pode conter"
	const isContains = variant === "contains"
	const containerClass = isContains 
		? `${allergenData.bgColor} border-2 shadow-sm` 
		: "bg-yellow-50 border-yellow-300 border-2 border-dashed shadow-sm dark:bg-yellow-950 dark:border-yellow-600"
	const iconClass = isContains 
		? allergenData.color 
		: "text-yellow-700 dark:text-yellow-300"

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={`flex h-12 w-12 cursor-default items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md ${containerClass}`}
					>
						<IconComponent className={`h-5 w-5 ${iconClass}`} />
					</div>
				</TooltipTrigger>
				<TooltipContent side="top" className="font-medium">
					<p>{allergen}</p>
					<p className="text-xs text-muted-foreground">
						{isContains ? "Contém" : "Pode conter"}
					</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

export function AllergenIcons({ nutritionalInfo }: AllergenIconsProps) {
	if (!nutritionalInfo) {
		return null
	}

	const { allergensContains = [], allergensMayContain = [] } = nutritionalInfo

	if (allergensContains.length === 0 && allergensMayContain.length === 0) {
		return null
	}

	return (
		<div className="space-y-4">
			{/* Seção "CONTÉM" */}
			{allergensContains.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
						<h4 className="text-sm font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
							Contém
						</h4>
					</div>
					<div className="flex flex-wrap gap-3">
						{allergensContains.map((allergen) => (
							<AllergenIcon key={allergen} allergen={allergen} variant="contains" />
						))}
					</div>
				</div>
			)}

			{/* Seção "PODE CONTER" */}
			{allergensMayContain.length > 0 && (
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
						<h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
							Pode Conter
						</h4>
					</div>
					<div className="flex flex-wrap gap-3">
						{allergensMayContain.map((allergen) => (
							<AllergenIcon key={allergen} allergen={allergen} variant="mayContain" />
						))}
					</div>
				</div>
			)}
		</div>
	)
}