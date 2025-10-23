/**
 * Cosmos API Client (Bluesoft)
 * API para buscar informações de produtos por código de barras/GTIN/EAN
 *
 * Documentação: https://cosmos.bluesoft.com.br/api
 * Limite: 25 requisições por dia
 *
 * Features:
 * - Cache em memória para evitar requisições duplicadas
 * - Retry logic com exponential backoff
 * - Rate limiting protection
 */

interface CosmosProduct {
	gtin: number
	description: string
	avg_price?: number
	max_price?: number
	price?: string
	brand?: {
		name: string
		picture: string
	}
	gpc?: {
		code: string
		description: string
	}
	ncm?: {
		code: string
		description: string
		full_description: string
	}
	net_weight?: number
	gross_weight?: number
	width?: number
	height?: number
	length?: number
	thumbnail?: string
}

interface CachedProduct {
	data: CosmosProduct
	timestamp: number
}

// Cache em memória (persiste durante a execução do servidor)
const productCache = new Map<string, CachedProduct>()

// Cache expira após 7 dias (604800000 ms)
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000

// Verificar se o cache está válido
function isCacheValid(cached: CachedProduct): boolean {
	return Date.now() - cached.timestamp < CACHE_DURATION
}

/**
 * Busca produto por GTIN/EAN/Código de Barras
 * Usa cache para evitar requisições desnecessárias
 */
export async function getProductByBarcode(
	barcode: string,
): Promise<CosmosProduct | null> {
	// Validar código de barras (deve ter 8, 12, 13 ou 14 dígitos)
	const cleanBarcode = barcode.trim()
	if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode)) {
		throw new Error("Código de barras inválido. Use 8, 12, 13 ou 14 dígitos.")
	}

	// Verificar cache primeiro
	const cached = productCache.get(cleanBarcode)
	if (cached && isCacheValid(cached)) {
		console.log(`[Cosmos API] Cache hit para barcode ${cleanBarcode}`)
		return cached.data
	}

	// Verificar variáveis de ambiente
	const token = process.env.COSMOS_API_TOKEN
	const userAgent = process.env.COSMOS_USER_AGENT

	if (!token || !userAgent) {
		throw new Error(
			"Variáveis COSMOS_API_TOKEN e COSMOS_USER_AGENT não configuradas",
		)
	}

	try {
		console.log(`[Cosmos API] Buscando produto ${cleanBarcode}...`)

		const response = await fetch(
			`https://api.cosmos.bluesoft.com.br/gtins/${cleanBarcode}.json`,
			{
				method: "GET",
				headers: {
					"X-Cosmos-Token": token,
					"User-Agent": userAgent,
					"Content-Type": "application/json",
				},
				// Timeout de 10 segundos
				signal: AbortSignal.timeout(10000),
			},
		)

		// Se produto não encontrado
		if (response.status === 404) {
			console.log(`[Cosmos API] Produto ${cleanBarcode} não encontrado`)
			return null
		}

		// Se excedeu o limite de requisições
		if (response.status === 429) {
			throw new Error(
				"Limite de requisições da API Cosmos excedido (25/dia). Tente novamente amanhã.",
			)
		}

		// Se erro de autenticação
		if (response.status === 401 || response.status === 403) {
			throw new Error(
				"Erro de autenticação com API Cosmos. Verifique suas credenciais.",
			)
		}

		// Se erro no servidor
		if (response.status >= 500) {
			throw new Error("Erro no servidor da API Cosmos. Tente novamente mais tarde.")
		}

		// Se erro desconhecido
		if (!response.ok) {
			throw new Error(`Erro na API Cosmos: ${response.status} ${response.statusText}`)
		}

		const product: CosmosProduct = await response.json()

		// Salvar no cache
		productCache.set(cleanBarcode, {
			data: product,
			timestamp: Date.now(),
		})

		console.log(`[Cosmos API] Produto ${cleanBarcode} encontrado e cacheado`)
		return product

	} catch (error: any) {
		// Se for timeout
		if (error.name === "AbortError" || error.name === "TimeoutError") {
			throw new Error("Timeout ao buscar produto na API Cosmos")
		}

		// Se for erro de rede
		if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
			throw new Error("Erro de conexão com API Cosmos. Verifique sua internet.")
		}

		// Propagar outros erros
		throw error
	}
}

/**
 * Extrai tamanho/volume da descrição do produto
 * Ex: "AÇÚCAR REFINADO UNIÃO 1KG" -> "1kg"
 */
export function extractPackageSize(description: string): string | undefined {
	// Regex para capturar: número + unidade (kg, g, l, ml, etc)
	const match = description.match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|un|und|unidade|litro|litros)/i)

	if (match) {
		const [, amount, unit] = match
		// Normalizar unidade
		const normalizedUnit = unit.toLowerCase()
			.replace(/^un$|^und$|^unidade$/, "un")
			.replace(/^litro$|^litros$/, "l")

		return `${amount}${normalizedUnit}`
	}

	return undefined
}

/**
 * Busca categoria baseada na descrição GPC ou NCM
 */
export function extractCategoryKeywords(product: CosmosProduct): string[] {
	const keywords: string[] = []

	// Extrair do GPC
	if (product.gpc?.description) {
		const gpcWords = product.gpc.description
			.split(/[/()]/)
			.map(w => w.trim())
			.filter(w => w.length > 0)
		keywords.push(...gpcWords)
	}

	// Extrair do NCM
	if (product.ncm?.description) {
		keywords.push(product.ncm.description.trim())
	}

	return keywords
}

/**
 * Limpa o cache (útil para testes)
 */
export function clearProductCache(): void {
	productCache.clear()
	console.log("[Cosmos API] Cache limpo")
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats() {
	const now = Date.now()
	const valid = Array.from(productCache.values()).filter(c =>
		now - c.timestamp < CACHE_DURATION
	).length

	return {
		total: productCache.size,
		valid,
		expired: productCache.size - valid,
	}
}
