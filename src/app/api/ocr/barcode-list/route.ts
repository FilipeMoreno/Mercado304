import { GoogleGenerativeAI } from "@google/generative-ai"
import { type NextRequest, NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: NextRequest) {
	try {
		const { imageUrl } = await request.json()

		if (!imageUrl) {
			return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 })
		}

		if (!process.env.GEMINI_API_KEY) {
			return NextResponse.json({ error: "API Key do Gemini não configurada" }, { status: 500 })
		}

		console.log("🔍 Iniciando extração de códigos de barras...")

		// Converter data URL para base64 puro
		const base64Data = imageUrl.replace(/^data:image\/[a-z]+;base64,/, "")

		const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

		const prompt = `Você é um assistente especializado em extrair códigos de barras de cupons fiscais.

TAREFA: Identifique TODOS os códigos de barras presentes nesta imagem de cupom fiscal.

IMPORTANTE:
- Códigos de barras geralmente têm 8, 12, 13 ou 14 dígitos
- Eles aparecem abaixo dos produtos no cupom
- Podem estar escritos como "EAN", "GTIN", "Cód." ou apenas números
- Ignore outros números como valores, quantidades, ou datas
- Retorne APENAS códigos numéricos válidos
- Liste os códigos NA ORDEM em que aparecem no cupom (de cima para baixo)
- Se houver zeros à esquerda, MANTENHA-OS (exemplo: "0009788" não deve virar "9788")
- Códigos de barras são geralmente impressos perto dos nomes dos produtos

FORMATO DA RESPOSTA:
Retorne um JSON com esta estrutura exata:
{
  "barcodes": ["7891234567890", "0009788", "08423243009753"],
  "count": 3
}

Se não encontrar nenhum código de barras, retorne:
{
  "barcodes": [],
  "count": 0
}

ATENÇÃO: Retorne APENAS o JSON, sem texto adicional antes ou depois.`

		const result = await model.generateContent([
			prompt,
			{
				inlineData: {
					data: base64Data,
					mimeType: "image/jpeg",
				},
			},
		])

		const response = await result.response
		const content = response.text()

		console.log("📋 Resposta do Gemini:", content)

		if (!content) {
			return NextResponse.json({ error: "Nenhuma resposta da IA" }, { status: 500 })
		}

		// Parse do JSON
		let parsedResult: { barcodes?: string[] }
		try {
			// Tentar extrair JSON da resposta (pode vir com texto adicional)
			const jsonMatch = content.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				parsedResult = JSON.parse(jsonMatch[0])
			} else {
				parsedResult = JSON.parse(content)
			}
		} catch (parseError) {
			console.error("Erro ao fazer parse da resposta:", parseError)
			return NextResponse.json({ error: "Erro ao processar resposta da IA", details: content }, { status: 500 })
		}

		// Validar e limpar códigos de barras
		const barcodes = (parsedResult.barcodes || [])
			.filter((code: string) => {
				// Remover espaços e validar que é numérico
				const cleaned = code.trim().replace(/\s/g, "")
				return /^\d{8,14}$/.test(cleaned)
			})
			.map((code: string) => code.trim().replace(/\s/g, ""))

		console.log(`✅ ${barcodes.length} código(s) de barras extraído(s):`, barcodes)

		return NextResponse.json({
			barcodes,
			count: barcodes.length,
		})
	} catch (error) {
		console.error("Erro ao processar imagem:", error)
		const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
		return NextResponse.json(
			{
				error: "Erro ao processar imagem",
				details: errorMessage,
			},
			{ status: 500 },
		)
	}
}
