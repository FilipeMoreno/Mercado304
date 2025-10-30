import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
	extractCategoryKeywords,
	extractPackageSize,
	getProductByBarcode,
} from "@/lib/cosmos-api"

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ barcode: string }> },
) {
	try {
		const resolvedParams = await params
		const barcode = resolvedParams.barcode

		// Buscar produto na API Cosmos
		const cosmosProduct = await getProductByBarcode(barcode)

		if (!cosmosProduct) {
			return NextResponse.json(
				{ error: "Produto não encontrado na base de dados Cosmos" },
				{ status: 404 },
			)
		}

		// Extrair informações úteis
		const packageSize = extractPackageSize(cosmosProduct.description)
		const categoryKeywords = extractCategoryKeywords(cosmosProduct)

		// Buscar marca existente ou sugerir criação
		let brandMatch = null
		let brandSuggestion = null

		if (cosmosProduct.brand?.name) {
			// Buscar marca no banco (case-insensitive)
			brandMatch = await prisma.brand.findFirst({
				where: {
					name: {
						equals: cosmosProduct.brand.name,
						mode: "insensitive",
					},
				},
			})

			if (!brandMatch) {
				brandSuggestion = {
					name: cosmosProduct.brand.name,
					shouldCreate: true,
				}
			}
		}

		// Buscar categorias que contenham as palavras-chave
		let categoryMatches: any[] = []

		if (categoryKeywords.length > 0) {
			// Buscar categorias que contenham qualquer uma das palavras-chave
			categoryMatches = await prisma.category.findMany({
				where: {
					OR: categoryKeywords.map(keyword => ({
						name: {
							contains: keyword,
							mode: "insensitive",
						},
					})),
				},
				select: {
					id: true,
					name: true,
					icon: true,
					color: true,
					isFood: true,
				},
			})
		}

		// Retornar dados estruturados
		return NextResponse.json({
			cosmos: cosmosProduct,
			suggestions: {
				name: cosmosProduct.description,
				packageSize,
				brand: brandMatch
					? { id: brandMatch.id, name: brandMatch.name, exists: true }
					: brandSuggestion,
				categories: categoryMatches,
				categoryKeywords,
				price: cosmosProduct.avg_price || undefined,
				weight: cosmosProduct.net_weight || cosmosProduct.gross_weight || undefined,
				dimensions: {
					width: cosmosProduct.width || undefined,
					height: cosmosProduct.height || undefined,
					length: cosmosProduct.length || undefined,
				},
				thumbnail: cosmosProduct.thumbnail,
			},
		})
	} catch (error: any) {
		console.error("[BarcodeAPI] Erro:", error)

		// Erros específicos da API Cosmos
		if (error.message?.includes("Limite de requisições")) {
			return NextResponse.json(
				{ error: error.message },
				{ status: 429 },
			)
		}

		if (error.message?.includes("Código de barras inválido")) {
			return NextResponse.json(
				{ error: error.message },
				{ status: 400 },
			)
		}

		if (error.message?.includes("autenticação")) {
			return NextResponse.json(
				{ error: "Erro de configuração da API. Contate o administrador." },
				{ status: 500 },
			)
		}

		// Erro genérico
		return NextResponse.json(
			{ error: "Erro ao buscar informações do produto" },
			{ status: 500 },
		)
	}
}
