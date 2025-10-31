import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ barcode: string }> },
) {
	try {
		const resolvedParams = await params
		const barcode = resolvedParams.barcode

		// Validar código de barras (deve ter 8, 12, 13 ou 14 dígitos)
		const cleanBarcode = barcode.trim()
		if (!/^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/.test(cleanBarcode)) {
			return NextResponse.json(
				{ error: "Código de barras inválido. Use 8, 12, 13 ou 14 dígitos (EAN/GTIN)." },
				{ status: 400 },
			)
		}

		// OTIMIZAÇÃO: Buscar todas as categorias e marcas do sistema em uma transação
		const [categories, brands] = await prisma.$transaction([
			prisma.category.findMany({
				select: {
					id: true,
					name: true,
					icon: true,
					color: true,
					isFood: true,
				},
				orderBy: { name: "asc" },
			}),
			prisma.brand.findMany({
				select: {
					id: true,
					name: true,
				},
				orderBy: { name: "asc" },
			}),
		])

		// Preparar prompt para o Gemini
		const prompt = `Você é um assistente especializado em produtos de supermercado. Analise o seguinte código de barras EAN/GTIN e forneça informações detalhadas sobre o produto.

CÓDIGO DE BARRAS (EAN/GTIN): ${cleanBarcode}

CATEGORIAS DISPONÍVEIS NO SISTEMA:
${categories.map(c => `- ID: ${c.id}, Nome: ${c.name}, É alimento: ${c.isFood ? "Sim" : "Não"}`).join("\n")}

MARCAS CADASTRADAS NO SISTEMA:
${brands.map(b => `- ID: ${b.id}, Nome: ${b.name}`).join("\n")}

IMPORTANTE:
1. Pesquise em suas bases de conhecimento sobre produtos brasileiros com este código EAN/GTIN
2. Se você conhecer o produto, forneça o máximo de informações possível
3. Para a MARCA: verifique se existe nas marcas cadastradas (case-insensitive). Se existir, use o ID. Se não existir, forneça o nome da marca para criar uma nova
4. Para a CATEGORIA: escolha a categoria mais apropriada da lista fornecida baseado no tipo de produto
5. Extraia o tamanho/volume da embalagem da descrição do produto (ex: "500g", "1L", "350ml")

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "productFound": true/false,
  "name": "Nome completo do produto",
  "description": "Descrição detalhada",
  "packageSize": "Tamanho/volume da embalagem",
  "brand": {
    "id": "ID da marca se existir nas marcas cadastradas" ou null,
    "name": "Nome da marca",
    "shouldCreate": true se a marca não existe no sistema
  },
  "category": {
    "id": "ID da categoria mais apropriada da lista",
    "name": "Nome da categoria"
  },
  "unit": "Unidade apropriada: unidade, kg, g, litro, ml, pacote, caixa, garrafa, lata ou saco",
  "estimatedPrice": número estimado do preço em reais (ou null),
  "isFood": true se for produto alimentício,
  "confidence": "high/medium/low - nível de confiança nas informações"
}

Se não encontrar o produto nas suas bases de dados, retorne productFound: false e tente deduzir o máximo possível apenas pelo código de barras.`

		// Chamar Gemini
		const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })
		const result = await model.generateContent(prompt)
		const response = result.response
		const text = response.text()

		// Extrair JSON da resposta
		let geminiData: {
			productFound: boolean
			name?: string
			description?: string
			packageSize?: string
			brand?: {
				id?: string
				name: string
				shouldCreate?: boolean
			}
			category?: {
				id: string
				name: string
			}
			unit?: string
			estimatedPrice?: number
			isFood?: boolean
			confidence?: string
		}
		try {
			// Remover markdown code blocks se existirem
			const cleanText = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
			geminiData = JSON.parse(cleanText)
		} catch {
			console.error("[Gemini Barcode] Erro ao parsear resposta:", text)
			return NextResponse.json(
				{ error: "Erro ao processar resposta do Gemini" },
				{ status: 500 },
			)
		}

		// Validar e enriquecer resposta
		if (!geminiData.productFound) {
			return NextResponse.json(
				{
					error: "Produto não encontrado nas bases de dados",
					suggestion: "Você pode cadastrar manualmente as informações do produto"
				},
				{ status: 404 },
			)
		}

		// Retornar dados estruturados
		return NextResponse.json({
			barcode: cleanBarcode,
			suggestions: {
				name: geminiData.name || "",
				description: geminiData.description || "",
				packageSize: geminiData.packageSize || "",
				unit: geminiData.unit || "unidade",
				estimatedPrice: geminiData.estimatedPrice || null,
				brand: geminiData.brand || null,
				category: geminiData.category || null,
				isFood: geminiData.isFood || false,
				confidence: geminiData.confidence || "low",
			},
			metadata: {
				source: "gemini-ai",
				model: "gemini-2.5-flash",
				timestamp: new Date().toISOString(),
			}
		})

	} catch (error: unknown) {
		console.error("[Gemini Barcode API] Erro:", error)

		// Erro de API Key
		if (error instanceof Error && error.message?.includes("API key")) {
			return NextResponse.json(
				{ error: "Erro de configuração da API Gemini. Contate o administrador." },
				{ status: 500 },
			)
		}

		// Erro de quota
		if (error instanceof Error && (error.message?.includes("quota") || error.message?.includes("limit"))) {
			return NextResponse.json(
				{ error: "Limite de requisições do Gemini atingido. Tente novamente mais tarde." },
				{ status: 429 },
			)
		}

		// Erro genérico
		return NextResponse.json(
			{ error: "Erro ao buscar informações do produto com Gemini" },
			{ status: 500 },
		)
	}
}
