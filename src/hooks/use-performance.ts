"use client"

import { useCallback, useEffect, useState } from "react"

interface PerformanceMetrics {
	renderTime: number
	memoryUsage?: number
	componentCount: number
	reRenderCount: number
}

export function usePerformanceMonitor(componentName: string) {
	const [metrics, setMetrics] = useState<PerformanceMetrics>({
		renderTime: 0,
		componentCount: 0,
		reRenderCount: 0,
	})

	const [startTime, setStartTime] = useState<number>(0)

	useEffect(() => {
		setStartTime(performance.now())
	}, [])

	useEffect(() => {
		const endTime = performance.now()
		const renderTime = endTime - startTime

		setMetrics((prev) => ({
			...prev,
			renderTime,
			reRenderCount: prev.reRenderCount + 1,
		}))

		// Log performance em desenvolvimento
		if (process.env.NODE_ENV === "development") {
			console.log(`[Performance] ${componentName}:`, {
				renderTime: `${renderTime.toFixed(2)}ms`,
				reRenderCount: metrics.reRenderCount + 1,
			})
		}
	})

	const measureAsync = useCallback(
		async <T>(fn: () => Promise<T>, operationName: string): Promise<T> => {
			const start = performance.now()
			try {
				const result = await fn()
				const end = performance.now()

				if (process.env.NODE_ENV === "development") {
					console.log(`[Async Performance] ${componentName} - ${operationName}:`, {
						duration: `${(end - start).toFixed(2)}ms`,
					})
				}

				return result
			} catch (error) {
				const end = performance.now()

				if (process.env.NODE_ENV === "development") {
					console.log(`[Async Performance] ${componentName} - ${operationName} (ERROR):`, {
						duration: `${(end - start).toFixed(2)}ms`,
						error,
					})
				}

				throw error
			}
		},
		[componentName],
	)

	return { metrics, measureAsync }
}

// Hook para debounce otimizado
export function useOptimizedDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

// Hook para throttle otimizado
export function useOptimizedThrottle<T extends (...args: any[]) => any>(callback: T, delay: number): T {
	const [lastCall, setLastCall] = useState<number>(0)

	return useCallback(
		((...args: Parameters<T>) => {
			const now = Date.now()
			if (now - lastCall >= delay) {
				setLastCall(now)
				return callback(...args)
			}
		}) as T,
		[],
	)
}

// Hook para intersection observer otimizado
export function useIntersectionObserver(
	elementRef: React.RefObject<Element | null>,
	options: IntersectionObserverInit = {},
) {
	const [isIntersecting, setIsIntersecting] = useState(false)

	useEffect(() => {
		const element = elementRef.current
		if (!element) return

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry) {
					setIsIntersecting(entry.isIntersecting)
				}
			},
			{
				threshold: 0.1,
				rootMargin: "50px",
				...options,
			},
		)

		observer.observe(element)

		return () => {
			observer.unobserve(element)
		}
	}, [elementRef, options])

	return isIntersecting
}

// Hook para lazy loading de imagens
export function useLazyImage(src: string, placeholder?: string) {
	const [imageSrc, setImageSrc] = useState(placeholder || "")
	const [isLoaded, setIsLoaded] = useState(false)
	const [isError, setIsError] = useState(false)

	useEffect(() => {
		const img = new Image()

		img.onload = () => {
			setImageSrc(src)
			setIsLoaded(true)
		}

		img.onerror = () => {
			setIsError(true)
		}

		img.src = src
	}, [src])

	return { imageSrc, isLoaded, isError }
}

// Hook para batch updates
export function useBatchedUpdates() {
	const [updates, setUpdates] = useState<(() => void)[]>([])
	const [isBatching, setIsBatching] = useState(false)

	const batchUpdate = useCallback(
		(updateFn: () => void) => {
			if (isBatching) {
				setUpdates((prev) => [...prev, updateFn])
			} else {
				updateFn()
			}
		},
		[isBatching],
	)

	const flushUpdates = useCallback(() => {
		if (updates.length > 0) {
			// Executar todos os updates em batch
			updates.forEach((update) => update())
			setUpdates([])
		}
		setIsBatching(false)
	}, [updates])

	const startBatch = useCallback(() => {
		setIsBatching(true)
	}, [])

	return { batchUpdate, flushUpdates, startBatch }
}
