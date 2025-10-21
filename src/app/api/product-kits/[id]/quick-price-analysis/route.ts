import { type NextRequest, NextResponse } from "next/server"
import * as productKitService from "@/services/productKitService"

/**
 * POST /api/product-kits/[id]/quick-price-analysis
 * Registra preços rapidamente e retorna análise se compensa comprar o kit
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const body = await request.json()
		const { marketId, kitPrice, itemPrices } = body

		// Validações
		if (!marketId) {
			return NextResponse.json(
				{
					success: false,
					error: "marketId é obrigatório",
				},
				{ status: 400 },
			)
		}

		if (!kitPrice || typeof kitPrice !== "number" || kitPrice <= 0) {
			return NextResponse.json(
				{
					success: false,
					error: "kitPrice é obrigatório e deve ser um número maior que zero",
				},
				{ status: 400 },
			)
		}

		if (!Array.isArray(itemPrices) || itemPrices.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "itemPrices deve ser um array com pelo menos 1 item",
				},
				{ status: 400 },
			)
		}

		// Validar cada item price
		for (const item of itemPrices) {
			if (!item.productId || !item.price || typeof item.price !== "number" || item.price <= 0) {
				return NextResponse.json(
					{
						success: false,
						error: "Cada item deve ter productId e price válidos",
					},
					{ status: 400 },
				)
			}
		}

		const analysis = await productKitService.quickPriceAnalysis({
			kitProductId: params.id,
			marketId,
			kitPrice,
			itemPrices,
		})

		return NextResponse.json({
			success: true,
			data: analysis,
		})
	} catch (error) {
		console.error("Error in quick price analysis:", error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Erro ao analisar preços",
			},
			{ status: 500 },
		)
	}
}
