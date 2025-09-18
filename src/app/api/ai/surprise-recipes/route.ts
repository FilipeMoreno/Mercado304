import { NextResponse } from "next/server"

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { mealTypes, ingredients } = body

		const mealTypeLabels = {
			cafe_da_manha: "Café da Manhã",
			almoco: "Almoço", 
			jantar: "Jantar",
			lanche: "Lanche",
			sobremesa: "Sobremesa",
			entrada: "Entrada"
		}

		const selectedMealTypes = mealTypes || ["almoco", "jantar"]
		const mealTypeNames = selectedMealTypes.map((type: string) => mealTypeLabels[type as keyof typeof mealTypeLabels] || type)

		let prompt = `Me surpreenda com receitas deliciosas! Crie receitas aleatórias e criativas para:\n\n`
		prompt += `Tipos de refeição: ${mealTypeNames.join(", ")}\n`

		if (ingredients && ingredients.length > 0) {
			prompt += `Ingredientes disponíveis (use alguns se desejar): ${ingredients.join(", ")}\n`
		}

		prompt += `
Seja muito criativo! Misture sabores, técnicas e culturas diferentes. 
Gere ${selectedMealTypes.length > 1 ? '1 receita para cada tipo de refeição' : '2-3 receitas variadas'}.

Para cada receita, retorne no formato JSON:

{
	"sugestoes": [
		{
			"refeicao": "tipo da refeição",
			"prato": "nome criativo e apetitoso",
			"descricao": "descrição que desperte curiosidade",
			"tempo_preparo": "tempo estimado",
			"ingredientes": ["lista", "completa", "de", "ingredientes"],
			"modo_preparo": "instruções detalhadas passo a passo",
			"dica_chef": "dica especial que faz toda a diferença"
		}
	]
}

Pense fora da caixa! Sugira pratos únicos, fusões interessantes, ou versões criativas de clássicos.`

		const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: 0.9, // Mais criativo
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
					refeicao: mealTypeNames[0] || "Prato Especial",
					prato: "Receita Surpresa",
					descricao: "Uma receita criativa feita especialmente para você",
					tempo_preparo: "45 minutos",
					ingredientes: ingredients || ["Ingredientes selecionados"],
					modo_preparo: aiResponse,
					dica_chef: "A surpresa está nos detalhes!"
				}]
			})
		}

	} catch (error) {
		console.error("Erro ao gerar receitas surpresa:", error)
		return NextResponse.json(
			{ error: "Erro ao gerar receitas surpresa" },
			{ status: 500 }
		)
	}
}