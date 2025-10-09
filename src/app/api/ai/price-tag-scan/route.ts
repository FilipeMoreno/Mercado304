import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: NextRequest) {
	try {
		const { imageUrl, marketId } = await request.json()

		if (!imageUrl) {
			return NextResponse.json(
				{ success: false, message: "Imagem é obrigatória" },
				{ status: 400 }
			)
		}

		if (!marketId) {
			return NextResponse.json(
				{ success: false, message: "ID do mercado é obrigatório" },
				{ status: 400 }
			)
		}

		// Converter data URL para base64 puro
		const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, "")

		const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

		const prompt = `
Analise esta imagem de uma etiqueta de preço de supermercado e extraia as seguintes informações:

1. CÓDIGO DE BARRAS: Identifique e extraia o código de barras (geralmente 13 dígitos EAN-13 ou 8 dígitos EAN-8)
2. PREÇO: Identifique o preço do produto (pode estar em formato R$ X,XX ou similar)
3. NOME DO PRODUTO: Se visível, extraia o nome/descrição do produto
4. PESO/QUANTIDADE: Se aplicável, extraia informações de peso ou quantidade

INSTRUÇÕES IMPORTANTES:
- Seja muito preciso na leitura do código de barras - cada dígito é crucial
- O preço deve ser extraído como número decimal (ex: 15.99 para R$ 15,99)
- Se não conseguir identificar alguma informação com certeza, indique como null
- Priorize precisão sobre velocidade

Retorne APENAS um JSON válido no seguinte formato:
{
  "barcode": "string ou null",
  "price": number ou null,
  "productName": "string ou null",
  "weight": "string ou null",
  "confidence": number (0-1),
  "rawText": "texto extraído da imagem"
}

Exemplo de resposta:
{
  "barcode": "7891234567890",
  "price": 15.99,
  "productName": "Arroz Branco 5kg",
  "weight": "5kg",
  "confidence": 0.95,
  "rawText": "ARROZ BRANCO 5KG\\nR$ 15,99\\n7891234567890"
}
`

		const result = await model.generateContent([
			prompt,
			{
				inlineData: {
					data: base64Data,
					mimeType: "image/jpeg",
				},
			},
		])

		const response = await result.response
		const text = response.text()

		console.log("Resposta bruta do Gemini:", text)

		// Tentar extrair JSON da resposta
		let extractedData
		try {
			// Remover possíveis marcadores de código
			const cleanText = text.replace(/```json\n?|\n?```/g, "").trim()
			extractedData = JSON.parse(cleanText)
		} catch (parseError) {
			console.error("Erro ao fazer parse da resposta:", parseError)
			console.error("Texto recebido:", text)
			
			// Tentar extrair informações manualmente se o JSON falhar
			const barcodeMatch = text.match(/\b\d{8,13}\b/)
			const priceMatch = text.match(/(?:R\$\s*)?(\d+[,.]?\d*)/i)
			
			extractedData = {
				barcode: barcodeMatch ? barcodeMatch[0] : null,
				price: priceMatch ? parseFloat(priceMatch[1].replace(",", ".")) : null,
				productName: null,
				weight: null,
				confidence: 0.5,
				rawText: text
			}
		}

		// Validar dados extraídos
		if (!extractedData.barcode || !extractedData.price) {
			return NextResponse.json({
				success: false,
				message: "Não foi possível extrair código de barras ou preço da etiqueta",
				data: extractedData,
			})
		}

		// Validar formato do código de barras (EAN-8 ou EAN-13)
		const barcode = extractedData.barcode.toString()
		if (!/^\d{8}$|^\d{13}$/.test(barcode)) {
			return NextResponse.json({
				success: false,
				message: "Código de barras inválido. Deve ter 8 ou 13 dígitos",
				data: extractedData,
			})
		}

		// Validar preço
		const price = parseFloat(extractedData.price)
		if (isNaN(price) || price <= 0) {
			return NextResponse.json({
				success: false,
				message: "Preço inválido extraído da etiqueta",
				data: extractedData,
			})
		}

		return NextResponse.json({
			success: true,
			barcode: barcode,
			price: price,
			productName: extractedData.productName,
			weight: extractedData.weight,
			confidence: extractedData.confidence || 0.8,
			rawText: extractedData.rawText,
			marketId: marketId,
		})

	} catch (error: any) {
		console.error("Erro ao processar imagem:", error)
		
		let errorMessage = "Erro interno do servidor"
		if (error.message?.includes("API key")) {
			errorMessage = "Erro de configuração da API"
		} else if (error.message?.includes("quota")) {
			errorMessage = "Limite de uso da API atingido"
		} else if (error.message?.includes("network")) {
			errorMessage = "Erro de conexão com a API"
		}

		return NextResponse.json(
			{ 
				success: false, 
				message: errorMessage,
				error: process.env.NODE_ENV === "development" ? error.message : undefined
			},
			{ status: 500 }
		)
	}
}