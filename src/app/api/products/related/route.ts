// src/app/api/products/related/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const { productId } = await request.json()

		if (!productId) {
			return NextResponse.json({ error: "Product ID é obrigatório" }, { status: 400 })
		}

		// OTIMIZADO: Buscar purchaseIds e itens relacionados em uma única transação
		const [purchasesWithProduct, relatedItems] = await prisma.$transaction(async (tx) => {
			// Buscar todas as compras que contêm o produto inicial
			const purchases = await tx.purchaseItem.findMany({
				where: { productId },
				select: {
					purchaseId: true,
				},
			})

			const purchaseIds = purchases.map((p) => p.purchaseId)

			// Se não há compras, retornar vazio
			if (purchaseIds.length === 0) {
				return [[], []]
			}

			// Encontrar todos os outros itens nessas mesmas compras
			const items = await tx.purchaseItem.findMany({
				where: {
					purchaseId: { in: purchaseIds },
					productId: { not: productId },
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

			return [purchases, items]
		})

		// Contar a frequência dos produtos relacionados e filtrar
		// MODIFICAÇÃO: A contagem agora soma a quantidade de cada item
		const relatedProductsCount = relatedItems.reduce((acc: any, item) => {
			if (item.productId && item.product) {
				const productInfo = {
					id: item.productId,
					name: item.product.name,
					brandName: item.product.brand?.name || "",
					count: (acc[item.productId]?.count || 0) + item.quantity, // Soma a quantidade
				}
				acc[item.productId] = productInfo
			}
			return acc
		}, {})

		const sortedSuggestions = Object.values(relatedProductsCount)
			.sort((a: any, b: any) => b.count - a.count)
			.slice(0, 5) // Retornar os 5 mais frequentes

		return NextResponse.json(sortedSuggestions)
	} catch (error) {
		console.error("Erro ao buscar produtos relacionados:", error)
		return NextResponse.json({ error: "Erro ao buscar produtos relacionados" }, { status: 500 })
	}
}
