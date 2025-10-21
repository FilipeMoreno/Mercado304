// src/app/api/shopping-lists/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const searchTerm = searchParams.get("search") || ""
		const sort = searchParams.get("sort") || "date-desc"
		const page = parseInt(searchParams.get("page") || "1", 10)
		const itemsPerPage = 12
		const status = searchParams.get("status") || "all"

		const [orderBy, orderDirection] = sort.split("-")

		const where: any = {
			name: {
				contains: searchTerm,
				mode: "insensitive" as const,
			},
		}

		if (status !== "all") {
			where.isActive = status === "active"
		}

		const [lists, totalCount] = await prisma.$transaction([
			prisma.shoppingList.findMany({
				where,
				include: {
					items: {
						include: {
							product: true,
						},
						orderBy: { createdAt: "asc" },
					},
				},
				orderBy: {
					[orderBy === "date" ? "createdAt" : orderBy]: orderDirection as "asc" | "desc",
				},
				skip: (page - 1) * itemsPerPage,
				take: itemsPerPage,
			}),
			prisma.shoppingList.count({ where }),
		])

		return NextResponse.json({ lists, totalCount })
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao buscar listas" }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { name, items } = body

		if (!name) {
			return NextResponse.json({ error: "Nome da lista é obrigatório" }, { status: 400 })
		}

		// Se não há itens, cria lista vazia
		if (!items || items.length === 0) {
			const list = await prisma.shoppingList.create({
				data: { name },
				include: {
					items: {
						include: { product: true },
					},
				},
			})
			return NextResponse.json(list, { status: 201 })
		}

		// Processa os itens da lista
		const processedItems = await Promise.all(
			items.map(async (item: any) => {
				// Se tem productId, busca dados do produto
				if (item.productId) {
					const product = await prisma.product.findUnique({
						where: { id: item.productId },
					})

					return {
						productId: item.productId,
						productName: product?.name || item.productName || "Produto",
						productUnit: product?.unit || item.productUnit || "unidade",
						quantity: item.quantity || 1,
						estimatedPrice: item.estimatedPrice || null,
					}
				}

				// Se tem productName, tenta buscar produto existente
				if (item.productName) {
					const existingProduct = await prisma.product.findFirst({
						where: {
							name: {
								equals: item.productName,
								mode: "insensitive",
							},
						},
					})

					// Se encontrou produto existente, vincula
					if (existingProduct) {
						return {
							productId: existingProduct.id,
							productName: existingProduct.name,
							productUnit: existingProduct.unit,
							quantity: item.quantity || 1,
							estimatedPrice: item.estimatedPrice || null,
						}
					}

					// Se não encontrou, cria item com texto livre
					return {
						productId: null,
						productName: item.productName,
						productUnit: item.productUnit || "unidade",
						quantity: item.quantity || 1,
						estimatedPrice: item.estimatedPrice || null,
					}
				}

				// Se não tem nem productId nem productName, pula
				return null
			}),
		)

		// Filtra itens nulos
		const validItems = processedItems.filter(Boolean)

		const list = await prisma.shoppingList.create({
			data: {
				name,
				items: {
					create: validItems,
				},
			},
			include: {
				items: {
					include: {
						product: true,
					},
				},
			},
		})

		return NextResponse.json(list, { status: 201 })
	} catch (error) {
		console.error("Erro ao criar lista:", error)
		return NextResponse.json({ error: "Erro ao criar lista" }, { status: 500 })
	}
}
