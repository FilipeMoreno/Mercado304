import { type NextRequest, NextResponse } from "next/server"
import * as productKitService from "@/services/productKitService"

/**
 * GET /api/product-kits/[id]/price
 * Calcula o preço sugerido de um kit baseado nos preços individuais dos produtos
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const { searchParams } = new URL(request.url)
		const marketId = searchParams.get("marketId") || undefined

		const priceInfo = await productKitService.calculateKitPrice(params.id, marketId)

		return NextResponse.json({
			success: true,
			data: priceInfo,
		})
	} catch (error) {
		console.error("Error calculating kit price:", error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Erro ao calcular preço do kit",
			},
			{ status: 500 },
		)
	}
}
