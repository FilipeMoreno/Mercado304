import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Função para extrair receitas do texto quando JSON falha
function extractRecipesFromText(text: string, ingredients?: string[]) {
	const recipes = []

	// Dividir por receitas (procurar por padrões como "prato": ou "refeicao":)
	const recipeSections = text.split(/(?="prato":|"refeicao":)/)

	for (const section of recipeSections) {
		if (section.trim().length < 50) continue // Pular seções muito pequenas

		try {
			// Tentar extrair campos usando regex
			const pratoMatch = section.match(/"prato":\s*"([^"]+)"/)
			const refeicaoMatch = section.match(/"refeicao":\s*"([^"]+)"/)
			const descricaoMatch = section.match(/"descricao":\s*"([^"]+)"/)
			const tempoMatch = section.match(/"tempo_preparo":\s*"([^"]+)"/)
			const ingredientesMatch = section.match(/"ingredientes":\s*\[([\s\S]*?)\]/)
			const modoMatch = section.match(/"modo_preparo":\s*"([^"]+)"/)
			const dicaMatch = section.match(/"dica_chef":\s*"([^"]+)"/)

			if (pratoMatch) {
				const recipe = {
					refeicao: refeicaoMatch ? refeicaoMatch[1] : "Sugestão",
					prato: pratoMatch[1],
					descricao: descricaoMatch ? descricaoMatch[1] : "Receita deliciosa",
					tempo_preparo: tempoMatch ? tempoMatch[1] : "30 minutos",
					ingredientes: ingredientesMatch && ingredientesMatch[1]
						? ingredientesMatch[1].split(",").map((i) => i.trim().replace(/"/g, ""))
						: ingredients || ["Ingredientes diversos"],
					modo_preparo: modoMatch ? modoMatch[1] : "Siga as instruções básicas de preparo",
					dica_chef: dicaMatch ? dicaMatch[1] : "Ajuste os temperos ao seu gosto!",
				}
				recipes.push(recipe)
			}
		} catch (error) {
			console.error("Erro ao extrair receita:", error)
		}
	}

	// Se não conseguiu extrair nenhuma receita, criar uma genérica
	if (recipes.length === 0) {
		recipes.push({
			refeicao: "Sugestão",
			prato: "Receita Personalizada",
			descricao: "Receita criada pela IA",
			tempo_preparo: "30 minutos",
			ingredientes: ingredients || ["Ingredientes diversos"],
			modo_preparo: "Receita personalizada baseada nos ingredientes disponíveis. Ajuste os temperos ao seu gosto!",
			dica_chef: "Ajuste os temperos ao seu gosto!",
		})
	}

	return recipes
}

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
			model: "gemini-2.5-flash",
			generationConfig: {
				temperature: 0.8,
				topK: 40,
				topP: 0.95,
				maxOutputTokens: 4096, // Aumentado para evitar corte de JSON
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

			// Tentar corrigir JSON malformado
			let cleanedResponse = aiResponse.trim()

			// Se não termina com }, tentar adicionar
			if (!cleanedResponse.endsWith("}")) {
				// Encontrar o último } válido
				const lastValidBrace = cleanedResponse.lastIndexOf("}")
				if (lastValidBrace > 0) {
					cleanedResponse = cleanedResponse.substring(0, lastValidBrace + 1)
				} else {
					// Se não há } válido, tentar adicionar fechamento
					cleanedResponse += "}"
				}
			}

			// Se não começa com {, tentar encontrar o primeiro {
			if (!cleanedResponse.startsWith("{")) {
				const firstBrace = cleanedResponse.indexOf("{")
				if (firstBrace > 0) {
					cleanedResponse = cleanedResponse.substring(firstBrace)
				}
			}

			const recipes = JSON.parse(cleanedResponse)

			// Validar se tem a estrutura esperada
			if (!recipes.sugestoes || !Array.isArray(recipes.sugestoes)) {
				throw new Error("Estrutura de resposta inválida")
			}

			return NextResponse.json(recipes)
		} catch (parseError) {
			console.error("Erro ao fazer parse da resposta da IA:", parseError)
			console.log("Resposta da IA (primeiros 500 chars):", aiResponse.substring(0, 500))
			console.log("Resposta da IA (últimos 500 chars):", aiResponse.substring(Math.max(0, aiResponse.length - 500)))

			// Fallback: tentar extrair receitas manualmente
			try {
				const fallbackRecipes = extractRecipesFromText(aiResponse, ingredients)
				return NextResponse.json({ sugestoes: fallbackRecipes })
			} catch (fallbackError) {
				console.error("Erro no fallback:", fallbackError)

				// Último recurso: resposta genérica
				return NextResponse.json({
					sugestoes: [
						{
							refeicao: "Sugestão",
							prato: "Receita Personalizada",
							descricao: "Receita criada pela IA",
							tempo_preparo: "30 minutos",
							ingredientes: ingredients || ["Ingredientes diversos"],
							modo_preparo:
								"Receita personalizada baseada nos ingredientes disponíveis. Ajuste os temperos ao seu gosto!",
							dica_chef: "Ajuste os temperos ao seu gosto!",
						},
					],
				})
			}
		}
	} catch (error) {
		console.error("Erro ao buscar receitas com IA:", error)
		return NextResponse.json({ error: "Erro ao gerar receitas com IA" }, { status: 500 })
	}
}
