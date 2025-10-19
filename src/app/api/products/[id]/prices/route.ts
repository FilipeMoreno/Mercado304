import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
	try {
		const productId = params.id

		// Buscar histórico de preços do produto
		const priceRecords = await prisma.priceRecord.findMany({
			where: {
				productId: productId,
			},
			include: {
				market: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 50, // Limitar a 50 registros mais recentes
		})

		// Transformar para o formato esperado
		const prices = priceRecords.map((record) => ({
			price: record.price,
			marketId: record.market.id,
			marketName: record.market.name,
			createdAt: record.createdAt,
		}))

		return NextResponse.json(prices)
	} catch (error) {
		console.error("Erro ao buscar histórico de preços:", error)
		return NextResponse.json({ error: "Erro ao buscar histórico de preços" }, { status: 500 })
	}
}

