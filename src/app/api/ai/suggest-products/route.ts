import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface SuggestedProduct {
	name: string
	category: string
	reason: string
	confidence: number
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

		const { items } = await request.json()
		const apiKey = process.env.GEMINI_API_KEY

		if (!apiKey) {
			console.error("Chave da API do Gemini não configurada.")
			return NextResponse.json({ error: "Configuração de IA ausente no servidor." }, { status: 500 })
		}

		if (!items || items.length === 0) {
			return NextResponse.json({ error: "Lista de itens é obrigatória" }, { status: 400 })
		}

		// Buscar produtos existentes para referência
		const existingProducts = await prisma.product.findMany({
			select: {
				id: true,
				name: true,
				category: {
					select: {
						name: true,
					},
				},
			},
			take: 200,
		})

		const prompt = `Você é um assistente de compras inteligente. Analise a lista de compras abaixo e sugira produtos que o usuário pode ter esquecido de adicionar.

LISTA ATUAL:
${items.map((item: any) => `- ${item.name || item.tempName} (quantidade: ${item.quantity})`).join("\n")}

PRODUTOS DISPONÍVEIS NO SISTEMA:
${existingProducts.map((p) => `${p.name} (${p.category?.name || "Sem categoria"})`).join(", ")}

INSTRUÇÕES:
1. Analise os itens da lista e identifique padrões de compra
2. Sugira de 3 a 8 produtos complementares que fazem sentido com a lista
3. Priorize produtos que existem no sistema
4. Considere:
   - Produtos complementares (ex: se tem macarrão, sugerir molho)
   - Itens básicos que podem estar faltando (ex: pão, leite, ovos)
   - Produtos da mesma categoria dos itens listados
   - Ingredientes comuns para receitas
5. Para cada sugestão, forneça uma razão clara e objetiva
6. Atribua um nível de confiança de 0.0 a 1.0

FORMATO DE RESPOSTA (JSON):
{
  "suggestions": [
    {
      "name": "Nome do produto",
      "category": "Categoria",
      "reason": "Motivo da sugestão",
      "confidence": 0.85
    }
  ]
}

Retorne APENAS o JSON, sem explicações adicionais.`

		// Inicializar o cliente da IA
		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

		const result = await model.generateContent(prompt)
		const response = await result.response
		const text = response.text()

		// Parse da resposta JSON
		let analysisResult
		try {
			const jsonText = text.replace(/```json\n?|\n?```/g, "").trim()
			analysisResult = JSON.parse(jsonText)
		} catch (parseError) {
			console.error("Erro ao fazer parse da resposta da IA:", parseError)
			console.error("Resposta original:", text)
			return NextResponse.json({ error: "Erro ao processar resposta da IA" }, { status: 500 })
		}

		// Fazer matching das sugestões com produtos existentes
		const suggestionsWithMatching = analysisResult.suggestions.map((suggestion: SuggestedProduct) => {
			const matchedProduct = existingProducts.find(
				(product) =>
					product.name.toLowerCase().includes(suggestion.name.toLowerCase()) ||
					suggestion.name.toLowerCase().includes(product.name.toLowerCase()),
			)

			return {
				id: crypto.randomUUID(),
				name: suggestion.name,
				category: suggestion.category,
				reason: suggestion.reason,
				confidence: suggestion.confidence,
				isMatched: !!matchedProduct,
				matchedProductId: matchedProduct?.id,
				matchedProductName: matchedProduct?.name,
			}
		})

		return NextResponse.json({
			suggestions: suggestionsWithMatching,
			totalSuggestions: suggestionsWithMatching.length,
		})
	} catch (error) {
		console.error("Erro ao sugerir produtos:", error)
		return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
	}
}
