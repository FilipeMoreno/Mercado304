import { type ComponentProps, type ReactNode, Suspense } from "react"
import { OptimizedLoading } from "./optimized-loading"

interface OptimizedSuspenseProps extends Omit<ComponentProps<typeof Suspense>, "fallback"> {
	fallback?: ReactNode
	loadingText?: string
	size?: "sm" | "md" | "lg"
}

// React 19 optimized Suspense wrapper with better loading states
export function OptimizedSuspense({
	children,
	fallback,
	loadingText = "Carregando...",
	size = "md",
	...props
}: OptimizedSuspenseProps) {
	const sizeClasses = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg",
	}

	const defaultFallback = fallback || (
		<div className={`flex items-center justify-center p-8 ${sizeClasses[size]}`}>{loadingText}</div>
	)

	return (
		<Suspense fallback={defaultFallback} {...props}>
			{children}
		</Suspense>
	)
}

// Specialized Suspense components for different use cases
export function DataSuspense({ children, ...props }: Omit<OptimizedSuspenseProps, "loadingText">) {
	return (
		<OptimizedSuspense loadingText="Carregando dados..." {...props}>
			{children}
		</OptimizedSuspense>
	)
}

export function PageSuspense({ children, ...props }: Omit<OptimizedSuspenseProps, "loadingText" | "size">) {
	return (
		<OptimizedSuspense loadingText="Carregando página..." size="lg" {...props}>
			{children}
		</OptimizedSuspense>
	)
}

export function ComponentSuspense({ children, ...props }: Omit<OptimizedSuspenseProps, "loadingText" | "size">) {
	return (
		<OptimizedSuspense loadingText="Carregando componente..." size="sm" {...props}>
			{children}
		</OptimizedSuspense>
	)
}
