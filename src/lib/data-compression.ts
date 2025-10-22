/**
 * Sistema de Compressão de Dados
 * Comprime e descomprime dados para economizar espaço no cache
 */

/**
 * Comprime dados usando LZString-like algorithm
 * Implementação simplificada de compressão de string
 */
export function compressData(data: unknown): string {
	try {
		const jsonString = JSON.stringify(data)

		// Usar compressão nativa do navegador se disponível
		if (typeof CompressionStream !== "undefined") {
			// CompressionStream é experimental, usar fallback
			return btoa(jsonString) // Base64 simples por enquanto
		}

		// Compressão básica usando LZ-like algorithm
		return compressLZ(jsonString)
	} catch (error) {
		console.error("Erro ao comprimir dados:", error)
		return JSON.stringify(data)
	}
}

/**
 * Descomprime dados
 */
export function decompressData<T = unknown>(compressed: string): T | null {
	try {
		// Tentar decodificar base64
		try {
			const decoded = atob(compressed)
			return JSON.parse(decoded) as T
		} catch {
			// Não é base64, tentar LZ
			const decompressed = decompressLZ(compressed)
			return JSON.parse(decompressed) as T
		}
	} catch (error) {
		console.error("Erro ao descomprimir dados:", error)
		return null
	}
}

/**
 * Compressão LZ simplificada
 * Baseado em LZ-String
 */
function compressLZ(input: string): string {
	if (!input) return ""

	const dictionary: Record<string, number> = {}
	const data: (string | number)[] = []
	let phrase = ""
	let dictSize = 256

	for (let i = 0; i < input.length; i++) {
		const char = input.charAt(i)
		const newPhrase = phrase + char

		if (dictionary[newPhrase] !== undefined) {
			phrase = newPhrase
		} else {
			const dictValue = dictionary[phrase]
			data.push(phrase.length === 1 ? phrase : (dictValue ?? phrase))
			dictionary[newPhrase] = dictSize++
			phrase = char
		}
	}

	if (phrase !== "") {
		const dictValue = dictionary[phrase]
		data.push(phrase.length === 1 ? phrase : (dictValue ?? phrase))
	}

	return btoa(JSON.stringify(data))
}

/**
 * Descompressão LZ simplificada
 */
function decompressLZ(compressed: string): string {
	if (!compressed) return ""

	try {
		const data = JSON.parse(atob(compressed)) as (string | number)[]
		const dictionary: Record<number, string> = {}
		let dictSize = 256
		let result = ""
		let entry = ""
		let w: string

		if (data.length === 0) return ""

		w = String(data[0])
		result = w

		for (let i = 1; i < data.length; i++) {
			const k = data[i]

			if (typeof k === "string") {
				entry = k
			} else if (k !== undefined && dictionary[k] !== undefined) {
				entry = dictionary[k]
			} else {
				entry = w + w.charAt(0)
			}

			result += entry
			dictionary[dictSize++] = w + entry.charAt(0)
			w = entry
		}

		return result
	} catch {
		return compressed
	}
}

/**
 * Calcular taxa de compressão
 */
export function getCompressionRatio(original: unknown): number {
	try {
		const originalSize = JSON.stringify(original).length
		const compressedSize = compressData(original).length
		const ratio = (1 - compressedSize / originalSize) * 100
		return Math.round(ratio)
	} catch {
		return 0
	}
}

/**
 * Calcular tamanho em bytes
 */
export function getDataSize(data: unknown): number {
	try {
		return new Blob([JSON.stringify(data)]).size
	} catch {
		return 0
	}
}

/**
 * Formatar tamanho em formato legível
 */
export function formatSize(bytes: number): string {
	if (bytes === 0) return "0 Bytes"

	const k = 1024
	const sizes = ["Bytes", "KB", "MB", "GB"]
	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return `${Math.round((bytes / k ** i) * 100) / 100} ${sizes[i]}`
}

/**
 * Hook para usar compressão em componentes
 */
export function useDataCompression() {
	const compress = (data: unknown) => {
		const compressed = compressData(data)
		const ratio = getCompressionRatio(data)
		const originalSize = getDataSize(data)
		const compressedSize = getDataSize(compressed)

		return {
			compressed,
			ratio,
			originalSize: formatSize(originalSize),
			compressedSize: formatSize(compressedSize),
		}
	}

	const decompress = <T = unknown>(compressed: string): T | null => {
		return decompressData<T>(compressed)
	}

	return {
		compress,
		decompress,
		getSize: (data: unknown) => formatSize(getDataSize(data)),
		getRatio: getCompressionRatio,
	}
}
