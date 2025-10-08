import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const { productId, currentPrice } = await request.json()
		const apiKey = process.env.GEMINI_API_KEY

		if (!apiKey) {
			return NextResponse.json({ error: "Chave da API do Gemini não configurada." }, { status: 500 })
		}

		if (!productId || !currentPrice) {
			return NextResponse.json({ error: "Dados insuficientes para análise." }, { status: 400 })
		}

		const sixMonthsAgo = new Date()
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

		const historicalPrices = await prisma.purchaseItem.findMany({
			where: {
				productId,
				purchase: { purchaseDate: { gte: sixMonthsAgo } },
			},
			select: { unitPrice: true, purchase: { select: { purchaseDate: true } } },
			orderBy: { purchase: { purchaseDate: "desc" } },
		})

		// Adicionar também os PriceLogs
		const priceLogs = await prisma.priceRecord.findMany({
			where: { productId, recordDate: { gte: sixMonthsAgo } },
			select: { price: true, recordDate: true },
		})

		const allPrices = [...historicalPrices.map((p) => Number(p.unitPrice)), ...priceLogs.map((p) => Number(p.price))]

		if (allPrices.length < 2) {
			return NextResponse.json({
				analysis: "Primeiro registo de preço para este produto.",
			})
		}

		const averagePrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length
		const maxPrice = Math.max(...allPrices)
		const minPrice = Math.min(...allPrices)

		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

		const prompt = `
      Você é um assistente de finanças para compras de supermercado. Analise os seguintes dados sobre o preço de um produto e gere uma análise curta (uma frase) e objetiva para o utilizador. Seja direto e use termos como "bom preço", "preço alto", "na média".

      Dados:
      - Preço Atual: R$ ${currentPrice.toFixed(2)}
      - Preço Médio (últimos 6 meses): R$ ${averagePrice.toFixed(2)}
      - Preço Mínimo (últimos 6 meses): R$ ${minPrice.toFixed(2)}
      - Preço Máximo (últimos 6 meses): R$ ${maxPrice.toFixed(2)}

      Exemplos de resposta:
      - "Ótimo preço! Está abaixo da média histórica de R$ ${averagePrice.toFixed(2)}."
      - "Atenção, preço um pouco acima da média de R$ ${averagePrice.toFixed(2)}."
      - "Preço na média. O mais baixo registado foi R$ ${minPrice.toFixed(2)}."
      - "Preço recorde! O mais baixo que você já pagou."

      Retorne apenas o texto da análise.
    `

		const result = await model.generateContent(prompt)
		const analysisText = result.response.text()

		return NextResponse.json({ analysis: analysisText })
	} catch (error) {
		return handleApiError(error)
	}
}
