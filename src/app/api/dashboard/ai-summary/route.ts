import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
	try {
		const apiKey = process.env.GEMINI_API_KEY
		if (!apiKey) {
			return NextResponse.json({ error: "Chave da API do Gemini não configurada." }, { status: 500 })
		}

		// Buscar as últimas 15 compras para ter um bom contexto
		const recentPurchases = await prisma.purchase.findMany({
			orderBy: { purchaseDate: "desc" },
			take: 15,
			include: {
				market: true,
				items: {
					include: {
						product: {
							include: { category: true },
						},
					},
				},
			},
		})

		if (recentPurchases.length < 3) {
			return NextResponse.json({
				summary: "Continue registando compras para receber insights semanais da IA.",
			})
		}

		// Preparar os dados para o prompt
		const totalSpent = recentPurchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)
		const categoryCounts: Record<string, number> = {}
		recentPurchases.forEach((p) => {
			p.items.forEach((item) => {
				const category = item.product?.category?.name || "Outros"
				categoryCounts[category] = (categoryCounts[category] || 0) + 1
			})
		})

		const topCategory = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a)[0][0]

		const genAI = new GoogleGenerativeAI(apiKey)
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

		const prompt = `
      Você é um assistente de compras inteligente. Analise os seguintes dados de compras recentes de um utilizador e gere um insight curto e amigável (2-3 frases) para aparecer no dashboard dele. O tom deve ser positivo e dar uma dica útil.

      Dados das últimas compras:
      - Total Gasto: R$ ${totalSpent}
      - Número de Compras: ${recentPurchases.length}
      - Categoria mais comprada: "${topCategory}"

      Exemplo de resposta: "Nas suas últimas compras, você focou bastante em ${topCategory}. Que tal explorar novas receitas com esses ingredientes ou comparar os preços na próxima vez para economizar?"

      Retorne apenas o texto do insight.
    `

		const result = await model.generateContent(prompt)
		const summaryText = result.response.text()

		return NextResponse.json({ summary: summaryText })
	} catch (error) {
		console.error("Erro ao gerar resumo da IA:", error)
		return NextResponse.json({ error: "Erro ao gerar resumo da IA." }, { status: 500 })
	}
}
