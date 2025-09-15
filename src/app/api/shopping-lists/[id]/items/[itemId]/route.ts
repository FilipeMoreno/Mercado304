import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request, { params }: { params: { id: string; itemId: string } }) {
	try {
		const { id: listId, itemId } = params
		const { isChecked, quantity, estimatedPrice } = await request.json()

		// Validar os dados recebidos
		const updateData: any = {}

		if (isChecked !== undefined) {
			if (typeof isChecked !== "boolean") {
				return NextResponse.json({ error: "O valor de isChecked deve ser booleano" }, { status: 400 })
			}
			updateData.isChecked = isChecked
		}

		if (quantity !== undefined) {
			if (typeof quantity !== "number" || quantity <= 0) {
				return NextResponse.json({ error: "A quantidade deve ser um número maior que zero" }, { status: 400 })
			}
			updateData.quantity = quantity
		}

		if (estimatedPrice !== undefined) {
			if (typeof estimatedPrice === "number" && estimatedPrice >= 0) {
				updateData.estimatedPrice = estimatedPrice
			} else if (estimatedPrice === null || estimatedPrice === 0) {
				updateData.estimatedPrice = null
			}
		}

		const updatedItem = await prisma.shoppingListItem.update({
			where: {
				id: itemId,
				listId: listId,
			},
			data: updateData,
			include: {
				product: {
					include: {
						brand: true,
					},
				},
			},
		})

		return NextResponse.json(updatedItem)
	} catch (error) {
		console.error("Erro ao atualizar item da lista:", error)
		return NextResponse.json({ error: "Erro ao atualizar item da lista" }, { status: 500 })
	}
}

export async function DELETE(request: Request, { params }: { params: { id: string; itemId: string } }) {
	try {
		const { id: listId, itemId } = params

		// Verificar se o item existe e pertence à lista
		const existingItem = await prisma.shoppingListItem.findUnique({
			where: { id: itemId },
		})

		if (!existingItem || existingItem.listId !== listId) {
			return NextResponse.json({ error: "Item não encontrado" }, { status: 404 })
		}

		await prisma.shoppingListItem.delete({
			where: { id: itemId },
		})

		return NextResponse.json({ message: "Item removido com sucesso" })
	} catch (error) {
		console.error("Erro ao remover item:", error)
		return NextResponse.json({ error: "Erro ao remover item" }, { status: 500 })
	}
}
