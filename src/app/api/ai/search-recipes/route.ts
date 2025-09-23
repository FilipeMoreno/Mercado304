import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { search, ingredients, mealTypes } = body

		// Construir prompt para IA baseado nos parâmetros
		let prompt = "Crie receitas baseadas nos seguintes critérios:\n\n"

		if (search) {
			prompt += `Descrição desejada: ${search}\n`
		}

		if (ingredients && ingredients.length > 0) {
			prompt += `Ingredientes disponíveis: ${ingredients.join(", ")}\n`
		}

		if (mealTypes && mealTypes.length > 0) {
			const mealTypeLabels = {
				cafe_da_manha: "Café da Manhã",
				almoco: "Almoço",
				jantar: "Jantar",
				lanche: "Lanche",
				sobremesa: "Sobremesa",
				entrada: "Entrada",
			}
			const mealTypeNames = mealTypes.map((type: string) => mealTypeLabels[type as keyof typeof mealTypeLabels] || type)
			prompt += `Tipos de refeição: ${mealTypeNames.join(", ")}\n`
		}

		prompt += `
Gere 3-5 receitas diferentes que atendam aos critérios. Para cada receita, retorne no formato JSON:

{
	"sugestoes": [
		{
			"refeicao": "tipo da refeição",
			"prato": "nome do prato",
			"descricao": "breve descrição atrativa",
			"tempo_preparo": "tempo estimado",
			"ingredientes": ["lista", "de", "ingredientes", "com", "quantidades"],
			"modo_preparo": "Passo 1: [instrução detalhada]\nPasso 2: [instrução detalhada]\nPasso 3: [instrução detalhada]\n...",
			"dica_chef": "dica especial do chef"
		}
	]
}

IMPORTANTE: 
- O campo "modo_preparo" deve conter instruções DETALHADAS passo a passo
- Cada passo deve começar com "Passo X:" seguido da instrução
- Seja específico sobre tempos, temperaturas e técnicas
- Use ingredientes comuns e técnicas acessíveis`

		// Usar a biblioteca oficial do Google
		const model = genAI.getGenerativeModel({
			model: "gemini-1.5-flash",
			generationConfig: {
				temperature: 0.8,
				topK: 40,
				topP: 0.95,
				maxOutputTokens: 2048,
			},
		})

		const result = await model.generateContent(prompt)
		const response = await result.response
		let aiResponse = response.text()

		if (!aiResponse) {
			throw new Error("Resposta vazia da IA")
		}

		// Parse da resposta JSON
		try {
			// Limpar possível markdown
			aiResponse = aiResponse.replace(/```json\s*/, "").replace(/```\s*$/, "")
			const recipes = JSON.parse(aiResponse)

			return NextResponse.json(recipes)
		} catch (parseError) {
			console.error("Erro ao fazer parse da resposta da IA:", parseError)
			console.log("Resposta da IA:", aiResponse)

			// Fallback: retornar resposta como texto
			return NextResponse.json({
				sugestoes: [
					{
						refeicao: "Sugestão",
						prato: "Receita Personalizada",
						descricao: "Receita criada pela IA",
						tempo_preparo: "30 minutos",
						ingredientes: ingredients || ["Ingredientes diversos"],
						modo_preparo: aiResponse,
						dica_chef: "Ajuste os temperos ao seu gosto!",
					},
				],
			})
		}
	} catch (error) {
		console.error("Erro ao buscar receitas com IA:", error)
		return NextResponse.json({ error: "Erro ao gerar receitas com IA" }, { status: 500 })
	}
}
