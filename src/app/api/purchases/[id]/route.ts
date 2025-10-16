import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Função para normalizar o método de pagamento
function normalizePaymentMethod(method: string): any {
	const normalizedMethod = method?.toUpperCase().replace(/[-_]/g, "")
	
	// Mapeamento de valores comuns para os valores do enum
	const mapping: Record<string, string> = {
		CREDITCARD: "CREDIT",
		CREDIT: "CREDIT",
		DEBITCARD: "DEBIT",
		DEBIT: "DEBIT",
		MONEY: "MONEY",
		CASH: "MONEY",
		DINHEIRO: "MONEY",
		PIX: "PIX",
		VOUCHER: "VOUCHER",
		VALE: "VOUCHER",
		CHECK: "CHECK",
		CHEQUE: "CHECK",
		OTHER: "OTHER",
		OUTRO: "OTHER",
		OUTROS: "OTHER",
	}
	
	return mapping[normalizedMethod] || "MONEY"
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const purchase = await prisma.purchase.findUnique({
			where: { id: params.id },
			include: {
				market: true,
				items: {
					include: {
						product: {
							include: {
								brand: true,
								category: true,
							},
						},
					},
				},
			},
		})

		if (!purchase) {
			return NextResponse.json({ error: "Compra não encontrada" }, { status: 404 })
		}

		return NextResponse.json(purchase)
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar compra" }, { status: 500 })
	}
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { marketId, items, purchaseDate, paymentMethod } = body

		if (!marketId || !items || items.length === 0) {
			return NextResponse.json({ error: "Mercado e itens são obrigatórios" }, { status: 400 })
		}

		const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0)

		// Buscar informações dos produtos para snapshot
		const productIds = items.map((item: any) => item.productId).filter(Boolean)
		const products = await prisma.product.findMany({
			where: { id: { in: productIds } },
			include: {
				brand: true,
				category: true,
			},
		})

		// Deletar itens existentes e criar novos
		await prisma.purchaseItem.deleteMany({
			where: { purchaseId: params.id },
		})

		const purchase = await prisma.purchase.update({
			where: { id: params.id },
			data: {
				marketId,
				totalAmount,
				purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
				paymentMethod: paymentMethod ? normalizePaymentMethod(paymentMethod) : undefined,
				items: {
					create: items.map((item: any) => {
						const product = products.find((p) => p.id === item.productId)
						return {
							productId: item.productId,
							quantity: item.quantity,
							unitPrice: item.unitPrice,
							totalPrice: item.quantity * item.unitPrice,
							productName: product?.name,
							productUnit: product?.unit,
							productCategory: product?.category?.name,
							brandName: product?.brand?.name,
						}
					}),
				},
			},
			include: {
				market: true,
				items: {
					include: {
						product: {
							include: {
								brand: true,
								category: true,
							},
						},
					},
				},
			},
		})

		return NextResponse.json(purchase)
	} catch (error) {
		console.error("Erro ao atualizar compra:", error)
		return NextResponse.json({ error: "Erro ao atualizar compra" }, { status: 500 })
	}
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		await prisma.purchase.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ message: "Compra excluída com sucesso" })
	} catch (error) {
		return NextResponse.json({ error: "Erro ao excluir compra" }, { status: 500 })
	}
}
