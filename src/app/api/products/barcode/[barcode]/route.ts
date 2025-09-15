import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { barcode: string } }) {
	try {
		const product = await prisma.product.findUnique({
			where: { barcode: params.barcode },
			include: { brand: true },
		})

		if (!product) {
			return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
		}

		return NextResponse.json(product)
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar produto por código de barras" }, { status: 500 })
	}
}
