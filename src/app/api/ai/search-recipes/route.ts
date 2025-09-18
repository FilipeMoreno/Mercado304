import { NextResponse } from "next/server"

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
				entrada: "Entrada"
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
			"ingredientes": ["lista", "de", "ingredientes"],
			"modo_preparo": "instruções passo a passo detalhadas",
			"dica_chef": "dica especial do chef"
		}
	]
}

Seja criativo mas prático. Use ingredientes comuns e técnicas acessíveis.`

		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.8,
					topK: 40,
					topP: 0.95,
					maxOutputTokens: 2048,
				},
			}),
		})

		if (!response.ok) {
			throw new Error(`Erro da API do Gemini: ${response.status}`)
		}

		const data = await response.json()
		let aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

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
				sugestoes: [{
					refeicao: "Sugestão",
					prato: "Receita Personalizada",
					descricao: "Receita criada pela IA",
					tempo_preparo: "30 minutos",
					ingredientes: ingredients || ["Ingredientes diversos"],
					modo_preparo: aiResponse,
					dica_chef: "Ajuste os temperos ao seu gosto!"
				}]
			})
		}

	} catch (error) {
		console.error("Erro ao buscar receitas com IA:", error)
		return NextResponse.json(
			{ error: "Erro ao gerar receitas com IA" },
			{ status: 500 }
		)
	}
}