/**
 * Identifica se a string é um código de barras
 * Códigos de barras são tipicamente numéricos e têm entre 8-14 dígitos
 */
export function isBarcode(input: string): boolean {
	// Remove espaços e verifica se é apenas números
	const cleaned = input.trim();

	// Verifica se contém apenas números
	const isNumeric = /^\d+$/.test(cleaned);

	// Códigos de barras comuns têm entre 8-14 dígitos
	const isValidLength = cleaned.length >= 8 && cleaned.length <= 14;

	return isNumeric && isValidLength;
}

/**
 * Filtra produtos por nome ou código de barras
 */
export function filterProducts(products: any[], searchTerm: string) {
	if (!searchTerm) return products;

	const cleanTerm = searchTerm.toLowerCase().trim();

	return products.filter((product) => {
		// Busca por nome
		const matchesName = product.name.toLowerCase().includes(cleanTerm);

		// Busca por marca (se existir)
		const matchesBrand =
			product.brand?.name?.toLowerCase().includes(cleanTerm) || false;

		// Busca por código de barras - comparar com trim() e sem case sensitive
		const matchesBarcode =
			product.barcode && searchTerm.trim() === product.barcode.toString();

		return matchesName || matchesBrand || matchesBarcode;
	});
}
