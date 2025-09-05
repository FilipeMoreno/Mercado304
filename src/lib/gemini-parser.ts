// src/lib/gemini-parser.ts

import { NutritionalInfo } from "@/types";

// --- SEÇÃO PARA O PARSER DO GEMINI (JSON) ---

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

function parseNutrientAmount(amount: string | null): number | undefined {
    if (!amount) return undefined;
    const match = amount.match(/(\d+[,.]?\d*)/);
    return match ? parseFloat(match[1].replace(',', '.')) : undefined;
}

export function parseGeminiResponse(geminiData: any): Partial<NutritionalInfo> {
    const parsedInfo: Partial<NutritionalInfo> = {
        allergensContains: [],
        allergensMayContain: [],
    };

    parsedInfo.servingSize = geminiData.servingSize || "";

    const nutritionTable = geminiData.nutrition_facts_per_serving || geminiData.nutrition_facts_per_package || [];

    for (const nutrient of nutritionTable) {
        const description = nutrient.nutrient_description?.toLowerCase().trim();
        const mappedKey = nutrientMapping[description];

        if (mappedKey) {
            // @ts-ignore
            parsedInfo[mappedKey] = parseNutrientAmount(nutrient.nutrient_amount);
        }
    }

    if (geminiData.text) {
        const allergens = extractAllergens(geminiData.text);
        parsedInfo.allergensContains = allergens.contains;
        parsedInfo.allergensMayContain = allergens.mayContain;
    }

    return parsedInfo;
}


// --- SEÇÃO PARA O PARSER DE TEXTO BRUTO (ANTIGO OCR-PARSER) ---

const nutrientTextMap = {
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

const commonAllergens = [
	"leite", "ovos", "peixe", "crustáceos", "amendoim", "soja", "trigo",
	"centeio", "cevada", "aveia", "glúten", "amêndoa", "avelã", "castanha-de-caju",
	"castanha-do-pará", "macadâmia", "nozes", "pecã", "pistache",
];

function cleanText(text: string): string {
	return text
		.toLowerCase()
		.replace(/(\r\n|\n|\r)/gm, " ")
		.replace(/\s+/g, " ")
		.replace(/,/g, ".")
		.replace(/informacao nutricional/i, "")
		.trim();
}

function extractValue(text: string, keywords: RegExp[]): number | undefined {
	for (const keyword of keywords) {
		const match = text.match(keyword);
		if (match) {
			const startIndex = match.index! + match[0].length;
			const remainingText = text.substring(startIndex);
			const valueMatch = remainingText.match(/(\d+(\.\d+)?)/);
			if (valueMatch) {
				const value = parseFloat(valueMatch[1]);
				if (value < 2000) return value;
			}
		}
	}
	return undefined;
}

function extractServingSize(text: string): string | undefined {
	const pattern = /por..o de (\d+(\.\d+)?\s*(?:g|ml))/i;
	const match = text.match(pattern);
	return match ? match[1] : undefined;
}

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
 * Função que orquestra a extração de dados de um texto de OCR bruto.
 */
export function parseOcrText(text: string): Partial<NutritionalInfo> {
	const cleaned = cleanText(text);
	const nutrients: { [key: string]: any } = {};

	for (const key in nutrientTextMap) {
		const keywords = nutrientTextMap[key as keyof typeof nutrientTextMap];
		const value = extractValue(cleaned, keywords);
		if (value !== undefined) {
			nutrients[key as keyof NutritionalInfo] = value;
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