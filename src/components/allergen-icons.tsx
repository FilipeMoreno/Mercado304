"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { NutritionalInfo } from "@/types"

interface AllergenIconsProps {
	nutritionalInfo: NutritionalInfo | null
}

// Mapeamento de alergénicos para ícones (emojis)
const allergenIconMap: { [key: string]: string } = {
	leite: "🥛",
	lactose: "🥛",
	ovos: "🥚",
	peixe: "🐟",
	crustáceos: "🦐",
	amendoim: "🥜",
	soja: "🌱",
	trigo: "🌾",
	centeio: "🌾",
	cevada: "🌾",
	aveia: "🌾",
	glúten: "🌾",
	amêndoa: "🌰",
	avelã: "🌰",
	"castanha-de-caju": "🌰",
	"castanha-do-pará": "🌰",
	macadâmia: "🌰",
	nozes: "🌰",
	pecã: "🌰",
	pistache: "🌰",
}

const AllergenIcon = ({ allergen }: { allergen: string }) => {
	const lowerAllergen = allergen.toLowerCase()
	// Encontra a chave no mapa que corresponde ao alergénico
	const iconKey = Object.keys(allergenIconMap).find((key) => lowerAllergen.includes(key))
	const icon = iconKey ? allergenIconMap[iconKey] : "❓"

	return (
		<TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="flex h-10 w-10 cursor-default items-center justify-center rounded-full p-0 text-xl"
            >
              {icon}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{allergen}</p>
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
  <>
				{allergensContains.length > 0 && (

						<div className="flex flex-wrap gap-2">
							{allergensContains.map((allergen) => (
								<AllergenIcon key={allergen} allergen={allergen} />
							))}
						</div>

				)}

				{/* Seção "PODE CONTER" */}
				{allergensMayContain.length > 0 && (

						<div className="flex flex-wrap gap-2">
							{allergensMayContain.map((allergen) => (
								<AllergenIcon key={allergen} allergen={allergen} />
							))}
						</div>
				)}
  </>
	)
}