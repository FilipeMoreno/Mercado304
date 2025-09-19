"use client"

import Image from "next/image"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface OptimizedImageProps {
	src: string
	alt: string
	width?: number
	height?: number
	className?: string
	priority?: boolean
	fill?: boolean
	sizes?: string
	placeholder?: "blur" | "empty"
	blurDataURL?: string
}

export function OptimizedImage({
	src,
	alt,
	width,
	height,
	className,
	priority = false,
	fill = false,
	sizes,
	placeholder = "empty",
	blurDataURL,
}: OptimizedImageProps) {
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(false)

	if (error) {
		return (
			<div className={`bg-gray-100 flex items-center justify-center ${className}`}>
				<span className="text-gray-400 text-sm">Imagem não encontrada</span>
			</div>
		)
	}

	return (
		<div className={`relative ${className}`}>
			{isLoading && (
				<Skeleton 
					className={`absolute inset-0 ${fill ? "w-full h-full" : `w-[${width}px] h-[${height}px]`}`} 
				/>
			)}
			<Image
				src={src}
				alt={alt}
				width={fill ? undefined : width}
				height={fill ? undefined : height}
				fill={fill}
				priority={priority}
				sizes={sizes}
				placeholder={placeholder}
				blurDataURL={blurDataURL}
				className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
				onLoad={() => setIsLoading(false)}
				onError={() => {
					setIsLoading(false)
					setError(true)
				}}
				quality={85}
			/>
		</div>
	)
}