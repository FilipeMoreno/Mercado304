"use client"

 

interface CardBadgeProps {
	children: React.ReactNode
	className?: string
	color?: string
}

export const CardBadge = ({ children, className = "", color }: CardBadgeProps) => {
	const baseClasses =
		"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md shadow-lg text-xs font-medium border"

	if (color) {
		return (
			<div
				className={`${baseClasses} ${className}`}
				style={{
					backgroundColor: `${color}20`,
					borderColor: `${color}50`,
					color: color,
				}}
			>
				{children}
			</div>
		)
	}

	return <div className={`${baseClasses} bg-background/90 border-border/50 ${className}`}>{children}</div>
}

CardBadge.displayName = "CardBadge"
