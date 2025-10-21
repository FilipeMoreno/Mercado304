"use client"

import { startTransition, useCallback, useState, useTransition } from "react"

// React 19 optimized state management hook
export function useOptimizedState<T>(initialValue: T) {
	const [value, setValue] = useState<T>(initialValue)
	const [isPending, _setTransition] = useTransition()

	// Optimistic updates with React 19 transitions
	const setOptimisticValue = useCallback((newValue: T | ((prev: T) => T)) => {
		startTransition(() => {
			setValue(newValue)
		})
	}, [])

	// Immediate updates (for urgent UI changes)
	const setImmediateValue = useCallback((newValue: T | ((prev: T) => T)) => {
		setValue(newValue)
	}, [])

	// Async updates with loading state
	const setAsyncValue = useCallback(
		async (asyncFn: (prev: T) => Promise<T>) => {
			try {
				const currentValue = value
				startTransition(async () => {
					const newValue = await asyncFn(currentValue)
					setValue(newValue)
				})
			} catch (error) {
				console.error("Error in async state update:", error)
			}
		},
		[value],
	)

	return {
		value,
		setValue: setOptimisticValue,
		setImmediateValue,
		setAsyncValue,
		isPending,
	}
}

// Specialized hook for form state with React 19 optimizations
export function useOptimizedFormState<T extends Record<string, any>>(initialState: T) {
	const { value, setValue, isPending } = useOptimizedState(initialState)

	const updateField = useCallback(
		(field: keyof T, fieldValue: T[keyof T]) => {
			setValue((prev) => ({
				...prev,
				[field]: fieldValue,
			}))
		},
		[setValue],
	)

	const resetForm = useCallback(() => {
		setValue(initialState)
	}, [setValue, initialState])

	const setMultipleFields = useCallback(
		(updates: Partial<T>) => {
			setValue((prev) => ({
				...prev,
				...updates,
			}))
		},
		[setValue],
	)

	return {
		state: value,
		updateField,
		resetForm,
		setMultipleFields,
		isPending,
	}
}

// Hook for managing loading states with React 19 concurrent features
export function useOptimizedLoading() {
	const [isLoading, setIsLoading] = useState(false)
	const [isPending, startTransition] = useTransition()

	const withLoading = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T> => {
		setIsLoading(true)
		try {
			const result = await asyncFn()
			return result
		} finally {
			startTransition(() => {
				setIsLoading(false)
			})
		}
	}, [])

	const withTransition = useCallback(<T>(fn: () => T): void => {
		startTransition(() => {
			fn()
		})
	}, [])

	return {
		isLoading: isLoading || isPending,
		withLoading,
		withTransition,
		isPending,
	}
}
