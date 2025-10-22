"use client"

import { AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { NutritionalInfo } from "@/types"
import {
	AlmondIcon,
	BarleyIcon,
	BrazilNutIcon,
	CashewIcon,
	CrustaceanIcon,
	EggIcon,
	FishIcon,
	GlutenIcon,
	HazelnutIcon,
	LatexIcon,
	MacadamiaIcon,
	MilkIcon,
	OatIcon,
	PeanutIcon,
	PecanIcon,
	PistachioIcon,
	RyeIcon,
	SoyIcon,
	type SvgWrapperProps,
	TriticaleIcon,
	WalnutsIcon,
	WheatIcon,
} from "./AllergenIcons"

interface AllergenIconsProps {
	nutritionalInfo: NutritionalInfo | null
}

// Allergen categories for organization
export const ALLERGEN_CATEGORIES = {
	dairy: { name: "Laticínios", color: "blue", emoji: "🥛" },
	eggs: { name: "Ovos", color: "purple", emoji: "🥚" },
	fish: { name: "Frutos do Mar - Peixes", color: "cyan", emoji: "🐟" },
	shellfish: { name: "Frutos do Mar - Crustáceos", color: "orange", emoji: "🦐" },
	nuts: { name: "Nozes e Castanhas", color: "brown", emoji: "🌰" },
	peanuts: { name: "Amendoim", color: "amber", emoji: "🥜" },
	grains: { name: "Cereais com Glúten", color: "yellow", emoji: "🌾" },
	soy: { name: "Soja", color: "green", emoji: "🌱" },
	latex: { name: "Látex", color: "gray", emoji: "💧" },
} as const

// Color schemes for each allergen type
const allergenColorMap: Record<
	string,
	{
		icon: React.FC<SvgWrapperProps>
		category: keyof typeof ALLERGEN_CATEGORIES
		color: string
		bgColor: string
		borderColor: string
		hoverBg: string
		description: string
	}
> = {
	// Laticínios
	leite: {
		icon: MilkIcon,
		category: "dairy",
		color: "text-blue-700 dark:text-blue-300",
		bgColor: "bg-blue-50 dark:bg-blue-950/50",
		borderColor: "border-blue-200 dark:border-blue-800",
		hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/70",
		description: "Leite e derivados lácteos",
	},
	lactose: {
		icon: MilkIcon,
		category: "dairy",
		color: "text-blue-700 dark:text-blue-300",
		bgColor: "bg-blue-50 dark:bg-blue-950/50",
		borderColor: "border-blue-200 dark:border-blue-800",
		hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900/70",
		description: "Açúcar natural do leite",
	},

	// Ovos
	ovos: {
		icon: EggIcon,
		category: "eggs",
		color: "text-purple-700 dark:text-purple-300",
		bgColor: "bg-purple-50 dark:bg-purple-950/50",
		borderColor: "border-purple-200 dark:border-purple-800",
		hoverBg: "hover:bg-purple-100 dark:hover:bg-purple-900/70",
		description: "Ovos e produtos derivados",
	},

	// Frutos do mar - Peixes
	peixe: {
		icon: FishIcon,
		category: "fish",
		color: "text-cyan-700 dark:text-cyan-300",
		bgColor: "bg-cyan-50 dark:bg-cyan-950/50",
		borderColor: "border-cyan-200 dark:border-cyan-800",
		hoverBg: "hover:bg-cyan-100 dark:hover:bg-cyan-900/70",
		description: "Peixes e derivados",
	},

	// Frutos do mar - Crustáceos
	crustáceos: {
		icon: CrustaceanIcon,
		category: "shellfish",
		color: "text-orange-700 dark:text-orange-300",
		bgColor: "bg-orange-50 dark:bg-orange-950/50",
		borderColor: "border-orange-200 dark:border-orange-800",
		hoverBg: "hover:bg-orange-100 dark:hover:bg-orange-900/70",
		description: "Camarão, caranguejo, lagosta",
	},
	crustaceos: {
		icon: CrustaceanIcon,
		category: "shellfish",
		color: "text-orange-700 dark:text-orange-300",
		bgColor: "bg-orange-50 dark:bg-orange-950/50",
		borderColor: "border-orange-200 dark:border-orange-800",
		hoverBg: "hover:bg-orange-100 dark:hover:bg-orange-900/70",
		description: "Camarão, caranguejo, lagosta",
	},

	// Amendoim (leguminosa)
	amendoim: {
		icon: PeanutIcon,
		category: "peanuts",
		color: "text-amber-800 dark:text-amber-200",
		bgColor: "bg-amber-50 dark:bg-amber-950/50",
		borderColor: "border-amber-300 dark:border-amber-700",
		hoverBg: "hover:bg-amber-100 dark:hover:bg-amber-900/70",
		description: "Amendoim (leguminosa)",
	},

	// Soja
	soja: {
		icon: SoyIcon,
		category: "soy",
		color: "text-green-700 dark:text-green-300",
		bgColor: "bg-green-50 dark:bg-green-950/50",
		borderColor: "border-green-200 dark:border-green-800",
		hoverBg: "hover:bg-green-100 dark:hover:bg-green-900/70",
		description: "Soja e derivados",
	},

	// Cereais com glúten
	trigo: {
		icon: WheatIcon,
		category: "grains",
		color: "text-yellow-700 dark:text-yellow-300",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
		borderColor: "border-yellow-300 dark:border-yellow-700",
		hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70",
		description: "Cereal com glúten",
	},
	centeio: {
		icon: RyeIcon,
		category: "grains",
		color: "text-yellow-700 dark:text-yellow-300",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
		borderColor: "border-yellow-300 dark:border-yellow-700",
		hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70",
		description: "Cereal com glúten",
	},
	cevada: {
		icon: BarleyIcon,
		category: "grains",
		color: "text-yellow-700 dark:text-yellow-300",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
		borderColor: "border-yellow-300 dark:border-yellow-700",
		hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70",
		description: "Cereal com glúten",
	},
	aveia: {
		icon: OatIcon,
		category: "grains",
		color: "text-yellow-700 dark:text-yellow-300",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
		borderColor: "border-yellow-300 dark:border-yellow-700",
		hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70",
		description: "Pode conter glúten por contaminação cruzada",
	},
	glúten: {
		icon: GlutenIcon,
		category: "grains",
		color: "text-yellow-700 dark:text-yellow-300",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
		borderColor: "border-yellow-300 dark:border-yellow-700",
		hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70",
		description: "Proteína presente em cereais",
	},
	gluten: {
		icon: GlutenIcon,
		category: "grains",
		color: "text-yellow-700 dark:text-yellow-300",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
		borderColor: "border-yellow-300 dark:border-yellow-700",
		hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70",
		description: "Proteína presente em cereais",
	},
	triticale: {
		icon: TriticaleIcon,
		category: "grains",
		color: "text-yellow-700 dark:text-yellow-300",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/50",
		borderColor: "border-yellow-300 dark:border-yellow-700",
		hoverBg: "hover:bg-yellow-100 dark:hover:bg-yellow-900/70",
		description: "Híbrido de trigo e centeio",
	},

	// Nozes e castanhas
	amêndoa: {
		icon: AlmondIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	amendoa: {
		icon: AlmondIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	avelã: {
		icon: HazelnutIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	avela: {
		icon: HazelnutIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	"castanha-de-caju": {
		icon: CashewIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	"castanha de caju": {
		icon: CashewIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	"castanha-do-pará": {
		icon: BrazilNutIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	"castanha-do-para": {
		icon: BrazilNutIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	"castanha do pará": {
		icon: BrazilNutIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	macadâmia: {
		icon: MacadamiaIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	macadamia: {
		icon: MacadamiaIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	nozes: {
		icon: WalnutsIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	pecã: {
		icon: PecanIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	peca: {
		icon: PecanIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},
	pistache: {
		icon: PistachioIcon,
		category: "nuts",
		color: "text-stone-700 dark:text-stone-300",
		bgColor: "bg-stone-50 dark:bg-stone-950/50",
		borderColor: "border-stone-300 dark:border-stone-700",
		hoverBg: "hover:bg-stone-100 dark:hover:bg-stone-900/70",
		description: "Fruto seco oleaginoso",
	},

	// Látex
	látex: {
		icon: LatexIcon,
		category: "latex",
		color: "text-gray-700 dark:text-gray-300",
		bgColor: "bg-gray-50 dark:bg-gray-950/50",
		borderColor: "border-gray-200 dark:border-gray-800",
		hoverBg: "hover:bg-gray-100 dark:hover:bg-gray-900/70",
		description: "Látex natural",
	},
	latex: {
		icon: LatexIcon,
		category: "latex",
		color: "text-gray-700 dark:text-gray-300",
		bgColor: "bg-gray-50 dark:bg-gray-950/50",
		borderColor: "border-gray-200 dark:border-gray-800",
		hoverBg: "hover:bg-gray-100 dark:hover:bg-gray-900/70",
		description: "Látex natural",
	},
}

const AllergenIcon = ({
	allergen,
	variant = "contains",
}: {
	allergen: string
	variant?: "contains" | "mayContain"
}) => {
	const lowerAllergen = allergen.toLowerCase().trim()

	// Find matching allergen in the map
	const iconKey = Object.keys(allergenColorMap).find((key) => lowerAllergen.includes(key))
	const allergenData = iconKey
		? allergenColorMap[iconKey]
		: {
				icon: AlertTriangle,
				category: "latex" as const,
				color: "text-gray-700 dark:text-gray-300",
				bgColor: "bg-gray-50 dark:bg-gray-950/50",
				borderColor: "border-gray-200 dark:border-gray-800",
				hoverBg: "hover:bg-gray-100 dark:hover:bg-gray-900/70",
				description: "Alergênico não catalogado",
			}

	const IconComponent = allergenData!.icon as React.FC<SvgWrapperProps>
	const category = ALLERGEN_CATEGORIES[allergenData!.category]

	// Different styles for "contains" vs "may contain"
	const isContains = variant === "contains"

	// Modern gradient background for "contains"
	const containerClass = isContains
		? `${allergenData!.bgColor} ${allergenData!.borderColor} ${allergenData!.hoverBg} border-2 shadow-xs`
		: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30 border-2 border-dashed border-yellow-400 dark:border-yellow-600 shadow-xs hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-950/50 dark:hover:to-orange-950/50"

	const iconClass = isContains ? allergenData!.color : "text-yellow-800 dark:text-yellow-200"

	return (
		<TooltipProvider delayDuration={150}>
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={`group relative flex h-14 w-14 cursor-default items-center justify-center rounded-2xl transition-all duration-300 ease-out hover:scale-110 hover:shadow-lg hover:-translate-y-0.5 ${containerClass}`}
					>
						<IconComponent
							size={24}
							variant="outline"
							className={`${iconClass} transition-transform group-hover:scale-110`}
						/>
						{/* Glow effect on hover */}
						<div className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-20 bg-gradient-to-br from-white to-transparent dark:from-white dark:to-transparent" />
					</div>
				</TooltipTrigger>
				<TooltipContent
					side="top"
					className="max-w-xs px-4 py-3 bg-white/98 dark:bg-gray-900/98 backdrop-blur-md border-2 shadow-xl"
				>
					<div className="space-y-2">
						<div className="flex items-center justify-between gap-3">
							<p className="font-bold text-base">{allergen}</p>
							<Badge variant={isContains ? "destructive" : "secondary"} className="text-xs px-2 py-0.5">
								{isContains ? "⚠️ Contém" : "⚡ Pode conter"}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground leading-relaxed">{allergenData!.description}</p>
						<div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
							<div className="flex items-center gap-1.5">
								<span className="text-sm">{category.emoji}</span>
								<span className="text-xs font-medium text-muted-foreground">{category.name}</span>
							</div>
							<Link
								href="/alergenicos"
								className="flex items-center gap-1 text-xs font-medium text-primary hover:underline transition-colors"
							>
								Veja mais
								<ExternalLink className="h-3 w-3" />
							</Link>
						</div>
					</div>
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
		<div className="space-y-6">
			{/* Seção "CONTÉM" */}
			{allergensContains.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center gap-2.5">
						<div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/50">
							<AlertTriangle className="h-4.5 w-4.5 text-red-600 dark:text-red-400" />
						</div>
						<h4 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
							Contém Alergênicos
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
				<div className="space-y-4">
					<div className="flex items-center gap-2.5">
						<div className="flex size-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950/50">
							<AlertTriangle className="h-4.5 w-4.5 text-yellow-600 dark:text-yellow-400" />
						</div>
						<h4 className="text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
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
