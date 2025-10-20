import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeBarcode } from "@/lib/barcode-utils"

export async function GET(request: Request, props: { params: Promise<{ barcode: string }> }) {
    const params = await props.params;
    try {
		const originalBarcode = params.barcode
		const normalizedBarcode = normalizeBarcode(originalBarcode)
		
		// Primeiro tenta encontrar com o código original
		let product = await prisma.product.findUnique({
			where: { barcode: originalBarcode },
			include: { brand: true },
		})
		
		// Se não encontrou e o código normalizado é diferente, tenta com o normalizado
		if (!product && normalizedBarcode !== originalBarcode) {
			product = await prisma.product.findUnique({
				where: { barcode: normalizedBarcode },
				include: { brand: true },
			})
		}

		if (!product) {
			return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
		}

		return NextResponse.json(product)
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar produto por código de barras" }, { status: 500 })
	}
}
