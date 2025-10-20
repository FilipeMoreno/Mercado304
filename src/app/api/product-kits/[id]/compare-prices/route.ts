import { type NextRequest, NextResponse } from "next/server"
import * as productKitService from "@/services/productKitService"

/**
 * POST /api/product-kits/[id]/compare-prices
 * Compara o preço do kit com a soma dos preços individuais dos produtos
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const body = await request.json()
		const { kitPrice, marketId } = body

		if (!kitPrice || typeof kitPrice !== "number" || kitPrice <= 0) {
			return NextResponse.json(
				{
					success: false,
					error: "kitPrice é obrigatório e deve ser um número maior que zero",
				},
				{ status: 400 },
			)
		}

		const comparison = await productKitService.compareKitPrices(params.id, kitPrice, marketId)

		return NextResponse.json({
			success: true,
			data: comparison,
		})
	} catch (error) {
		console.error("Error comparing kit prices:", error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Erro ao comparar preços do kit",
			},
			{ status: 500 },
		)
	}
}
