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

export async function POST(request: Request, { params }: { params: { id: string } }) {
	try {
		const listId = params.id
		const body = await request.json()
		const { productName, quantity = 1, productUnit = "un" } = body

		if (!listId) {
			return NextResponse.json({ error: "ID da lista é obrigatório" }, { status: 400 })
		}

		if (!productName) {
			return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 })
		}

		// Verificar se a lista existe
		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: listId },
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
		}

		// Tentar encontrar produto existente
		const existingProduct = await prisma.product.findFirst({
			where: {
				name: {
					equals: productName,
					mode: "insensitive",
				},
			},
		})

		// Criar item na lista
		const newItem = await prisma.shoppingListItem.create({
			data: {
				listId: listId,
				productId: existingProduct?.id || null,
				productName: existingProduct ? null : productName,
				productUnit: existingProduct ? null : productUnit,
				quantity: quantity,
			},
			include: {
				product: true,
			},
		})

		return NextResponse.json({
			success: true,
			item: {
				id: newItem.id,
				productId: newItem.productId || "",
				productName: newItem.product?.name || newItem.productName || "Produto não encontrado",
				quantity: newItem.quantity,
				unit: newItem.product?.unit || newItem.productUnit || "un",
			},
		}, { status: 201 })
	} catch (error) {
		console.error("Erro ao adicionar item à lista:", error)
		return NextResponse.json({ error: "Erro ao adicionar item à lista" }, { status: 500 })
	}
}