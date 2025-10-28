import { Store } from "lucide-react"

interface MarketImageFallbackProps {
	marketName: string
	className?: string
	size?: "sm" | "md" | "lg"
}

export function MarketImageFallback({ 
	marketName, 
	className = "",
	size = "md"
}: MarketImageFallbackProps) {
	const sizeClasses = {
		sm: "h-6 w-6",
		md: "h-8 w-8", 
		lg: "h-12 w-12"
	}

	const textSizeClasses = {
		sm: "text-xs",
		md: "text-xs",
		lg: "text-sm"
	}

	return (
		<div className={`flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 ${className}`}>
			<div className="text-center p-2">
				<Store className={`${sizeClasses[size]} text-blue-400 mx-auto mb-1`} />
				<p className={`${textSizeClasses[size]} text-blue-600 font-medium line-clamp-2 px-1`}>
					{marketName}
				</p>
			</div>
		</div>
	)
}
