// src/app/api/alexa/actions/route.ts

import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Adapte sua função de adicionar item para aceitar um userId
async function addItemToListForUser(listName: string, itemName: string) {
	// 1. Encontrar a lista de compras do usuário
	let shoppingList = await prisma.shoppingList.findFirst({
		where: {
			name: { equals: listName, mode: "insensitive" },
			isActive: true,
		},
	})

	// 2. Se a lista não existir, criar uma para o usuário
	if (!shoppingList) {
		shoppingList = await prisma.shoppingList.create({
			data: {
				name: listName,
				isActive: true,
			},
		})
	}

	// 3. Encontrar o produto
	// Esta parte usa a lógica do seu arquivo `selection-functions.ts`
	const product = await prisma.product.findFirst({
		where: { name: { equals: itemName, mode: "insensitive" } },
	})

	if (!product) {
		throw new Error(`Produto "${itemName}" não encontrado.`)
	}

	// 4. Adicionar o item à lista
	await prisma.shoppingListItem.create({
		data: {
			listId: shoppingList.id,
			productId: product.id,
			quantity: 1, // Quantidade padrão, pode ser aprimorado depois
		},
	})

	return { message: `Adicionei ${itemName} à sua lista de ${listName}.` }
}

export async function POST(request: Request) {
	// --- 1. Verificação de Segurança ---
	const headersList = headers()
	const authorization = headersList.get("Authorization")

	if (authorization !== `Bearer ${process.env.ALEXA_SKILL_SECRET_KEY}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	// --- 2. Processamento da Requisição da Alexa ---
	const body = await request.json()
	const intentName = body.request?.intent?.name

	let responseText = "Desculpe, não consegui entender o que você disse."

	// --- 3. Lógica para a Intenção "AddItemIntent" ---
	if (intentName === "AddItemIntent") {
		const listName = body.request.intent.slots.listName.value
		const itemName = body.request.intent.slots.item.value

		try {
			// Chama a função adaptada com seu ID de usuário
			const result = await addItemToListForUser(listName, itemName)
			responseText = result.message
		} catch (e: unknown) {
			console.error(e)
			responseText = `Não consegui adicionar ${itemName}. Verifique se o produto está cadastrado.`
		}
	}

	// --- 4. Formatar e Enviar a Resposta para a Alexa ---
	return NextResponse.json({
		version: "1.0",
		response: {
			outputSpeech: {
				type: "PlainText",
				text: responseText,
			},
			shouldEndSession: true,
		},
	})
}
