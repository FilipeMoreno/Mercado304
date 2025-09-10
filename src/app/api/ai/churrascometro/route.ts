import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";

export async function POST(request: Request) {
	try {
		const { adults, children, drinkers, preferences } = await request.json();
		const apiKey = process.env.GEMINI_API_KEY;

		if (!apiKey) {
			return NextResponse.json(
				{ error: "Chave da API do Gemini não configurada." },
				{ status: 500 },
			);
		}

		const genAI = new GoogleGenerativeAI(apiKey);
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

		const prompt = `
      Você é um mestre churrasqueiro e organizador de eventos. Sua tarefa é calcular as quantidades necessárias para um churrasco.

      **Dados do Evento:**
      - Adultos: ${adults}
      - Crianças: ${children}
      - Adultos que bebem álcool: ${drinkers}
      - Preferências dos convidados: ${preferences || "Nenhuma preferência especial."}

      **Bases de Cálculo (valores médios por pessoa):**
      - Carne (mix de bovina, frango, porco): 450g por adulto, 200g por criança.
      - Linguiça: 150g por adulto.
      - Pão de alho: 1 unidade por pessoa.
      - Cerveja: 1.5 litros por adulto que bebe.
      - Refrigerante/Suco: 700ml por pessoa (adultos que não bebem e crianças).
      - Água: 500ml por pessoa.
      - Acompanhamentos (vinagrete, farofa, arroz): 150g no total por pessoa.
      - Carvão: 1kg para cada 2kg de carne.

      **INSTRUÇÕES:**
      1. Calcule as quantidades TOTAIS para cada item com base nos dados do evento e nas bases de cálculo.
      2. Considere as preferências para ajustar os cálculos. Por exemplo, se pedirem "mais picanha", aumente a proporção de carne bovina. Se for "churrasco vegetariano", substitua carnes por opções como queijo coalho e legumes.
      3. Apresente os resultados ESTRITAMENTE no formato JSON abaixo. Unidades devem ser em 'kg', 'litros', ou 'unidades'.

      **FORMATO JSON DE SAÍDA:**
      {
        "summary": {
          "totalAdults": ${adults},
          "totalChildren": ${children},
          "totalPeople": ${adults + children}
        },
        "shoppingList": {
          "Carnes": [
            { "item": "Carne Bovina (Picanha, Maminha)", "quantity": "X.X kg" },
            { "item": "Asa/Coxinha de Frango", "quantity": "X.X kg" },
            { "item": "Linguiça Toscana", "quantity": "X.X kg" }
          ],
          "Bebidas": [
            { "item": "Cerveja", "quantity": "X.X litros" },
            { "item": "Refrigerante/Suco", "quantity": "X.X litros" },
            { "item": "Água", "quantity": "X.X litros" }
          ],
          "Acompanhamentos": [
            { "item": "Pão de Alho", "quantity": "X unidades" },
            { "item": "Vinagrete", "quantity": "X.X kg" },
            { "item": "Farofa", "quantity": "X.X kg" }
          ],
          "Outros": [
            { "item": "Carvão", "quantity": "X.X kg" },
            { "item": "Gelo", "quantity": "X.X kg" }
          ]
        },
        "chefTip": "Uma dica rápida e útil para o churrasco."
      }
    `;

		const result = await model.generateContent(prompt);
		const responseText = result.response.text();
		const jsonString = responseText.replace(/```json\n?|```/g, "").trim();
		const parsedJson = JSON.parse(jsonString);

		return NextResponse.json(parsedJson);
	} catch (error) {
		return handleApiError(error);
	}
}
