import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/quotes/[id] - Buscar orçamento específico
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await params
		const quote = await prisma.quote.findUnique({
			where: { id: resolvedParams.id },
			include: {
				market: true,
				items: {
					include: {
						product: {
							include: {
								category: true,
								brand: true,
							},
						},
					},
					orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
				},
				_count: {
					select: { items: true },
				},
			},
		})

		if (!quote) {
			return NextResponse.json(
				{ error: "Orçamento não encontrado" },
				{ status: 404 },
			)
		}

		return NextResponse.json(quote)
	} catch (error) {
		console.error("[BUDGET_GET]", error)
		return NextResponse.json(
			{ error: "Erro ao buscar orçamento" },
			{ status: 500 },
		)
	}
}

// PATCH /api/quotes/[id] - Atualizar orçamento
export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await params
		const body = await request.json()
		const {
			name,
			description,
			marketId,
			status,
			quoteDate,
			validUntil,
			notes,
			items,
		} = body

		// Verificar se orçamento existe
		const existingBudget = await prisma.quote.findUnique({
			where: { id: resolvedParams.id },
		})

		if (!existingBudget) {
			return NextResponse.json(
				{ error: "Orçamento não encontrado" },
				{ status: 404 },
			)
		}

		// Não permitir edição de orçamentos convertidos
		if (existingBudget.status === "CONVERTED") {
			return NextResponse.json(
				{ error: "Não é possível editar um orçamento já convertido" },
				{ status: 400 },
			)
		}

		// Preparar dados de atualização
		const updateData: any = {}

		if (name !== undefined) updateData.name = name
		if (description !== undefined) updateData.description = description
		if (marketId !== undefined) updateData.marketId = marketId || null
		if (status !== undefined) updateData.status = status
		if (quoteDate !== undefined)
			updateData.quoteDate = new Date(quoteDate)
		if (validUntil !== undefined)
			updateData.validUntil = validUntil ? new Date(validUntil) : null
		if (notes !== undefined) updateData.notes = notes

		// Se itens foram fornecidos, recalcular totais
		if (items && Array.isArray(items)) {
			let totalEstimated = 0
			let totalDiscount = 0

			const processedItems = items.map((item: any) => {
				const quantity = Number.parseFloat(item.quantity) || 0
				const unitPrice = Number.parseFloat(item.unitPrice) || 0
				const unitDiscount = Number.parseFloat(item.unitDiscount) || 0

				const totalPrice = quantity * unitPrice
				const itemDiscount = quantity * unitDiscount
				const finalPrice = totalPrice - itemDiscount

				totalEstimated += totalPrice
				totalDiscount += itemDiscount

				return {
					id: item.id || undefined,
					productId: item.productId || undefined,
					quantity,
					unitPrice,
					unitDiscount,
					totalPrice,
					totalDiscount: itemDiscount,
					finalPrice,
					productName: item.productName,
					productUnit: item.productUnit || "unidade",
					productCategory: item.productCategory || undefined,
					brandName: item.brandName || undefined,
					notes: item.notes || undefined,
					priority: Number.parseInt(item.priority, 10) || 0,
				}
			})

			updateData.totalEstimated = totalEstimated
			updateData.totalDiscount = totalDiscount
			updateData.finalEstimated = totalEstimated - totalDiscount

			// Deletar itens antigos e criar novos
			await prisma.quoteItem.deleteMany({
				where: { quoteId: resolvedParams.id },
			})

			updateData.items = {
				create: processedItems,
			}
		}

		// Atualizar orçamento
		const quote = await prisma.quote.update({
			where: { id: resolvedParams.id },
			data: updateData,
			include: {
				market: true,
				items: {
					include: {
						product: true,
					},
					orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
				},
				_count: {
					select: { items: true },
				},
			},
		})

		return NextResponse.json(quote)
	} catch (error) {
		console.error("[BUDGET_PATCH]", error)
		return NextResponse.json(
			{ error: "Erro ao atualizar orçamento" },
			{ status: 500 },
		)
	}
}

// DELETE /api/quotes/[id] - Deletar orçamento
export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const resolvedParams = await params
		// Verificar se orçamento existe
		const quote = await prisma.quote.findUnique({
			where: { id: resolvedParams.id },
		})

		if (!quote) {
			return NextResponse.json(
				{ error: "Orçamento não encontrado" },
				{ status: 404 },
			)
		}

		// Não permitir deletar orçamentos convertidos
		if (quote.status === "CONVERTED") {
			return NextResponse.json(
				{ error: "Não é possível deletar um orçamento já convertido" },
				{ status: 400 },
			)
		}

		// Deletar orçamento (itens são deletados em cascata)
		await prisma.quote.delete({
			where: { id: resolvedParams.id },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("[BUDGET_DELETE]", error)
		return NextResponse.json(
			{ error: "Erro ao deletar orçamento" },
			{ status: 500 },
		)
	}
}
