import { useEffect, useEffectEvent, useState } from "react"
import { toast } from "sonner"

export function useDataFetch<T>(url: string, initialData: T) {
	const [data, setData] = useState<T>(initialData)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	// useEffectEvent para fetchData - sempre vê as props/state mais recentes
	const onFetchData = useEffectEvent(async () => {
		setLoading(true)
		setError(null)
		try {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Erro ${response.status}: ${response.statusText}`)
			}
			const result = await response.json()
			setData(result)
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Erro ao carregar os dados"
			setError(errorMessage)
			console.error("Erro:", error)
			toast.error("Erro ao carregar os dados.")
		} finally {
			setLoading(false)
		}
	})

	const refetch = () => {
		onFetchData()
	}

	useEffect(() => {
		onFetchData()
	}, [url]) // ✅ onFetchData não é dependência (Effect Event)

	return {
		data,
		setData,
		loading,
		error,
		refetch,
	}
}
