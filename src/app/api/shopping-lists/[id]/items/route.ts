import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const {
			productId,
			quantity,
			isTemporary,
			productName,
			tempDescription,
			tempBarcode,
			tempBrand,
			tempCategory,
			tempNotes,
			productUnit,
			estimatedPrice,
		} = body

		// Validação: pelo menos productId ou productName (para temporários) deve estar presente
		if (!productId && !productName) {
			return NextResponse.json({ error: "ProductId ou productName são obrigatórios" }, { status: 400 })
		}

		if (!quantity) {
			return NextResponse.json({ error: "Quantity é obrigatório" }, { status: 400 })
		}

		// Verificar se a lista existe
		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: params.id },
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
		}

		// Se não é temporário, verificar se o produto existe
		if (productId && !isTemporary) {
			const product = await prisma.product.findUnique({
				where: { id: productId },
			})

			if (!product) {
				return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
			}
		}

		// Para itens não temporários, verificar se já existe na lista
		if (productId && !isTemporary) {
			const existingItem = await prisma.shoppingListItem.findFirst({
				where: {
					listId: params.id,
					productId: productId,
					isTemporary: false,
				},
			})

			if (existingItem) {
				// Se já existe, atualizar a quantidade
				const updatedItem = await prisma.shoppingListItem.update({
					where: { id: existingItem.id },
					data: {
						quantity: existingItem.quantity + quantity,
					},
					include: {
						product: {
							include: {
								brand: true,
							},
						},
					},
				})

				return NextResponse.json(updatedItem)
			}
		}

		// Criar novo item (temporário ou não)
		const newItem = await prisma.shoppingListItem.create({
			data: {
				listId: params.id,
				productId: isTemporary ? null : productId,
				quantity,
				productName: productName,
				productUnit: productUnit,
				estimatedPrice: estimatedPrice,
				isTemporary: isTemporary || false,
				tempDescription: tempDescription,
				tempBarcode: tempBarcode,
				tempBrand: tempBrand,
				tempCategory: tempCategory,
				tempNotes: tempNotes,
			},
			include: {
				product: {
					include: {
						brand: true,
					},
				},
			},
		})

		return NextResponse.json(newItem)
	} catch (error) {
		console.error("Erro ao adicionar item à lista:", error)
		return NextResponse.json({ error: "Erro ao adicionar item à lista" }, { status: 500 })
	}
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const items = await prisma.shoppingListItem.findMany({
			where: {
				listId: params.id,
			},
			include: {
				product: {
					include: {
						brand: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		})

		return NextResponse.json(items)
	} catch (error) {
		console.error("Erro ao buscar itens da lista:", error)
		return NextResponse.json({ error: "Erro ao buscar itens da lista" }, { status: 500 })
	}
}
