"use client"

import { Loader2 } from "lucide-react"
import { type ReactNode, Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyWrapperProps {
	children: ReactNode
	fallback?: ReactNode
	className?: string
}

export function LazyWrapper({ children, fallback, className }: LazyWrapperProps) {
	const defaultFallback = (
		<div className={`flex items-center justify-center p-8 ${className || ""}`}>
			<div className="text-center">
				<Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
				<p className="text-sm text-gray-600">Carregando...</p>
			</div>
		</div>
	)

	return <Suspense fallback={fallback || defaultFallback}>{children}</Suspense>
}

// Componentes específicos de fallback
export function ProductListFallback() {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{Array.from({ length: 8 }, (_, i) => (
				<Skeleton key={i} className="h-64 w-full" />
			))}
		</div>
	)
}

export function ProductCardFallback() {
	return <Skeleton className="h-64 w-full" />
}

export function ChartFallback() {
	return <Skeleton className="h-80 w-full" />
}

export function DataTableFallback() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-10 w-full" />
			{Array.from({ length: 5 }, (_, i) => (
				<Skeleton key={i} className="h-12 w-full" />
			))}
		</div>
	)
}
