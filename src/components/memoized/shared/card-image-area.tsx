"use client"

import type { LucideIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

interface CardImageAreaProps {
	imageUrl?: string | null
	alt: string
	fallbackIcon: LucideIcon
	gradientColors?: {
		from: string
		via: string
		to: string
	}
	children?: React.ReactNode
}

export const CardImageArea = ({
	imageUrl,
	alt,
	fallbackIcon: FallbackIcon,
	gradientColors = {
		from: "from-muted",
		via: "via-muted/50",
		to: "to-muted/50",
	},
	children,
}: CardImageAreaProps) => {
	const [imageError, setImageError] = useState(false)

	return (
		<div
			className={`relative h-48 w-full overflow-hidden bg-gradient-to-br ${gradientColors.from} ${gradientColors.via} ${gradientColors.to}`}
		>
			{imageUrl && !imageError ? (
				<>
					<Image
						src={imageUrl}
						alt={alt}
						fill
						className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
						sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
						onError={() => setImageError(true)}
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0" />
				</>
			) : (
				<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
					<FallbackIcon className="h-16 w-16 text-primary/20" />
				</div>
			)}
			{children}
		</div>
	)
}

CardImageArea.displayName = "CardImageArea"
