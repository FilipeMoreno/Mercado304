// src/app/api/ocr/scan/route.ts

// Para usar o SDK oficial, seria necessário instalar com: npm install @google/generative-ai
import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

// Função auxiliar para converter a imagem de Base64 para o formato da API do Gemini
function dataUrlToGoogleGenerativeAIContent(dataUrl: string) {
	const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
	if (!match) {
		throw new Error("Formato de Data URL inválido")
	}
	return {
		inlineData: { mimeType: match[1], data: match[2] },
	}
}

export async function POST(request: Request) {
	try {
		const { imageUrl } = await request.json()
		const apiKey = process.env.GEMINI_API_KEY

		if (!apiKey) {
			console.error("Chave da API do Gemini não configurada.")
			return NextResponse.json({ error: "Configuração de IA ausente no servidor." }, { status: 500 })
		}

		if (!imageUrl) {
			return NextResponse.json({ error: "Nenhuma imagem fornecida." }, { status: 400 })
		}

		// Inicializa o cliente da IA com a sua chave
		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({
			model: "gemini-1.5-flash", // Modelo rápido e com boa capacidade multimodal
		})

		// Este é o "coração" da nossa lógica: o prompt.
		// Damos instruções claras ao Gemini sobre o que fazer e como formatar a resposta.
		const prompt = `
      Analise a imagem de uma tabela nutricional de um produto alimentício, possivelmente em português do Brasil.
      Extraia as seguintes informações e retorne-as ESTRITAMENTE em formato JSON.
      Se um valor não for encontrado na imagem, omita a chave ou use o valor null.
      Os valores numéricos devem ser extraídos como números (number), usando ponto como separador decimal.

      A estrutura do JSON de saída deve incluir campos obrigatórios e opcionais:
      {
        "servingSize": "string (ex: '100g', '200ml', '1 unidade')",
        
        // Campos obrigatórios
        "calories": number,
        "carbohydrates": number,
        "totalSugars": number,
        "addedSugars": number,
        "lactose": number,
        "galactose": number,
        "proteins": number,
        "totalFat": number,
        "saturatedFat": number,
        "transFat": number,
        "fiber": number,
        "sodium": number,
        
        // Vitaminas (se presentes)
        "vitaminA": number,
        "vitaminC": number,
        "vitaminD": number,
        "vitaminE": number,
        "vitaminK": number,
        "thiamine": number,
        "riboflavin": number,
        "niacin": number,
        "vitaminB6": number,
        "folate": number,
        "vitaminB12": number,
        "biotin": number,
        "pantothenicAcid": number,
        
        // Minerais (se presentes)
        "calcium": number,
        "iron": number,
        "magnesium": number,
        "phosphorus": number,
        "potassium": number,
        "zinc": number,
        "copper": number,
        "manganese": number,
        "selenium": number,
        "iodine": number,
        "chromium": number,
        "molybdenum": number,
        
        // Outros nutrientes (se presentes)
        "taurine": number,
        "caffeine": number,
        
        // Alérgenos
        "allergensContains": ["string"],
        "allergensMayContain": ["string"]
      }

      Instruções detalhadas para extração:
      CAMPOS OBRIGATÓRIOS:
      - "Valor energético" corresponde a "calories". Extraia o valor em kcal.
      - "Carboidratos" ou "Carboidratos totais" corresponde a "carbohydrates".
      - "Açúcares totais" corresponde a "totalSugars".
      - "Açúcares adicionados" corresponde a "addedSugars".
      - "Lactose" corresponde a "lactose".
      - "Galactose" corresponde a "galactose".
      - "Proteínas" corresponde a "proteins".
      - "Gorduras totais" corresponde a "totalFat".
      - "Gorduras saturadas" corresponde a "saturatedFat".
      - "Gorduras trans" corresponde a "transFat".
      - "Fibra alimentar" corresponde a "fiber".
      - "Sódio" corresponde a "sodium" (extrair em mg).
      
      VITAMINAS (se presentes na tabela):
      - "Vitamina A" ou "Vit. A" corresponde a "vitaminA" (mcg).
      - "Vitamina C" ou "Vit. C" ou "Ácido ascórbico" corresponde a "vitaminC" (mg).
      - "Vitamina D" ou "Vit. D" corresponde a "vitaminD" (mcg).
      - "Vitamina E" ou "Vit. E" corresponde a "vitaminE" (mg).
      - "Vitamina K" ou "Vit. K" corresponde a "vitaminK" (mcg).
      - "Tiamina" ou "Vitamina B1" ou "Vit. B1" corresponde a "thiamine" (mg).
      - "Riboflavina" ou "Vitamina B2" ou "Vit. B2" corresponde a "riboflavin" (mg).
      - "Niacina" ou "Vitamina B3" ou "Vit. B3" corresponde a "niacin" (mg).
      - "Vitamina B6" ou "Vit. B6" ou "Piridoxina" corresponde a "vitaminB6" (mg).
      - "Folato" ou "Ácido fólico" ou "Vitamina B9" corresponde a "folate" (mcg).
      - "Vitamina B12" ou "Vit. B12" ou "Cobalamina" corresponde a "vitaminB12" (mcg).
      - "Biotina" ou "Vitamina B7" ou "Vitamina H" corresponde a "biotin" (mcg).
      - "Ácido pantotênico" ou "Vitamina B5" corresponde a "pantothenicAcid" (mg).
      
      MINERAIS (se presentes na tabela):
      - "Cálcio" corresponde a "calcium" (mg).
      - "Ferro" corresponde a "iron" (mg).
      - "Magnésio" corresponde a "magnesium" (mg).
      - "Fósforo" corresponde a "phosphorus" (mg).
      - "Potássio" corresponde a "potassium" (mg).
      - "Zinco" corresponde a "zinc" (mg).
      - "Cobre" corresponde a "copper" (mg).
      - "Manganês" corresponde a "manganese" (mg).
      - "Selênio" corresponde a "selenium" (mcg).
      - "Iodo" corresponde a "iodine" (mcg).
      - "Cromo" ou "Crômio" corresponde a "chromium" (mcg).
      - "Molibdênio" corresponde a "molybdenum" (mcg).
      
      OUTROS NUTRIENTES (se presentes):
      - "Taurina" corresponde a "taurine" (mg).
      - "Cafeína" corresponde a "caffeine" (mg).
      
      ALÉRGENOS:
      - Para "allergensContains", procure por textos como "ALÉRGICOS: CONTÉM...".
      - Para "allergensMayContain", procure por textos como "PODE CONTER...".
      
      IMPORTANTE: 
      - PRIORIZE os valores da coluna "100 g" ou "100 ml". Se essa coluna não existir, use os valores da coluna "por porção".
      - Inclua TODOS os elementos nutricionais encontrados na tabela, mesmo que não sejam obrigatórios.
      - Converta unidades para os padrões especificados (mg, mcg, g, kcal).
    `

		const imagePart = dataUrlToGoogleGenerativeAIContent(imageUrl)

		// Envia o prompt e a imagem para o Gemini
		const result = await model.generateContent([prompt, imagePart])
		const responseText = result.response.text()

		// O Gemini pode retornar o JSON dentro de um bloco de código. Esta limpeza remove isso.
		const jsonString = responseText.replace(/```json\n?|```/g, "").trim()
		const parsedJson = JSON.parse(jsonString)

		return NextResponse.json(parsedJson)
	} catch (error) {
		console.error("Erro na chamada da API Gemini:", error)
		return NextResponse.json({ error: "Erro ao processar a imagem com a IA." }, { status: 500 })
	}
}
