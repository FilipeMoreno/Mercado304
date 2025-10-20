import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
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
			...item,
			product: item.product || undefined,
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

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const listId = params.id
		const body = await request.json()
		const {
			productId,
			productName,
			quantity = 1,
			productUnit = "unidade",
			estimatedPrice,
			brand,
			category,
			notes,
		} = body

		if (!listId) {
			return NextResponse.json({ error: "ID da lista é obrigatório" }, { status: 400 })
		}

		if (!productName || !productName.trim()) {
			return NextResponse.json({ error: "Nome do produto é obrigatório" }, { status: 400 })
		}

		// Verificar se a lista existe
		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: listId },
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
		}

		// Criar item na lista
		const newItem = await prisma.shoppingListItem.create({
			data: {
				listId: listId,
				productId: productId || null,
				productName: productName.trim(),
				productUnit: productUnit,
				quantity: quantity,
				estimatedPrice: estimatedPrice || null,
				brand: brand?.trim() || null,
				category: category?.trim() || null,
				notes: notes?.trim() || null,
			},
			include: {
				product: {
					include: {
						brand: true,
						category: true,
					}
				},
			},
		})

		return NextResponse.json({
			...newItem,
			// Manter compatibilidade com código antigo
			success: true,
		}, { status: 201 })
	} catch (error) {
		console.error("Erro ao adicionar item à lista:", error)
		return NextResponse.json({ error: "Erro ao adicionar item à lista" }, { status: 500 })
	}
}