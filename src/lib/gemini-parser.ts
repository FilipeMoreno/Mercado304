import type { NutritionalInfo } from "@/types"

// Mapeamento de alérgenos detectados pela IA para os nomes padrão do formulário
const allergenMapping: { [key: string]: string } = {
	// Variações comuns do português
	leite: "Leite",
	lactose: "Leite",
	"derivados de leite": "Leite",
	"produtos lácteos": "Leite",
	ovos: "Ovos",
	ovo: "Ovos",
	albumina: "Ovos",
	peixe: "Peixe",
	peixes: "Peixe",
	crustáceos: "Crustáceos",
	crustaceos: "Crustáceos",
	camarão: "Crustáceos",
	lagosta: "Crustáceos",
	amendoim: "Amendoim",
	soja: "Soja",
	trigo: "Trigo",
	centeio: "Centeio",
	cevada: "Cevada",
	aveia: "Aveia",
	glúten: "Glúten",
	gluten: "Glúten",
	amêndoa: "Amêndoa",
	amêndoas: "Amêndoa",
	avelã: "Avelã",
	avelãs: "Avelã",
	"castanha de caju": "Castanha-de-caju",
	"castanha-de-caju": "Castanha-de-caju",
	"castanha do pará": "Castanha-do-Pará",
	"castanha-do-pará": "Castanha-do-Pará",
	macadâmia: "Macadâmia",
	macadamia: "Macadâmia",
	nozes: "Nozes",
	noz: "Nozes",
	pecã: "Pecã",
	peca: "Pecã",
	pistache: "Pistache",
	triticale: "Triticale",

	// Variações em inglês que podem aparecer
	milk: "Leite",
	egg: "Ovos",
	fish: "Peixe",
	shellfish: "Crustáceos",
	peanut: "Amendoim",
	soy: "Soja",
	wheat: "Trigo",
	rye: "Centeio",
	barley: "Cevada",
	oats: "Aveia",
	almond: "Amêndoa",
	hazelnut: "Avelã",
	cashew: "Castanha-de-caju",
	"brazil nut": "Castanha-do-Pará",
	walnut: "Nozes",
	pecan: "Pecã",
	pistachio: "Pistache",
}

// Função para mapear alérgenos detectados para os nomes padrão
function mapAllergens(detectedAllergens: string[]): string[] {
	if (!Array.isArray(detectedAllergens)) return []

	const mappedAllergens = new Set<string>()

	detectedAllergens.forEach((allergen) => {
		if (typeof allergen !== "string") return

		const cleanAllergen = allergen.toLowerCase().trim()

		// Procurar correspondência exata
		if (allergenMapping[cleanAllergen]) {
			mappedAllergens.add(allergenMapping[cleanAllergen])
			return
		}

		// Procurar correspondência parcial
		for (const [key, value] of Object.entries(allergenMapping)) {
			if (cleanAllergen.includes(key) || key.includes(cleanAllergen)) {
				mappedAllergens.add(value)
				break
			}
		}
	})

	return Array.from(mappedAllergens)
}

const _nutrientMapping: { [key: string]: keyof NutritionalInfo } = {
	"valor energético": "calories",
	carboidratos: "carbohydrates",
	"carboidratos totais": "carbohydrates",
	"açúcares totais": "totalSugars",
	"acucares totais": "totalSugars",
	"açúcares adicionados": "addedSugars",
	"acucares adicionados": "addedSugars",
	proteinas: "proteins",
	proteínas: "proteins",
	"gorduras totais": "totalFat",
	"gorduras saturadas": "saturatedFat",
	"gorduras trans": "transFat",
	"fibra alimentar": "fiber",
	sodio: "sodium",
}

function _parseNutrientAmount(amount: string | null): number | undefined {
	if (!amount) return undefined
	const match = amount.match(/(\d+[,.]?\d*)/)
	return match ? parseFloat(match[1].replace(",", ".")) : undefined
}

export function parseGeminiResponse(geminiData: any): Partial<NutritionalInfo> {
	// Mapear alérgenos detectados para os nomes padrão do formulário
	const mappedContains = mapAllergens(geminiData.allergensContains || [])
	const mappedMayContain = mapAllergens(geminiData.allergensMayContain || [])

	const parsedInfo: Partial<NutritionalInfo> = {
		allergensContains: mappedContains,
		allergensMayContain: mappedMayContain,
	}

	// Informações da Tabela Nutricional Obrigatórias
	parsedInfo.servingSize = geminiData.servingSize || ""
	parsedInfo.servingsPerPackage = geminiData.servingsPerPackage
	parsedInfo.calories = geminiData.calories
	parsedInfo.carbohydrates = geminiData.carbohydrates
	parsedInfo.totalSugars = geminiData.totalSugars
	parsedInfo.addedSugars = geminiData.addedSugars
	parsedInfo.proteins = geminiData.proteins
	parsedInfo.totalFat = geminiData.totalFat
	parsedInfo.saturatedFat = geminiData.saturatedFat
	parsedInfo.transFat = geminiData.transFat
	parsedInfo.fiber = geminiData.fiber
	parsedInfo.sodium = geminiData.sodium

	// Vitaminas (valores opcionais)
	parsedInfo.vitaminA = geminiData.vitaminA
	parsedInfo.vitaminC = geminiData.vitaminC
	parsedInfo.vitaminD = geminiData.vitaminD
	parsedInfo.vitaminE = geminiData.vitaminE
	parsedInfo.vitaminK = geminiData.vitaminK
	parsedInfo.thiamine = geminiData.thiamine
	parsedInfo.riboflavin = geminiData.riboflavin
	parsedInfo.niacin = geminiData.niacin
	parsedInfo.vitaminB6 = geminiData.vitaminB6
	parsedInfo.folate = geminiData.folate
	parsedInfo.vitaminB12 = geminiData.vitaminB12
	parsedInfo.biotin = geminiData.biotin
	parsedInfo.pantothenicAcid = geminiData.pantothenicAcid

	// Outros nutrientes (valores opcionais)
	parsedInfo.lactose = geminiData.lactose
	parsedInfo.galactose = geminiData.galactose
	parsedInfo.taurine = geminiData.taurine
	parsedInfo.caffeine = geminiData.caffeine

	// Ácidos graxos e gorduras especiais (valores opcionais)
	parsedInfo.omega3 = geminiData.omega3
	parsedInfo.omega6 = geminiData.omega6
	parsedInfo.monounsaturatedFat = geminiData.monounsaturatedFat
	parsedInfo.polyunsaturatedFat = geminiData.polyunsaturatedFat
	parsedInfo.cholesterol = geminiData.cholesterol
	parsedInfo.epa = geminiData.epa
	parsedInfo.dha = geminiData.dha
	parsedInfo.linolenicAcid = geminiData.linolenicAcid

	// Minerais (valores opcionais)
	parsedInfo.calcium = geminiData.calcium
	parsedInfo.iron = geminiData.iron
	parsedInfo.magnesium = geminiData.magnesium
	parsedInfo.phosphorus = geminiData.phosphorus
	parsedInfo.potassium = geminiData.potassium
	parsedInfo.zinc = geminiData.zinc
	parsedInfo.copper = geminiData.copper
	parsedInfo.manganese = geminiData.manganese
	parsedInfo.selenium = geminiData.selenium
	parsedInfo.iodine = geminiData.iodine
	parsedInfo.chromium = geminiData.chromium
	parsedInfo.molybdenum = geminiData.molybdenum

	return parsedInfo
}

// --- SEÇÃO PARA O PARSER DE TEXTO BRUTO (ANTIGO OCR-PARSER) ---

const nutrientTextMap = {
	// Informações da Tabela Nutricional Obrigatórias
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

	// Vitaminas (valores opcionais)
	vitaminA: [/vitamina a/i, /vit\.?\s*a/i],
	vitaminC: [/vitamina c/i, /vit\.?\s*c/i, /ácido ascórbico/i],
	vitaminD: [/vitamina d/i, /vit\.?\s*d/i],
	vitaminE: [/vitamina e/i, /vit\.?\s*e/i],
	vitaminK: [/vitamina k/i, /vit\.?\s*k/i],
	thiamine: [/tiamina/i, /vitamina b1/i, /vit\.?\s*b1/i],
	riboflavin: [/riboflavina/i, /vitamina b2/i, /vit\.?\s*b2/i],
	niacin: [/niacina/i, /vitamina b3/i, /vit\.?\s*b3/i, /ácido nicotínico/i],
	vitaminB6: [/vitamina b6/i, /vit\.?\s*b6/i, /piridoxina/i],
	folate: [/folato/i, /ácido fólico/i, /vitamina b9/i, /vit\.?\s*b9/i],
	vitaminB12: [/vitamina b12/i, /vit\.?\s*b12/i, /cobalamina/i],
	biotin: [/biotina/i, /vitamina b7/i, /vit\.?\s*b7/i, /vitamina h/i],
	pantothenicAcid: [/ácido pantotênico/i, /vitamina b5/i, /vit\.?\s*b5/i],

	// Outros nutrientes (valores opcionais)
	taurine: [/taurina/i],
	caffeine: [/cafeína/i, /cafeina/i],
	lactose: [/lactose/i],
	galactose: [/galactose/i],

	// Ácidos graxos e gorduras especiais (valores opcionais)
	omega3: [/ômega 3/i, /omega 3/i, /ácido graxo ômega 3/i, /omega-3/i],
	omega6: [/ômega 6/i, /omega 6/i, /ácido graxo ômega 6/i, /omega-6/i],
	monounsaturatedFat: [/gordura monoinsaturada/i, /ácidos graxos monoinsaturados/i, /monoinsaturados/i],
	polyunsaturatedFat: [
		/gordura poli-insaturada/i,
		/gordura poliinsaturada/i,
		/ácidos graxos poli-insaturados/i,
		/poliinsaturados/i,
	],
	cholesterol: [/colesterol/i],
	epa: [/EPA/i, /ácido eicosapentaenóico/i],
	dha: [/DHA/i, /ácido docosahexaenóico/i],
	linolenicAcid: [/ácido linolênico/i, /ácido linolenico/i],

	// Minerais (valores opcionais)
	calcium: [/cálcio/i, /calcio/i],
	iron: [/ferro/i],
	magnesium: [/magnésio/i, /magnesio/i],
	phosphorus: [/fósforo/i, /fosforo/i],
	potassium: [/potássio/i, /potassio/i],
	zinc: [/zinco/i],
	copper: [/cobre/i],
	manganese: [/manganês/i, /manganes/i],
	selenium: [/selênio/i, /selenio/i],
	iodine: [/iodo/i],
	chromium: [/cromo/i, /crômio/i],
	molybdenum: [/molibdênio/i, /molibdenio/i],
}

const commonAllergens = [
	"leite",
	"ovos",
	"peixe",
	"crustáceos",
	"amendoim",
	"soja",
	"trigo",
	"centeio",
	"cevada",
	"aveia",
	"glúten",
	"amêndoa",
	"avelã",
	"castanha-de-caju",
	"castanha-do-pará",
	"macadâmia",
	"nozes",
	"pecã",
	"pistache",
]

function cleanText(text: string): string {
	return text
		.toLowerCase()
		.replace(/(\r\n|\n|\r)/gm, " ")
		.replace(/\s+/g, " ")
		.replace(/,/g, ".")
		.replace(/informacao nutricional/i, "")
		.trim()
}

function extractValue(text: string, keywords: RegExp[]): number | undefined {
	for (const keyword of keywords) {
		const match = text.match(keyword)
		if (match) {
			const startIndex = match.index! + match[0].length
			const remainingText = text.substring(startIndex)
			const valueMatch = remainingText.match(/(\d+(\.\d+)?)/)
			if (valueMatch) {
				const value = parseFloat(valueMatch[1])
				if (value < 2000) return value
			}
		}
	}
	return undefined
}

function extractServingSize(text: string): string | undefined {
	const pattern = /por..o de (\d+(\.\d+)?\s*(?:g|ml))/i
	const match = text.match(pattern)
	return match ? match[1] : undefined
}

function extractServingsPerPackage(text: string): number | undefined {
	// Padrões para identificar quantidade de porções
	const patterns = [
		/por[çc][õo]es por embalagem:?\s*(\d+(?:[,.]?\d+)?)/i,
		/(\d+(?:[,.]?\d+)?)\s*por[çc][õo]es por embalagem/i,
		/embalagem cont[eé]m:?\s*(\d+(?:[,.]?\d+)?)\s*por[çc][õo]es/i,
		/cont[eé]m:?\s*(\d+(?:[,.]?\d+)?)\s*por[çc][õo]es/i,
		/(\d+(?:[,.]?\d+)?)\s*por[çc][õo]es/i,
		/quantidade de por[çc][õo]es:?\s*(\d+(?:[,.]?\d+)?)/i,
		/total de por[çc][õo]es:?\s*(\d+(?:[,.]?\d+)?)/i,
	]

	for (const pattern of patterns) {
		const match = text.match(pattern)
		if (match) {
			const value = parseFloat(match[1].replace(",", "."))
			if (value > 0 && value <= 100) {
				// Validação básica
				return value
			}
		}
	}
	return undefined
}

function extractAllergens(text: string): {
	contains: string[]
	mayContain: string[]
} {
	const contains: string[] = []
	const mayContain: string[] = []
	const cleanedText = text.toLowerCase().replace(/\s+/g, " ")

	const containsMatch = cleanedText.match(/alergicos\s*:\s*contem\s+([^.]+)/i)
	if (containsMatch) {
		const allergensText = containsMatch[1]
		commonAllergens.forEach((allergen) => {
			if (new RegExp(`\\b${allergen}\\b`, "i").test(allergensText)) {
				contains.push(allergen)
			}
		})
	}

	const mayContainMatch = cleanedText.match(/pode conter\s+([^.]+)/i)
	if (mayContainMatch) {
		const allergensText = mayContainMatch[1]
		commonAllergens.forEach((allergen) => {
			if (new RegExp(`\\b${allergen}\\b`, "i").test(allergensText)) {
				mayContain.push(allergen)
			}
		})
	}

	if (/contem gluten/i.test(cleanedText)) {
		contains.push("glúten")
	}

	return {
		contains: mapAllergens(contains),
		mayContain: mapAllergens(mayContain),
	}
}

/**
 * Função que orquestra a extração de dados de um texto de OCR bruto.
 */
export function parseOcrText(text: string): Partial<NutritionalInfo> {
	const cleaned = cleanText(text)
	const nutrients: { [key: string]: any } = {}

	for (const key in nutrientTextMap) {
		const keywords = nutrientTextMap[key as keyof typeof nutrientTextMap]
		const value = extractValue(cleaned, keywords)
		if (value !== undefined) {
			nutrients[key as keyof NutritionalInfo] = value
		}
	}

	const servingSize = extractServingSize(cleaned)
	const servingsPerPackage = extractServingsPerPackage(cleaned)
	const allergens = extractAllergens(cleaned)

	return {
		servingSize,
		servingsPerPackage,
		...nutrients,
		allergensContains: allergens.contains,
		allergensMayContain: allergens.mayContain,
	}
}
