/**
 * Identifica se a string é um código de barras
 * Códigos de barras são tipicamente numéricos e têm entre 8-14 dígitos
 */
export function isBarcode(input: string): boolean {
	// Remove espaços e verifica se é apenas números
	const cleaned = input.trim()

	// Verifica se contém apenas números
	const isNumeric = /^\d+$/.test(cleaned)

	// Códigos de barras comuns têm entre 8-14 dígitos
	const isValidLength = cleaned.length >= 8 && cleaned.length <= 14

	return isNumeric && isValidLength
}

/**
 * Normaliza códigos de barras removendo TODOS os zeros iniciais
 * Cupons fiscais podem ter zeros extras no início que impedem a correspondência com produtos
 * Ex: "08423243009753" -> "8423243009753"
 * Ex: "0009788" -> "9788"
 * Ex: "7891234567890" -> "7891234567890" (não altera se não começar com 0)
 */
export function normalizeBarcode(barcode: string): string {
	if (!barcode) return barcode

	// Remove espaços e caracteres não numéricos
	const cleaned = barcode.trim().replace(/\D/g, "")

	// Se não for um código de barras válido, retorna como está
	if (!isBarcode(cleaned)) return barcode

	// Remove TODOS os zeros do início usando regex
	const normalized = cleaned.replace(/^0+/, "")

	// Se ficou vazio ou muito curto após remover todos os zeros, retorna o original
	// (pode ser um código que é só zeros ou realmente precisa começar com 0)
	if (!normalized || normalized.length < 8) {
		return cleaned
	}

	return normalized
}

/**
 * Filtra produtos por nome ou código de barras
 */
export function filterProducts(products: any[], searchTerm: string) {
	if (!searchTerm) return products

	const cleanTerm = searchTerm.toLowerCase().trim()

	return products.filter((product) => {
		// Busca por nome
		const matchesName = product.name.toLowerCase().includes(cleanTerm)

		// Busca por marca (se existir)
		const matchesBrand = product.brand?.name?.toLowerCase().includes(cleanTerm) || false

		// Busca por código de barras - comparar com trim() e sem case sensitive
		const matchesBarcode = product.barcode && searchTerm.trim() === product.barcode.toString()

		return matchesName || matchesBrand || matchesBarcode
	})
}
