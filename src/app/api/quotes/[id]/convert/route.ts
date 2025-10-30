import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/quotes/[id]/convert - Converter orçamento em compra
export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const body = await request.json()
		const resolvedParams = await params
		const { paymentMethod = "MONEY", purchaseDate } = body

		// Buscar cotação com itens
		const quote = await prisma.quote.findUnique({
			where: { id: resolvedParams.id },
			include: {
				items: true,
			},
		})

		if (!quote) {
			return NextResponse.json(
				{ error: "Cotação não encontrada" },
				{ status: 404 },
			)
		}

		// Verificar se cotação já foi convertida
		if (quote.status === "CONVERTED") {
			return NextResponse.json(
				{ error: "Esta cotação já foi convertida em compra" },
				{ status: 400 },
			)
		}

		// Verificar se cotação tem mercado vinculado
		if (!quote.marketId) {
			return NextResponse.json(
				{
					error:
						"Cotação precisa ter um mercado vinculado para ser convertida",
				},
				{ status: 400 },
			)
		}

		// Verificar se cotação tem itens
		if (quote.items.length === 0) {
			return NextResponse.json(
				{ error: "Cotação precisa ter ao menos um item" },
				{ status: 400 },
			)
		}

		// Criar compra a partir da cotação
		const purchase = await prisma.purchase.create({
			data: {
				marketId: quote.marketId,
				totalAmount: quote.totalEstimated,
				totalDiscount: quote.totalDiscount,
				finalAmount: quote.finalEstimated,
				paymentMethod,
				purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
				items: {
					create: quote.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						unitDiscount: item.unitDiscount,
						totalPrice: item.totalPrice,
						totalDiscount: item.totalDiscount,
						finalPrice: item.finalPrice,
						productName: item.productName,
						productUnit: item.productUnit,
						productCategory: item.productCategory,
						brandName: item.brandName,
					})),
				},
			},
			include: {
				market: true,
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		// Atualizar orçamento para status CONVERTED e vincular compra
		await prisma.quote.update({
			where: { id: resolvedParams.id },
			data: {
				status: "CONVERTED",
				purchaseId: purchase.id,
			},
		})

		return NextResponse.json({
			success: true,
			purchase,
		})
	} catch (error) {
		console.error("[BUDGET_CONVERT]", error)
		return NextResponse.json(
			{ error: "Erro ao converter orçamento em compra" },
			{ status: 500 },
		)
	}
}
