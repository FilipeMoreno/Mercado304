// Função de retry com backoff exponencial
export async function retryWithBackoff<T>(
	operation: () => Promise<T>,
	maxRetries: number = 3,
	baseDelay: number = 1000,
): Promise<T> {
	let lastError: Error

	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await operation()
		} catch (error) {
			lastError = error as Error

			// Se é o último attempt, joga o erro
			if (attempt === maxRetries) {
				throw lastError
			}

			// Verifica se é um erro que vale a pena tentar novamente
			const errorMessage = lastError.message.toLowerCase()
			const retryableErrors = [
				"overloaded",
				"service unavailable",
				"rate limit",
				"timeout",
				"temporary failure",
				"503",
				"429",
				"500",
				"502",
				"504",
			]

			const shouldRetry = retryableErrors.some((errorType) => errorMessage.includes(errorType))

			if (!shouldRetry) {
				throw lastError
			}

			// Calcula delay com backoff exponencial + jitter
			const delay = baseDelay * 2 ** attempt + Math.random() * 1000
			console.log(`Tentativa ${attempt + 1} falhou, tentando novamente em ${delay}ms...`)
			await new Promise((resolve) => setTimeout(resolve, delay))
		}
	}

	throw lastError!
}

// Função para parsear contexto das operações
export function parseContext(contextStr: string, searchTerm: string) {
	if (contextStr.startsWith("addToList:")) {
		const listName = contextStr.replace("addToList:", "")
		return { action: "addToList", listName, searchTerm }
	}
	if (contextStr === "comparePrice") {
		return { action: "comparePrice", searchTerm }
	}
	if (contextStr === "addToStock") {
		return { action: "addToStock", searchTerm }
	}
	if (contextStr.startsWith("createPurchase:")) {
		try {
			const purchaseData = JSON.parse(contextStr.replace("createPurchase:", ""))
			return { action: "createPurchase", ...purchaseData, searchTerm }
		} catch {
			return { action: "createPurchase", searchTerm }
		}
	}
	return { action: "generic", searchTerm, originalContext: contextStr }
}

// Função para tratar diferentes tipos de erro com mensagens amigáveis
export function getErrorMessage(error: Error): string {
	const errorText = error.message.toLowerCase()

	if (errorText.includes("overloaded") || errorText.includes("503")) {
		return "O assistente está sobrecarregado no momento. Tentei algumas vezes mas não consegui processar sua solicitação. Tente novamente em alguns segundos."
	}

	if (errorText.includes("rate limit") || errorText.includes("429")) {
		return "Muitas solicitações foram feitas recentemente. Aguarde alguns segundos e tente novamente."
	}

	if (errorText.includes("timeout")) {
		return "A solicitação demorou muito para ser processada. Tente reformular sua pergunta ou tente novamente."
	}

	if (errorText.includes("api key") || errorText.includes("unauthorized")) {
		return "Problema de autenticação com o serviço de IA. Entre em contato com o administrador."
	}

	if (errorText.includes("network") || errorText.includes("connection")) {
		return "Problema de conexão. Verifique sua internet e tente novamente."
	}

	return "Desculpe, ocorreu um erro inesperado. Tente novamente."
}

// Função para normalizar texto de produtos (remove acentos, hífen, espaços extras)
export function normalizeProductName(productName: string): string {
	return (
		productName
			.toLowerCase()
			.trim()
			// Remove acentos
			.replace(/[áàâã]/g, "a")
			.replace(/[éèê]/g, "e")
			.replace(/[íìî]/g, "i")
			.replace(/[óòôõ]/g, "o")
			.replace(/[úùû]/g, "u")
			.replace(/[ç]/g, "c")
			// Remove hífen e underscores, substitui por espaço
			.replace(/[-_]/g, " ")
			// Remove espaços extras
			.replace(/\s+/g, " ")
			.trim()
	)
}
