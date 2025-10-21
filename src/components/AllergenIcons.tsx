/**
 * Minimal, flat, neutral SVG allergen icons set
 *
 * Exports:
 * - default: AllergenIcon ({type, size, variant, className, title})
 * - individual icon components: AlmondIcon, PeanutIcon, OatIcon, HazelnutIcon, CashewIcon,
 *   BrazilNutIcon, RyeIcon, BarleyIcon, CrustaceanIcon, GlutenIcon, LatexIcon, MilkIcon,
 *   MacadamiaIcon, WalnutsIcon, EggIcon, PecanIcon, FishIcon, PistachioIcon, SoyIcon,
 *   WheatIcon, TriticaleIcon
 */

import type React from "react"

const ICON_SIZE = 24

export interface SvgWrapperProps {
	children?: React.ReactNode
	size?: number
	variant?: "outline" | "filled"
	className?: string
	title?: string
}

const SvgWrapper: React.FC<SvgWrapperProps> = ({
	children,
	size = ICON_SIZE,
	variant = "outline",
	className = "",
	title,
}) => {
	const isOutline = variant === "outline"
	const strokeWidth = 1.6
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill={isOutline ? "none" : "currentColor"}
			stroke={isOutline ? "currentColor" : "none"}
			strokeWidth={isOutline ? strokeWidth : 0}
			strokeLinecap="round"
			strokeLinejoin="round"
			className={className}
			aria-hidden={!title}
			role={title ? "img" : "presentation"}
			xmlns="http://www.w3.org/2000/svg"
		>
			{title ? <title>{title}</title> : null}
			{children}
		</svg>
	)
}

// 1. Amêndoa (Almond)
export const AlmondIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M4.5 12c0-3 4-7 10-7 1.5 0 3.2.5 4 1.3C18.2 8 15 14 12 15.5 9.5 16.7 6 16 4.5 12z" />
	</SvgWrapper>
)

// 2. Amendoim (Peanut)
export const PeanutIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M6 9c-.8-1.2-1-2 0-3s2-1 3 0c1 1 1.5 1.2 3 1 1.5-.2 2-.8 3-1 1.3-.3 2 .3 2 1.5s-.7 2.2-1.5 2.8c-1 .8-2 1-2.2 2-.2 1.2.3 2.8 0 3.5-.6 1.3-1.6 1.6-2.8 1.2-1.5-.5-2-1.8-3-2.5C8.6 15 6.5 13 6 9z" />
	</SvgWrapper>
)

// 3. Aveia (Oat)
export const OatIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M12 3v18" />
		<path d="M8 6c2 1 3 2 4 3s2 2.5 4 3" />
		<path d="M16 9c1 2 1.5 3.5 1 5" />
	</SvgWrapper>
)

// 4. Avelã (Hazelnut)
export const HazelnutIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<circle cx="12" cy="12" r="6" />
		<path
			d="M12 6c2 0 3 1 3 3s-1 3-3 3-3-1-3-3 1-3 3-3z"
			fill={props.variant === "outline" ? "none" : "rgba(0,0,0,0.06)"}
		/>
	</SvgWrapper>
)

// 5. Castanha-de-caju (Cashew)
export const CashewIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M7 10c2-3 6-4 9-2 1 1 .5 2.5-.7 3.3C13.5 13 10 12.5 7 15" />
		<circle cx="8.5" cy="8.5" r="1" fill={props.variant === "outline" ? "none" : "currentColor"} />
	</SvgWrapper>
)

// 6. Castanha-do-Pará (Brazil nut)
export const BrazilNutIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M6 8c3-3 10-3 12 1 1 2-2 6-6 9-3 2-6 1-7-2-.6-1.7.2-4 1-6z" />
	</SvgWrapper>
)

// 7. Centeio (Rye)
export const RyeIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M12 4v16" />
		<path d="M8 6l6 3M8 10l6 3M8 14l6 3" />
	</SvgWrapper>
)

// 8. Cevada (Barley)
export const BarleyIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M12 3v18" />
		<path d="M12 6l5 2M12 10l5 2M12 14l5 2M12 18l5 2" />
	</SvgWrapper>
)

// 9. Crustáceos (Crustaceans / Shrimp)
export const CrustaceanIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M4 12c0-2 1.5-4 4-4 2.5 0 3.5 1.5 5 1.5s3-1 4-1 2 1 2 3-1 4-3 5-4 1.5-6 1-4-1.5-6-3C5 14.5 4 13.5 4 12z" />
		<circle cx="7" cy="10" r=".8" fill={props.variant === "outline" ? "none" : "currentColor"} />
	</SvgWrapper>
)

// 10. Glúten (Gluten)
export const GlutenIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M6 9c3-3 9-3 12 0-3 3-9 3-12 0z" />
		<path d="M9 12c2 1 4 1 6 0" />
	</SvgWrapper>
)

// 11. Látex (Latex)
export const LatexIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M12 3c2.5 3.5 4 5 4 7.5A4 4 0 0 1 8 14c0-2.5 1.5-4 4-11z" />
	</SvgWrapper>
)

// 12. Leite (Milk)
export const MilkIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<rect x="4" y="6" width="10" height="12" rx="1" />
		<path d="M4 6l5-3 5 3" />
		<path d="M17 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" fill={props.variant === "outline" ? "none" : "currentColor"} />
	</SvgWrapper>
)

// 13. Macadâmia (Macadamia)
export const MacadamiaIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<circle cx="12" cy="12" r="5" />
		<circle cx="12" cy="12" r="2" fill={props.variant === "outline" ? "none" : "rgba(0,0,0,0.06)"} />
	</SvgWrapper>
)

// 14. Nozes (Walnuts)
export const WalnutsIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M8 12c-1.5 1.5-1 3.5 1 4 2 1 3-1 4-2s3-1 4 0c1 1 2 0 2-1s-1-2-2-2c-1 0-2 1-3 0s-2-2-4-2-3 1-4 3z" />
	</SvgWrapper>
)

// 15. Ovos (Eggs)
export const EggIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<ellipse cx="12" cy="12" rx="6" ry="8" />
	</SvgWrapper>
)

// 16. Pecã (Pecan)
export const PecanIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M8 8c2-2 6-2 8 0 1 1 1 3 0 4-2 2-6 2-8 0-1.2-1-1.2-3-0-4z" />
	</SvgWrapper>
)

// 17. Peixe (Fish)
export const FishIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M3 12c4 6 10 6 18 0-4-6-10-6-18 0z" />
		<path d="M8 9l4 3-4 3V9z" />
	</SvgWrapper>
)

// 18. Pistache (Pistachio)
export const PistachioIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M12 4c3 1 5.5 4 5.5 8S15 20 12 20 7 16 6.5 12 9 5 12 4z" />
		<path d="M12 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill={props.variant === "outline" ? "none" : "currentColor"} />
	</SvgWrapper>
)

// 19. Soja (Soy)
export const SoyIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M7 7c2 0 3-1 5-1s3 1 5 1c0 3-2 5-5 6-3-1-5-3-5-6z" />
		<path d="M12 3v4" />
	</SvgWrapper>
)

// 20. Trigo (Wheat)
export const WheatIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M12 3v18" />
		<path d="M8 6l8 4M8 10l8 4M8 14l8 4" />
	</SvgWrapper>
)

// 21. Triticale (wheat+rye hybrid)
export const TriticaleIcon: React.FC<SvgWrapperProps> = (props) => (
	<SvgWrapper {...props}>
		<path d="M12 3v18" />
		<path d="M9 6l6 3M9 10l6 3M9 14l6 3" />
		<path d="M6 8l1 0M17 8l1 0" />
	</SvgWrapper>
)

// Icon mapping for easy access
export const ICON_MAP: Record<string, React.FC<SvgWrapperProps>> = {
	amendoa: AlmondIcon,
	amêndoa: AlmondIcon,
	amendoim: PeanutIcon,
	aveia: OatIcon,
	avela: HazelnutIcon,
	avelã: HazelnutIcon,
	castanhaDeCaju: CashewIcon,
	"castanha-de-caju": CashewIcon,
	"castanha de caju": CashewIcon,
	castanhaDoPara: BrazilNutIcon,
	"castanha-do-pará": BrazilNutIcon,
	"castanha-do-para": BrazilNutIcon,
	"castanha do pará": BrazilNutIcon,
	centeio: RyeIcon,
	cevada: BarleyIcon,
	crustaceos: CrustaceanIcon,
	crustáceos: CrustaceanIcon,
	gluten: GlutenIcon,
	glúten: GlutenIcon,
	latex: LatexIcon,
	látex: LatexIcon,
	leite: MilkIcon,
	lactose: MilkIcon,
	macadamia: MacadamiaIcon,
	macadâmia: MacadamiaIcon,
	nozes: WalnutsIcon,
	ovos: EggIcon,
	peca: PecanIcon,
	pecã: PecanIcon,
	peixe: FishIcon,
	pistache: PistachioIcon,
	soja: SoyIcon,
	trigo: WheatIcon,
	triticale: TriticaleIcon,
}

interface AllergenIconProps {
	type: string
	size?: number
	variant?: "outline" | "filled"
	className?: string
	title?: string
}

export const AllergenIcon: React.FC<AllergenIconProps> = ({
	type,
	size = 20,
	variant = "outline",
	className = "",
	title,
}) => {
	const normalizedType = type.toLowerCase().trim()
	const IconComponent = ICON_MAP[normalizedType]

	if (!IconComponent) {
		console.warn(`AllergenIcon: No icon found for type "${type}"`)
		return null
	}

	return <IconComponent size={size} variant={variant} className={className} title={title || type} />
}

export default AllergenIcon
