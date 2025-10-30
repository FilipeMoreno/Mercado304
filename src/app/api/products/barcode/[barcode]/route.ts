import { NextResponse } from "next/server"
import { normalizeBarcode } from "@/lib/barcode-utils"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: Promise<{ barcode: string }> }) {
	try {
		const resolvedParams = await params
		const originalBarcode = resolvedParams.barcode
		const normalizedBarcode = normalizeBarcode(originalBarcode)

		// Buscar produto pelos códigos de barras na nova tabela
		const productBarcode = await prisma.productBarcode.findFirst({
			where: {
				OR: [{ barcode: originalBarcode }, { barcode: normalizedBarcode }],
			},
			include: {
				product: {
					include: {
						brand: true,
						barcodes: {
							orderBy: {
								isPrimary: "desc",
							},
						},
					},
				},
			},
		})

		if (!productBarcode) {
			// Fallback para buscar no campo barcode antigo (compatibilidade)
			let product = await prisma.product.findUnique({
				where: { barcode: originalBarcode },
				include: { brand: true },
			})

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
		}

		// Adicionar o barcode principal ao produto para compatibilidade
		const product = {
			...productBarcode.product,
			barcode:
				productBarcode.product.barcodes.find((b) => b.isPrimary)?.barcode ||
				productBarcode.product.barcodes[0]?.barcode,
		}

		return NextResponse.json(product)
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao buscar produto por código de barras" }, { status: 500 })
	}
}
