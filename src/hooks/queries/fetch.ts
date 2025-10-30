"use client"

export const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
	const response = await fetch(url, options)
	if (!response.ok) {
		let message = `Erro ao buscar dados: ${response.status}`
		try {
			const errorData = await response.json()
			message = errorData.error || message
		} catch (_) {
			// Ignora erro de parse
		}
		throw new Error(message)
	}
	return response.json()
}


