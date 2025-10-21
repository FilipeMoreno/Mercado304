import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Função para buscar código de barras online
async function searchBarcodeOnline(productName: string, brand: string): Promise<string | null> {
	try {
		// Usar o Gemini para buscar informações de código de barras
		const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

		const searchPrompt = `
Preciso encontrar o código de barras (EAN/UPC) para o produto:
- Nome: ${productName}
- Marca: ${brand}

Por favor, forneça APENAS o código de barras numérico (EAN-13, EAN-8 ou UPC) se você souber.
Se não souber o código exato, responda apenas "null".
Não invente códigos de barras.

Resposta (apenas o número ou "null"):`

		const result = await model.generateContent(searchPrompt)
		const response = await result.response
		const text = response.text().trim()

		// Verificar se é um código de barras válido (apenas números, 8-14 dígitos)
		const barcodeMatch = text.match(/^\d{8,14}$/)
		if (barcodeMatch && text !== "null") {
			return text
		}

		return null
	} catch (error) {
		console.error("Erro ao buscar código de barras:", error)
		return null
	}
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const image = formData.get("image") as File

		if (!image) {
			return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 })
		}

		// Converter imagem para base64
		const bytes = await image.arrayBuffer()
		const buffer = Buffer.from(bytes)
		const base64Image = buffer.toString("base64")

		// Configurar o modelo Gemini
		const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

		const prompt = `
Analise esta imagem de produto e extraia as seguintes informações em formato JSON:

{
  "productName": "Nome do produto (string)",
  "brand": "Marca do produto (string)",
  "barcode": "Código de barras se visível (string ou null)",
  "category": "Categoria do produto (string)",
  "description": "Descrição detalhada do produto (string)",
  "weight": "Peso/quantidade se visível (string ou null)",
  "price": "Preço se visível (number ou null)",
  "ingredients": "Lista de ingredientes se visível (array de strings ou null)",
  "nutritionalInfo": "Informações nutricionais se visíveis (object ou null)",
  "confidence": "Nível de confiança na identificação de 0 a 1 (number)"
}

Regras importantes:
1. Se não conseguir identificar alguma informação, use null
2. Para productName, seja específico (ex: "Coca-Cola 350ml" ao invés de apenas "Refrigerante")
3. Para category, use categorias comuns como "Bebidas", "Alimentos", "Limpeza", etc.
4. Para barcode, procure por códigos de barras visíveis na embalagem
5. Para weight, inclua a unidade (ml, g, kg, etc.)
6. Para price, extraia apenas números (ex: 3.50)
7. Seja preciso e detalhado na description
8. confidence deve refletir quão certo você está da identificação

Responda APENAS com o JSON válido, sem texto adicional.`

		const result = await model.generateContent([
			{
				inlineData: {
					mimeType: image.type,
					data: base64Image,
				},
			},
			{ text: prompt },
		])

		const response = await result.response
		const text = response.text()

		// Tentar fazer parse do JSON
		let productData
		try {
			// Remover possíveis caracteres extras e extrair apenas o JSON
			const jsonMatch = text.match(/\{[\s\S]*\}/)
			if (!jsonMatch) {
				throw new Error("Resposta não contém JSON válido")
			}
			productData = JSON.parse(jsonMatch[0])
		} catch (_parseError) {
			console.error("Erro ao fazer parse da resposta:", text)
			return NextResponse.json({ error: "Erro ao processar resposta da IA" }, { status: 500 })
		}

		// Validar dados essenciais
		if (!productData.productName || productData.confidence < 0.3) {
			return NextResponse.json(
				{ error: "Não foi possível identificar o produto com confiança suficiente" },
				{ status: 400 },
			)
		}

		// Se não encontrou código de barras, tentar buscar online
		if (!productData.barcode && productData.productName && productData.brand) {
			try {
				const barcodeFromWeb = await searchBarcodeOnline(productData.productName, productData.brand)
				if (barcodeFromWeb) {
					productData.barcode = barcodeFromWeb
					productData.barcodeSource = "web_search"
				}
			} catch (error) {
				console.log("Erro ao buscar código de barras online:", error)
				// Não falha a requisição se não conseguir buscar online
			}
		}

		return NextResponse.json({
			success: true,
			product: productData,
		})
	} catch (error) {
		console.error("Erro na análise do produto:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
