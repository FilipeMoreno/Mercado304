import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface ProcessedItem {
	id: string
	name: string
	quantity: number
	originalText: string
	isMatched: boolean
	matchedProductId?: string
	matchedProductName?: string
	confidence: number
}

// Função auxiliar para converter a imagem de Base64 para o formato da API do Gemini
function dataUrlToGoogleGenerativeAIContent(dataUrl: string) {
	const match = dataUrl.match(/^data:(.+);base64,(.+)$/)
	if (!match) {
		throw new Error("Formato de Data URL inválido")
	}
	return {
		inlineData: { mimeType: match[1] || "image/jpeg", data: match[2] || "" },
	}
}

export async function POST(request: NextRequest) {
	try {
		// Verificar autenticação
		const session = await auth.api.getSession({
			headers: request.headers,
		})

		if (!session) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const { image } = await request.json()
		const apiKey = process.env.GEMINI_API_KEY

		if (!apiKey) {
			console.error("Chave da API do Gemini não configurada.")
			return NextResponse.json({ error: "Configuração de IA ausente no servidor." }, { status: 500 })
		}

		if (!image) {
			return NextResponse.json({ error: "Imagem é obrigatória" }, { status: 400 })
		}

		// Buscar produtos existentes para matching
		const existingProducts = await prisma.product.findMany({
			select: {
				id: true,
				name: true,
			},
		})

		// Preparar prompt para análise
		const prompt = `
Analise esta imagem de uma lista de compras e extraia os itens listados.

Para cada item identificado, retorne um JSON com a seguinte estrutura:
{
	"items": [
		{
			"id": "uuid_gerado",
			"name": "nome_do_item_normalizado",
			"quantity": numero_quantidade_ou_1_se_nao_especificado,
			"originalText": "texto_original_da_imagem"
		}
	]
}

INSTRUÇÕES IMPORTANTES:
1. Normalize os nomes dos produtos (ex: "leite" em vez de "LEITE", "pão de açúcar" em vez de "pao acucar")
2. Se não houver quantidade especificada, use 1
3. Ignore riscos, marcações ou itens já riscados
4. Foque apenas em itens de supermercado/alimentícios
5. Se a imagem não contém uma lista de compras, retorne {"items": []}
6. Gere IDs únicos para cada item
7. Mantenha o texto original encontrado na imagem

Produtos existentes no sistema para referência:
${existingProducts.map((p) => p.name).join(", ")}

Retorne APENAS o JSON, sem explicações adicionais.
`

		// Inicializar o cliente da IA
		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

		// Converter imagem para formato do Gemini
		const imagePart = dataUrlToGoogleGenerativeAIContent(image)

		const result = await model.generateContent([prompt, imagePart])

		const response = await result.response
		const text = response.text()

		// Parse da resposta JSON
		let analysisResult
		try {
			// Limpar possível markdown ou texto extra
			const jsonText = text.replace(/```json\n?|\n?```/g, "").trim()
			analysisResult = JSON.parse(jsonText)
		} catch (parseError) {
			console.error("Erro ao fazer parse da resposta da IA:", parseError)
			console.error("Resposta original:", text)
			return NextResponse.json({ error: "Erro ao processar resposta da IA" }, { status: 500 })
		}

		// Fazer matching com produtos existentes
		const itemsWithMatching: ProcessedItem[] = analysisResult.items.map(
			(item: { id?: string; name: string; quantity?: number; originalText?: string }): ProcessedItem => {
				const matchedProduct = existingProducts.find(
					(product) =>
						product.name.toLowerCase().includes(item.name.toLowerCase()) ||
						item.name.toLowerCase().includes(product.name.toLowerCase()),
				)

				const processedItem: ProcessedItem = {
					id: item.id || crypto.randomUUID(),
					name: item.name,
					quantity: item.quantity || 1,
					originalText: item.originalText || item.name,
					isMatched: !!matchedProduct,
					confidence: matchedProduct ? 0.8 : 0.0,
				}

				if (matchedProduct) {
					processedItem.matchedProductId = matchedProduct.id
					processedItem.matchedProductName = matchedProduct.name
				}

				return processedItem
			},
		)

		return NextResponse.json({
			items: itemsWithMatching,
			totalItems: itemsWithMatching.length,
			matchedItems: itemsWithMatching.filter((processedItem) => processedItem.isMatched).length,
		})
	} catch (error) {
		console.error("Erro ao analisar lista de compras:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
