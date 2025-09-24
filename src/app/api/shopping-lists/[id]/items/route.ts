import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
	try {
		const listId = params.id

		if (!listId) {
			return NextResponse.json({ error: "ID da lista é obrigatório" }, { status: 400 })
		}

		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: listId },
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
		}

		const listItems = shoppingList.items.map((item) => ({
			id: item.id,
			productId: item.productId || "",
			productName: item.product?.name || item.productName || "Produto não encontrado",
			quantity: item.quantity,
			unit: item.product?.unit || item.productUnit || "un",
			notes: item.tempNotes || undefined,
		}))

		return NextResponse.json({
			listId: shoppingList.id,
			listName: shoppingList.name,
			items: listItems,
		})
	} catch (error) {
		console.error("Erro ao buscar itens da lista:", error)
		return NextResponse.json({ error: "Erro ao buscar itens da lista" }, { status: 500 })
	}
}