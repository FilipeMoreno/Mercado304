// src/app/api/ai/suggest-recipes/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { unstable_cache as cache } from "next/cache";
import { NextResponse } from "next/server";

const getCachedSuggestions = cache(
	async (ingredients: string[]) => {
		const apiKey = process.env.GEMINI_API_KEY;

		if (!apiKey) {
			throw new Error("Chave da API do Gemini não configurada.");
		}

		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

		const prompt = `
      Você é um chef de cozinha experiente. Baseado na lista de ingredientes fornecida, crie 3 sugestões de receitas (café da manhã, almoço e jantar).
      Para cada receita, forneça detalhes completos. A resposta deve ser ESTRITAMENTE um JSON com a seguinte estrutura:
      {
        "sugestoes": [
          {
            "refeicao": "Café da Manhã",
            "prato": "Nome do Prato",
            "descricao": "Uma descrição curta e apetitosa do prato.",
            "tempo_preparo": "Ex: 20 minutos",
            "ingredientes": [
              "1 xícara de farinha de trigo",
              "2 ovos",
              "1/2 xícara de leite"
            ],
            "modo_preparo": "Passo 1: Misture os ingredientes secos. Passo 2: Adicione os ovos e o leite... (seja detalhado)",
            "dica_chef": "Uma dica extra para melhorar a receita."
          }
        ]
      }

      Ingredientes disponíveis para usar como base:
      [${ingredients.join(", ")}]

      Instruções:
      - Use principalmente os ingredientes fornecidos, mas pode assumir que o utilizador tem ingredientes básicos como sal, pimenta, azeite, etc.
      - Seja criativo e forneça instruções claras.
    `;

		const result = await model.generateContent(prompt);
		const responseText = result.response.text();
		const jsonString = responseText.replace(/```json\n?|```/g, "").trim();
		return JSON.parse(jsonString);
	},
	["suggest-recipes"],
	{ revalidate: 60 * 60 * 24 }, // 24 hours
);

export async function POST(request: Request) {
	try {
		const { ingredients } = await request.json();

		if (
			!ingredients ||
			!Array.isArray(ingredients) ||
			ingredients.length === 0
		) {
			return NextResponse.json(
				{ error: "Lista de ingredientes é obrigatória." },
				{ status: 400 },
			);
		}

		const parsedJson = await getCachedSuggestions(ingredients);

		return NextResponse.json(parsedJson);
	} catch (error) {
		console.error("Erro ao sugerir receitas:", error);
		if (error instanceof Error && error.message.includes("Chave da API")) {
			return NextResponse.json({ error: error.message }, { status: 500 });
		}
		return NextResponse.json(
			{ error: "Erro ao gerar sugestões de receitas." },
			{ status: 500 },
		);
	}
}
