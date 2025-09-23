import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

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
			entrada: "Entrada",
		}

		const selectedMealTypes = mealTypes || ["almoco", "jantar"]
		const mealTypeNames = selectedMealTypes.map(
			(type: string) => mealTypeLabels[type as keyof typeof mealTypeLabels] || type,
		)

		let prompt = `Me surpreenda com receitas deliciosas! Crie receitas aleatórias e criativas para:\n\n`
		prompt += `Tipos de refeição: ${mealTypeNames.join(", ")}\n`

		if (ingredients && ingredients.length > 0) {
			prompt += `Ingredientes disponíveis no estoque: ${ingredients.join(", ")}\n`
			prompt += `
IMPORTANTE: Crie receitas criativas que:
1. Usem ALGUNS dos ingredientes disponíveis (não precisa usar todos)
2. Podem incluir ingredientes adicionais que não estão no estoque
3. Seja realista sobre quais ingredientes são comuns de se ter em casa

Para cada receita, analise quais ingredientes estão disponíveis e quais precisarão ser comprados.`
		}

		prompt += `
Seja muito criativo! Misture sabores, técnicas e culturas diferentes. 
Gere ${selectedMealTypes.length > 1 ? "1 receita para cada tipo de refeição" : "2-3 receitas variadas"}.

Para cada receita, retorne no formato JSON:

{
	"sugestoes": [
		{
			"refeicao": "tipo da refeição",
			"prato": "nome criativo e apetitoso",
			"descricao": "descrição que desperte curiosidade",
			"tempo_preparo": "tempo estimado",
			"ingredientes": ["lista", "completa", "de", "ingredientes", "com", "quantidades"],
			"ingredientes_disponiveis": ["ingredientes", "que", "já", "tem"],
			"ingredientes_faltantes": ["ingredientes", "que", "precisa", "comprar"],
			"modo_preparo": "Passo 1: [instrução detalhada com tempo e temperatura]\nPasso 2: [instrução detalhada]\nPasso 3: [instrução detalhada]\n...",
			"dica_chef": "dica especial que faz toda a diferença",
			"custo_estimado": "baixo/médio/alto"
		}
	]
}

IMPORTANTE:
- O campo "modo_preparo" é OBRIGATÓRIO e deve ser muito detalhado
- Cada passo deve começar com "Passo X:" e incluir instruções específicas
- Inclua tempos de cozimento, temperaturas e técnicas detalhadas
- Pense fora da caixa! Sugira pratos únicos, fusões interessantes, ou versões criativas de clássicos
- Se não há ingredientes disponíveis no estoque, crie receitas com ingredientes comuns e acessíveis`

		// Usar a biblioteca oficial do Google
		const model = genAI.getGenerativeModel({
			model: "gemini-1.5-flash",
			generationConfig: {
				temperature: 0.9, // Mais criativo
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
						refeicao: mealTypeNames[0] || "Prato Especial",
						prato: "Receita Surpresa",
						descricao: "Uma receita criativa feita especialmente para você",
						tempo_preparo: "45 minutos",
						ingredientes: ingredients || ["Ingredientes selecionados"],
						modo_preparo: aiResponse,
						dica_chef: "A surpresa está nos detalhes!",
					},
				],
			})
		}
	} catch (error) {
		console.error("Erro ao gerar receitas surpresa:", error)
		return NextResponse.json({ error: "Erro ao gerar receitas surpresa" }, { status: 500 })
	}
}
