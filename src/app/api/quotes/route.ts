import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { QuoteStatus } from "@/types"

// GET /api/quotes - Listar orçamentos com filtros
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const search = searchParams.get("search") || ""
		const status = searchParams.get("status") as QuoteStatus | null
		const marketId = searchParams.get("marketId")
		const page = Number.parseInt(searchParams.get("page") || "1", 10)
		const limit = Number.parseInt(searchParams.get("limit") || "12", 10)
		const sortBy = searchParams.get("sortBy") || "quoteDate"
		const sortOrder = searchParams.get("sortOrder") || "desc"

		const skip = (page - 1) * limit

		// Construir filtros
		const where: any = {}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
				{ notes: { contains: search, mode: "insensitive" } },
			]
		}

		if (status) {
			where.status = status
		}

		if (marketId) {
			where.marketId = marketId
		}

		// OTIMIZADO: Agrupar queries simples em transação
		const [quotes, total] = await prisma.$transaction([
			prisma.quote.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
				include: {
					market: true,
					_count: {
						select: { items: true },
					},
				},
			}),
			prisma.quote.count({ where }),
		])

		return NextResponse.json({
			quotes,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		})
	} catch (error) {
		console.error("[BUDGETS_GET]", error)
		return NextResponse.json(
			{ error: "Erro ao buscar orçamentos" },
			{ status: 500 },
		)
	}
}

// POST /api/quotes - Criar novo orçamento
export async function POST(request: Request) {
	try {
		const body = await request.json()
		const {
			name,
			description,
			marketId,
			status = "DRAFT",
			quoteDate,
			validUntil,
			notes,
			items = [],
		} = body

		// Validações básicas
		if (!name || name.trim() === "") {
			return NextResponse.json(
				{ error: "Nome do orçamento é obrigatório" },
				{ status: 400 },
			)
		}

		// Calcular totais dos itens
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

		const finalEstimated = totalEstimated - totalDiscount

		// Criar orçamento com itens
		const quote = await prisma.quote.create({
			data: {
				name,
				description: description || undefined,
				marketId: marketId || undefined,
				status,
				totalEstimated,
				totalDiscount,
				finalEstimated,
				quoteDate: quoteDate ? new Date(quoteDate) : new Date(),
				validUntil: validUntil ? new Date(validUntil) : undefined,
				notes: notes || undefined,
				items: {
					create: processedItems,
				},
			},
			include: {
				market: true,
				items: {
					include: {
						product: true,
					},
				},
				_count: {
					select: { items: true },
				},
			},
		})

		return NextResponse.json(quote, { status: 201 })
	} catch (error) {
		console.error("[BUDGETS_POST]", error)
		return NextResponse.json(
			{ error: "Erro ao criar orçamento" },
			{ status: 500 },
		)
	}
}
