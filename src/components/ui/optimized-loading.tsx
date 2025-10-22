"use client"

import { memo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Skeleton otimizado para ProductCard
export const ProductCardSkeleton = memo(() => (
	<ProductCardSkeleton />
))

ProductCardSkeleton.displayName = "ProductCardSkeleton"

// Skeleton otimizado para MarketCard
export const MarketCardSkeleton = memo(() => (
	<MarketCardSkeleton />
))

MarketCardSkeleton.displayName = "MarketCardSkeleton"

// Skeleton otimizado para CategoryCard
export const CategoryCardSkeleton = memo(() => (
	<CategoryCardSkeleton />
))

CategoryCardSkeleton.displayName = "CategoryCardSkeleton"

// Skeleton otimizado para BrandCard
export const BrandCardSkeleton = memo(() => (
	<BrandCardSkeleton />
))

BrandCardSkeleton.displayName = "BrandCardSkeleton"

// Grid de skeletons otimizado
interface SkeletonGridProps {
	count: number
	type: "product" | "market" | "category" | "brand"
	className?: string
}

export const SkeletonGrid = memo<SkeletonGridProps>(({ count, type, className }) => {
	const SkeletonComponent = {
		product: ProductCardSkeleton,
		market: MarketCardSkeleton,
		category: CategoryCardSkeleton,
		brand: BrandCardSkeleton,
	}[type]

	const gridClass = {
		product: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
		market: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
		category: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
		brand: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4",
	}[type]

	return (
		<div className={`${gridClass} ${className || ""}`}>
			{Array.from({ length: count }, (_, i) => (
				<SkeletonComponent key={i} />
			))}
		</div>
	)
})

SkeletonGrid.displayName = "SkeletonGrid"

// Loading state otimizado
interface OptimizedLoadingProps {
	isLoading: boolean
	children: React.ReactNode
	skeletonCount?: number
	skeletonType?: "product" | "market" | "category" | "brand"
	className?: string
}

export const OptimizedLoading = memo<OptimizedLoadingProps>(
	({ isLoading, children, skeletonCount = 8, skeletonType = "product", className }) => {
		if (isLoading) {
			return <SkeletonGrid count={skeletonCount} type={skeletonType} {...(className ? { className } : {})} />
		}

		return <>{children}</>
	},
)

OptimizedLoading.displayName = "OptimizedLoading"
