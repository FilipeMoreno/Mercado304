// src/app/api/products/[id]/ai-analysis/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const productId = params.id
		const apiKey = process.env.GEMINI_API_KEY

		if (!apiKey) {
			return NextResponse.json({ error: "Chave da API do Gemini não configurada." }, { status: 500 })
		}

		const nutritionalInfo = await prisma.nutritionalInfo.findUnique({
			where: { productId },
		})

		if (!nutritionalInfo) {
			return NextResponse.json({ error: "Informações nutricionais não encontradas." }, { status: 404 })
		}

		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

		const prompt = `
      Você é um assistente nutricional especializado. Analise os seguintes dados nutricionais de um produto e forneça uma avaliação curta e direta (2-3 frases) sobre seus prós e contras para uma dieta balanceada.

      IMPORTANTE: Todos os valores fornecidos são por 100 gramas ou 100 mililitros do produto (base padrão nutricional), não por porção. Considere isso em sua análise.

      Dados Nutricionais (por 100g/100ml):
      - Calorias: ${nutritionalInfo.calories || "N/A"} kcal por 100g/ml
      - Açúcares Adicionados: ${nutritionalInfo.addedSugars || "N/A"} g por 100g/ml
      - Gorduras Saturadas: ${nutritionalInfo.saturatedFat || "N/A"} g por 100g/ml
      - Sódio: ${nutritionalInfo.sodium || "N/A"} mg por 100g/ml
      - Fibras: ${nutritionalInfo.fiber || "N/A"} g por 100g/ml
      - Proteínas: ${nutritionalInfo.proteins || "N/A"} g por 100g/ml

      Foque em açúcares adicionados, gorduras saturadas, sódio, fibras e proteínas. Compare com os padrões recomendados pela ANVISA e nutricionistas. Seja claro, objetivo e use linguagem acessível.

      Retorne a análise como um único parágrafo de texto amigável e informativo, mencionando que os valores são por 100g/ml quando relevante para o contexto.
    `

		const result = await model.generateContent(prompt)
		const analysisText = result.response.text()

		return NextResponse.json({ analysis: analysisText })
	} catch (error) {
		console.error("Erro na análise da IA:", error)
		return NextResponse.json({ error: "Erro ao gerar análise nutricional." }, { status: 500 })
	}
}
