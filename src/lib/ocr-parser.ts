interface ParsedNutritionalInfo {
	servingSize?: string;
	calories?: number;
	proteins?: number;
	totalFat?: number;
	saturatedFat?: number;
	transFat?: number;
	carbohydrates?: number;
	totalSugars?: number;
	addedSugars?: number;
	fiber?: number;
	sodium?: number;
	allergensContains: string[];
	allergensMayContain: string[];
}

// Mapeamento de nutrientes com expressões regulares mais robustas
const nutrientMap = {
	calories: [/valor energ.tico/i, /energia/i, /calorias/i],
	carbohydrates: [/carboidratos totais/i, /carboidratos/i],
	totalSugars: [/a..cares totais/i, /acucares totais/i],
	addedSugars: [/a..cares adicionados/i, /acucares adicionados/i],
	proteins: [/prote.nas/i],
	totalFat: [/gorduras totais/i],
	saturatedFat: [/gorduras saturadas/i],
	transFat: [/gorduras trans/i],
	fiber: [/fibra alimentar/i],
	sodium: [/s.dio/i],
};

// Alérgenos comuns para verificação
const commonAllergens = [
	"leite", "ovos", "peixe", "crustáceos", "amendoim", "soja", "trigo",
	"centeio", "cevada", "aveia", "glúten", "amêndoa", "avelã", "castanha-de-caju",
	"castanha-do-pará", "macadâmia", "nozes", "pecã", "pistache",
];

/**
 * Limpa e normaliza o texto extraído do OCR.
 */
function cleanText(text: string): string {
	return text
		.toLowerCase()
		.replace(/(\r\n|\n|\r)/gm, " ") // Remove quebras de linha
		.replace(/\s+/g, " ") // Normaliza espaços
		.replace(/,/g, ".") // Converte vírgulas para pontos
		.replace(/informacao nutricional/i, "") // Remove título
		.trim();
}

/**
 * Extrai o primeiro valor numérico encontrado após uma palavra-chave em uma linha de texto.
 * @param text - O texto completo a ser analisado.
 * @param keywords - Uma lista de palavras-chave para procurar.
 * @returns O valor numérico encontrado ou undefined.
 */
function extractValue(text: string, keywords: RegExp[]): number | undefined {
	for (const keyword of keywords) {
		const match = text.match(keyword);
		if (match) {
			// Pega o texto a partir da palavra-chave encontrada
			const startIndex = match.index! + match[0].length;
			const remainingText = text.substring(startIndex);

			// Encontra o primeiro número no texto restante
			const valueMatch = remainingText.match(/(\d+(\.\d+)?)/);
			if (valueMatch) {
				const value = parseFloat(valueMatch[1]);
				// Validação simples para evitar valores absurdos (ex: %VD)
				if (value < 2000) {
					return value;
				}
			}
		}
	}
	return undefined;
}

/**
 * Extrai a porção de referência da tabela.
 */
function extractServingSize(text: string): string | undefined {
	const pattern = /por..o de (\d+(\.\d+)?\s*(?:g|ml))/i;
	const match = text.match(pattern);
	return match ? match[1] : undefined;
}

/**
 * Extrai informações sobre alergénios.
 */
function extractAllergens(text: string): { contains: string[]; mayContain: string[] } {
	const contains: Set<string> = new Set();
	const mayContain: Set<string> = new Set();

	// Regex para "ALÉRGICOS: CONTÉM..."
	const containsMatch = text.match(/al.rgicos\s*:\s*cont.m\s+([^.]+)/i);
	if (containsMatch) {
		const allergensText = containsMatch[1];
		commonAllergens.forEach(allergen => {
			if (new RegExp(`\\b${allergen}\\b`, 'i').test(allergensText)) {
				contains.add(allergen.charAt(0).toUpperCase() + allergen.slice(1));
			}
		});
	}

	// Regex para "PODE CONTER..."
	const mayContainMatch = text.match(/pode conter\s+([^.]+)/i);
	if (mayContainMatch) {
		const allergensText = mayContainMatch[1];
		commonAllergens.forEach(allergen => {
			if (new RegExp(`\\b${allergen}\\b`, 'i').test(allergensText)) {
				mayContain.add(allergen.charAt(0).toUpperCase() + allergen.slice(1));
			}
		});
	}
	
	// Verifica a presença de glúten separadamente
	if (/cont.m gl.ten/i.test(text)) {
		contains.add("Glúten");
	}
	if (/n.o cont.m gl.ten/i.test(text)) {
		// Opcional: tratar casos de "não contém" se necessário
	}

	return {
		contains: Array.from(contains),
		mayContain: Array.from(mayContain),
	};
}


/**
 * Função principal que orquestra a extração de dados do texto do OCR.
 */
export function parseOcrResult(text: string): ParsedNutritionalInfo {
	const cleaned = cleanText(text);

	// AQUI ESTÁ A CORREÇÃO
	const nutrients: { [key: string]: any } = {};

	for (const key in nutrientMap) {
		const keywords = nutrientMap[key as keyof typeof nutrientMap];
		const value = extractValue(cleaned, keywords);
		if (value !== undefined) {
			nutrients[key as keyof ParsedNutritionalInfo] = value;
		}
	}

	const servingSize = extractServingSize(cleaned);
	const allergens = extractAllergens(cleaned);

	return {
		servingSize,
		...nutrients,
		allergensContains: allergens.contains,
		allergensMayContain: allergens.mayContain,
	};
}