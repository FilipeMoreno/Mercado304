import { useRouter, useSearchParams } from "next/navigation"
import { useRef } from "react"

interface UrlStateConfig {
	basePath: string
	initialValues: Record<string, string | number>
}

export function useUrlState({ basePath, initialValues }: UrlStateConfig) {
	const router = useRouter()
	const searchParams = useSearchParams()

	// Create a stable reference to initialValues to avoid recreating dependencies
	const initialValuesRef = useRef(initialValues)
	initialValuesRef.current = initialValues

	// Parse current state from URL parameters
	const state = (() => {
		const current: Record<string, string | number> = {}
		const defaults = initialValuesRef.current

		for (const [key, defaultValue] of Object.entries(defaults)) {
			const urlValue = searchParams.get(key)
			if (urlValue !== null && urlValue !== "") {
				current[key] = key === "page" ? Math.max(1, parseInt(urlValue, 10) || 1) : urlValue
			} else {
				current[key] = defaultValue
			}
		}

		return current
	})()

	// Build URL with current parameters - make it more stable
	const buildUrl = (newState: Record<string, string | number>) => {
			const params = new URLSearchParams()
			const defaults = initialValuesRef.current

			for (const [key, value] of Object.entries(newState)) {
				const defaultValue = defaults[key]
				const stringValue = String(value)
				const shouldInclude = value !== defaultValue && stringValue !== "" && stringValue !== "all"

				// Add to URL if different from default and not empty
				if (key === "page") {
					// Only add page if > 1
					if (value !== 1) {
						params.set(key, stringValue)
					}
				} else if (shouldInclude) {
					params.set(key, stringValue)
				}
			}

			return params.toString() ? `${basePath}?${params.toString()}` : basePath
	}

	// Update URL with new state
	const updateUrl = (newState: Record<string, string | number>) => {
			const newUrl = buildUrl(newState)
			router.push(newUrl, { scroll: false })
	}

	// Update multiple values at once
	const updateState = (updates: Record<string, string | number>) => {
			const newState = { ...state, ...updates }
			updateUrl(newState)
	}

	// Update a single value
	const updateSingleValue = (key: string, value: string | number) => {
			// Use a more explicit approach to ensure state preservation
			const currentState = { ...state }
			currentState[key] = value

			// Reset to page 1 when changing filters (except for page and sort)
			if (key !== "page" && key !== "sort") {
				currentState.page = 1
			}

			updateUrl(currentState)
	}

	// Clear all filters and reset to defaults
	const clearFilters = () => {
		const resetState = { ...initialValuesRef.current, page: 1 }
		updateUrl(resetState)
	}

	// Check if any filters are active
	const hasActiveFilters = (() => {
		const defaults = initialValuesRef.current
		return Object.entries(state).some(([key, value]) => {
			const defaultValue = defaults[key]

			if (key === "search") {
				return value !== ""
			}
			if (key === "page") {
				return value !== 1
			}
			if (key === "category") {
				return value !== "all"
			}
			if (key === "brand") {
				return value !== "all"
			}
			if (key === "sort" && basePath !== "/compras" && basePath !== "/lista") {
				return value !== "name-asc"
			}
			if (key === "sort" && basePath === "/compras") {
				return value !== "date-desc"
			}
			if (key === "sort" && basePath === "/lista") {
				return value !== "date-desc"
			}
			if (key === "sort") {
				return value !== "name"
			}
			if (key === "period") {
				return value !== "all"
			}
			if (key === "market") {
				return value !== "all"
			}
			if (key === "dateFrom") {
				return value !== ""
			}
			if (key === "dateTo") {
				return value !== ""
			}
			if (key === "location") {
				return value !== "all"
			}
			if (key === "filter") {
				return value !== "all"
			}
			if (key === "status") {
				return value !== "all"
			}

			return value !== defaultValue && String(value) !== "" && String(value) !== "all"
		})
	})()

	return {
		state,
		updateState,
		updateSingleValue,
		clearFilters,
		hasActiveFilters,
	}
}
