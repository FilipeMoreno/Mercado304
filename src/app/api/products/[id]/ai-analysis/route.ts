import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function calculatePerServing(nutritionalInfo: Record<string, any>, servingSize: string | null) {
	if (!servingSize) return {}

	// extrai número da porção (ex: "30 g" -> 30)
	const sizeMatch = servingSize.match(/(\d+(\.\d+)?)/)
	if (!sizeMatch) return {}

	const servingValue = parseFloat(sizeMatch[0])

	const perServing: Record<string, number> = {}
	for (const [key, value] of Object.entries(nutritionalInfo)) {
		if (typeof value === "number" && value !== null) {
			perServing[key] = (value * servingValue) / 100
		}
	}

	return perServing
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
	try {
		const productId = params.id
		const apiKey = process.env.GEMINI_API_KEY
		const body = await _request.json()
		const { productName } = body

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

		const filteredInfo = Object.entries(nutritionalInfo)
			.filter(([_, value]) => typeof value === "number" && value !== null)
			.reduce(
				(acc, [key, value]) => {
					acc[key] = value as number
					return acc
				},
				{} as Record<string, number>,
			)

		const perServing = calculatePerServing(filteredInfo, nutritionalInfo.servingSize)

		const formattedInfo = Object.entries(filteredInfo)
			.map(([key, value]) => `${key}: ${value}`)
			.join("\n")

		const formattedPerServing = Object.entries(perServing)
			.map(([key, value]) => `${key}: ${value.toFixed(2)}`)
			.join("\n")

		const prompt = `
			Você é um assistente nutricional especializado. Analise os seguintes dados de um produto (${productName}):

			📌 **Valores por 100g/ml (padrão ANVISA):**
			${formattedInfo}

			📌 **Valores por porção (${nutritionalInfo.servingSize ?? "não informada"}):**
			${formattedPerServing || "sem informação"}

			Regras:
			- Sempre deixe claro que os valores oficiais são por 100g/ml, mas também mencione o impacto prático na porção real.
			- Foque em açúcares adicionados, gorduras saturadas, sódio, fibras e proteínas.
			- Compare com valores de referência da ANVISA (%VD).
			- Responda em 1 parágrafo, linguagem clara e acessível.
    `

		const result = await model.generateContent(prompt)
		const analysisText = result.response.text()

		return NextResponse.json({ analysis: analysisText })
	} catch (error) {
		console.error("Erro na análise da IA:", error)
		return NextResponse.json({ error: "Erro ao gerar análise nutricional." }, { status: 500 })
	}
}
