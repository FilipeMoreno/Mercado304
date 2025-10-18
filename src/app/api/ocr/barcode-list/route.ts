import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
	try {
		const { imageUrl } = await request.json()

		if (!imageUrl) {
			return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 })
		}

		console.log("🔍 Iniciando extração de códigos de barras...")

		const prompt = `Você é um assistente especializado em extrair códigos de barras de cupons fiscais.

TAREFA: Identifique TODOS os códigos de barras presentes nesta imagem de cupom fiscal.

IMPORTANTE:
- Códigos de barras geralmente têm 8, 12, 13 ou 14 dígitos
- Eles aparecem abaixo dos produtos no cupom
- Podem estar escritos como "EAN", "GTIN", "Cód." ou apenas números
- Ignore outros números como valores, quantidades, ou datas
- Retorne APENAS códigos numéricos válidos
- Liste os códigos NA ORDEM em que aparecem no cupom (de cima para baixo)
- Se houver zeros à esquerda, MANTENHA-OS

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
}`

		const response = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
				{
					role: "user",
					content: [
						{
							type: "text",
							text: prompt,
						},
						{
							type: "image_url",
							image_url: {
								url: imageUrl,
								detail: "high",
							},
						},
					],
				},
			],
			max_tokens: 1000,
			temperature: 0.1,
		})

		const content = response.choices[0]?.message?.content
		console.log("📋 Resposta da IA:", content)

		if (!content) {
			return NextResponse.json({ error: "Nenhuma resposta da IA" }, { status: 500 })
		}

		// Parse do JSON
		let result: { barcodes?: string[] }
		try {
			// Tentar extrair JSON da resposta (pode vir com texto adicional)
			const jsonMatch = content.match(/\{[\s\S]*\}/)
			if (jsonMatch) {
				result = JSON.parse(jsonMatch[0])
			} else {
				result = JSON.parse(content)
			}
		} catch (parseError) {
			console.error("Erro ao fazer parse da resposta:", parseError)
			return NextResponse.json({ error: "Erro ao processar resposta da IA", details: content }, { status: 500 })
		}

		// Validar e limpar códigos de barras
		const barcodes = (result.barcodes || [])
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
	} catch (error: any) {
		console.error("Erro ao processar imagem:", error)
		return NextResponse.json(
			{
				error: "Erro ao processar imagem",
				details: error.message,
			},
			{ status: 500 },
		)
	}
}
