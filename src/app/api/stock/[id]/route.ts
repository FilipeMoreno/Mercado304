import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Buscar item específico do estoque
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const { id } = resolvedParams

		const stockItem = await prisma.stockItem.findUnique({
			where: { id },
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					},
				},
			},
		})

		if (!stockItem) {
			return NextResponse.json({ error: "Item de estoque não encontrado" }, { status: 404 })
		}

		return NextResponse.json(stockItem)
	} catch (error) {
		console.error("Erro ao buscar item do estoque:", error)
		return NextResponse.json({ error: "Erro ao buscar item do estoque" }, { status: 500 })
	}
}

// PUT - Atualizar item do estoque
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const { id } = resolvedParams
		const data = await request.json()
		
		console.log("PUT /api/stock/[id] - Received data:", { id, data })

		const {
			quantity,
			expirationDate,
			location,
			unitCost,
			notes,
			consumed, // Quantidade consumida (para registrar saída)
		} = data

		const existingItem = await prisma.stockItem.findUnique({
			where: { id },
			include: { product: true },
		})

		if (!existingItem) {
			return NextResponse.json({ error: "Item de estoque não encontrado" }, { status: 404 })
		}

		// Se está registrando consumo
		if (consumed && consumed > 0) {
			const newQuantity = Math.max(0, existingItem.quantity - consumed)

			// Atualizar quantidade
			const updatedItem = await prisma.stockItem.update({
				where: { id },
				data: {
					quantity: newQuantity,
					isLowStock:
						existingItem.product.hasStock && existingItem.product.minStock
							? newQuantity <= existingItem.product.minStock
							: false,
				},
				include: {
					product: {
						include: {
							brand: true,
							category: true,
						},
					},
				},
			})

			// Registrar movimento de saída
			await prisma.stockMovement.create({
				data: {
					stockItemId: id,
					type: "SAIDA",
					quantity: consumed,
					reason: "Consumo registrado",
					notes: `Consumo: ${consumed} ${existingItem.product.unit}`,
				},
			})

			return NextResponse.json(updatedItem)
		}

		// Atualização normal do item
		const updatedItem = await prisma.stockItem.update({
			where: { id },
			data: {
				...(quantity !== undefined && { quantity }),
				...(expirationDate !== undefined && {
					expirationDate: expirationDate ? new Date(expirationDate) : null,
				}),
				...(location !== undefined && { location }),
				...(unitCost !== undefined && { unitCost }),
				...(notes !== undefined && { notes }),
				isLowStock:
					existingItem.product.hasStock && existingItem.product.minStock
						? (quantity || existingItem.quantity) <= existingItem.product.minStock
						: false,
			},
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					},
				},
			},
		})

		// Se a quantidade mudou, registrar movimento de ajuste
		if (quantity !== undefined && quantity !== existingItem.quantity) {
			const difference = quantity - existingItem.quantity
			await prisma.stockMovement.create({
				data: {
					stockItemId: id,
					type: "AJUSTE",
					quantity: Math.abs(difference),
					reason: difference > 0 ? "Ajuste - aumento" : "Ajuste - diminuição",
					notes,
				},
			})
		}

		return NextResponse.json(updatedItem)
	} catch (error) {
		console.error("Erro ao atualizar estoque:", error)
		return NextResponse.json({ error: "Erro ao atualizar estoque" }, { status: 500 })
	}
}

// DELETE - Remover item do estoque
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const { id } = resolvedParams

		// Verificar se item existe
		const existingItem = await prisma.stockItem.findUnique({
			where: { id },
		})

		if (!existingItem) {
			return NextResponse.json({ error: "Item de estoque não encontrado" }, { status: 404 })
		}

		// Registrar movimento antes de deletar
		await prisma.stockMovement.create({
			data: {
				stockItemId: id,
				type: "SAIDA",
				quantity: existingItem.quantity,
				reason: "Remoção do estoque",
			},
		})

		// Deletar item (movimentos são deletados em cascata)
		await prisma.stockItem.delete({
			where: { id },
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Erro ao remover do estoque:", error)
		return NextResponse.json({ error: "Erro ao remover do estoque" }, { status: 500 })
	}
}
