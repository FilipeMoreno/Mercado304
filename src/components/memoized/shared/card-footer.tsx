"use client"

import { BarChart3 } from "lucide-react"
import { memo } from "react"

interface CardFooterProps {
	text?: string
}

export const CardFooter = memo<CardFooterProps>(({ text = "Ver detalhes" }) => {
	return (
		<div className="mt-auto pt-3 flex items-center justify-between text-sm text-muted-foreground group-hover:text-primary transition-colors border-t">
			<span className="font-medium">{text}</span>
			<BarChart3 className="h-4 w-4 transition-transform group-hover:translate-x-1" />
		</div>
	)
})

CardFooter.displayName = "CardFooter"
