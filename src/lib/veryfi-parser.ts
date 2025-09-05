import { NutritionalInfo } from "@/types";

// Mapeia os nomes da Veryfi para os nomes do nosso banco de dados
const nutrientMapping: { [key: string]: keyof NutritionalInfo } = {
    'valor energético': 'calories',
    'carboidratos': 'carbohydrates',
    'carboidratos totais': 'carbohydrates',
    'açúcares totais': 'totalSugars',
    'acucares totais': 'totalSugars',
    'açúcares adicionados': 'addedSugars',
    'acucares adicionados': 'addedSugars',
    'proteinas': 'proteins',
    'proteínas': 'proteins',
    'gorduras totais': 'totalFat',
    'gorduras saturadas': 'saturatedFat',
    'gorduras trans': 'transFat',
    'fibra alimentar': 'fiber',
    'sodio': 'sodium',
};

// Alérgenos comuns para verificação
const commonAllergens = [
	"leite", "ovos", "peixe", "crustáceos", "amendoim", "soja", "trigo",
	"centeio", "cevada", "aveia", "glúten", "amêndoa", "avelã", "castanha-de-caju",
	"castanha-do-pará", "macadâmia", "nozes", "pecã", "pistache",
];

/**
 * Extrai o valor numérico de uma string como "126 kcal" ou "14 g".
 */
function parseNutrientAmount(amount: string | null): number | undefined {
    if (!amount) return undefined;
    const match = amount.match(/(\d+[,.]?\d*)/);
    return match ? parseFloat(match[1].replace(',', '.')) : undefined;
}

/**
 * Extrai informações sobre alergênios do texto bruto.
 */
function extractAllergens(text: string): { contains: string[]; mayContain: string[] } {
	const contains: Set<string> = new Set();
	const mayContain: Set<string> = new Set();
    const cleanedText = text.toLowerCase().replace(/\s+/g, " ");

	const containsMatch = cleanedText.match(/alergicos\s*:\s*contem\s+([^.]+)/i);
	if (containsMatch) {
		const allergensText = containsMatch[1];
		commonAllergens.forEach(allergen => {
			if (new RegExp(`\\b${allergen}\\b`, 'i').test(allergensText)) {
				contains.add(allergen.charAt(0).toUpperCase() + allergen.slice(1));
			}
		});
	}

	const mayContainMatch = cleanedText.match(/pode conter\s+([^.]+)/i);
	if (mayContainMatch) {
		const allergensText = mayContainMatch[1];
		commonAllergens.forEach(allergen => {
			if (new RegExp(`\\b${allergen}\\b`, 'i').test(allergensText)) {
				mayContain.add(allergen.charAt(0).toUpperCase() + allergen.slice(1));
			}
		});
	}
	
	if (/contem gluten/i.test(cleanedText)) {
		contains.add("Glúten");
	}

	return {
		contains: Array.from(contains),
		mayContain: Array.from(mayContain),
	};
}


/**
 * Converte a resposta da API Veryfi para o nosso formato `NutritionalInfo`.
 */
export function parseVeryfiResponse(veryfiData: any): Partial<NutritionalInfo> {
    const parsedInfo: Partial<NutritionalInfo> = {
        allergensContains: [],
        allergensMayContain: [],
    };

    // Extrai o tamanho da porção
    parsedInfo.servingSize = veryfiData.serving_size || "";

    // A Veryfi pode retornar dados por porção ou por 100g. Priorizamos por porção.
    const nutritionTable = veryfiData.nutrition_facts_per_serving || veryfiData.nutrition_facts_per_package || [];

    // Mapeia os nutrientes da tabela
    for (const nutrient of nutritionTable) {
        const description = nutrient.nutrient_description?.toLowerCase().trim();
        const mappedKey = nutrientMapping[description];

        if (mappedKey) {
            // @ts-ignore
            parsedInfo[mappedKey] = parseNutrientAmount(nutrient.nutrient_amount);
        }
    }

    // Extrai alérgenos do texto bruto, pois a Veryfi não os estrutura
    if (veryfiData.text) {
        const allergens = extractAllergens(veryfiData.text);
        parsedInfo.allergensContains = allergens.contains;
        parsedInfo.allergensMayContain = allergens.mayContain;
    }

    return parsedInfo;
}