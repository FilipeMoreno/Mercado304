import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo, useRef, useTransition } from "react"

interface UrlStateConfig {
	basePath: string
	initialValues: Record<string, string | number>
}

export function useUrlState({ basePath, initialValues }: UrlStateConfig) {
	const router = useRouter()
	const urlSearchParams = useSearchParams()
	const [isPending, startTransition] = useTransition()
	const isUpdatingUrl = useRef(false)

	// Parse current state from URL
	const state = useMemo(() => {
		const current: Record<string, string | number> = {}
		Object.entries(initialValues).forEach(([key, defaultValue]) => {
			const urlValue = urlSearchParams.get(key)
			if (urlValue !== null) {
				// Handle page as number, others as string
				current[key] = key === "page" ? parseInt(urlValue, 10) : urlValue
			} else {
				current[key] = defaultValue
			}
		})
		return current
	}, [urlSearchParams, initialValues])

	const updateUrl = useCallback(
		(newState: Record<string, any>) => {
			if (isUpdatingUrl.current) return

			isUpdatingUrl.current = true

			startTransition(() => {
				const params = new URLSearchParams()

				Object.entries(newState).forEach(([key, value]) => {
					const defaultValue = initialValues[key]

					// Always include page parameter if different from 1
					if (key === "page" && value > 1) {
						params.set(key, String(value))
					}
					// For other parameters, only add if different from default and not empty
					else if (
						key !== "page" &&
						value !== defaultValue &&
						value !== "" &&
						value !== "all" &&
						value !== null &&
						value !== undefined
					) {
						params.set(key, String(value))
					}
				})

				const newUrl = params.toString() ? `${basePath}?${params.toString()}` : basePath
				router.push(newUrl, { scroll: false })

				// Reset flag after navigation
				setTimeout(() => {
					isUpdatingUrl.current = false
				}, 100)
			})
		},
		[basePath, router, initialValues],
	)

	const updateState = useCallback(
		(updates: Record<string, any>) => {
			const newState = { ...state, ...updates }
			updateUrl(newState)
		},
		[state, updateUrl],
	)

	const updateSingleValue = useCallback(
		(key: string, value: any) => {
			// Reset page to 1 when updating filters (except page itself)
			const shouldResetPage = key !== "page" && key !== "sort"
			const newState = {
				...state,
				[key]: value,
				...(shouldResetPage ? { page: 1 } : {}),
			}
			updateUrl(newState)
		},
		[state, updateUrl],
	)

	const clearFilters = useCallback(() => {
		const newState = { ...initialValues, page: 1 }
		updateUrl(newState)
	}, [initialValues, updateUrl])

	const hasActiveFilters = useMemo(() => {
		return Object.entries(state).some(([key, value]) => {
			const defaultValue = initialValues[key]
			// Special handling for different types
			if (typeof defaultValue === "number") {
				return value !== defaultValue
			}
			return value !== defaultValue && value !== "" && value !== "all" && value !== null && value !== undefined
		})
	}, [state, initialValues])

	return {
		state,
		updateState,
		updateSingleValue,
		clearFilters,
		hasActiveFilters,
		isPending,
	}
}
