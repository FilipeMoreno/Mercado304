import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const { productName, marketName, price, notes } = await request.json()

		// Validações básicas
		if (!productName || !marketName || price === undefined) {
			return NextResponse.json(
				{
					success: false,
					error: "Produto, mercado e preço são obrigatórios",
				},
				{ status: 400 },
			)
		}

		if (typeof price !== "number" || price < 0) {
			return NextResponse.json(
				{
					success: false,
					error: "Preço deve ser um número válido maior ou igual a zero",
				},
				{ status: 400 },
			)
		}

		// Buscar ou criar produto
		let product = await prisma.product.findFirst({
			where: { name: { equals: productName, mode: "insensitive" } },
		})

		if (!product) {
			product = await prisma.product.create({
				data: { name: productName },
			})
		}

		// Buscar ou criar mercado
		let market = await prisma.market.findFirst({
			where: { name: { equals: marketName, mode: "insensitive" } },
		})

		if (!market) {
			market = await prisma.market.create({
				data: { name: marketName },
			})
		}

		// Registrar o preço
		const priceRecord = await prisma.priceRecord.create({
			data: {
				productId: product.id,
				marketId: market.id,
				price,
				notes,
				recordDate: new Date(),
			},
			include: {
				product: true,
				market: true,
			},
		})

		return NextResponse.json({
			success: true,
			message: `Preço de ${productName} registrado: R$ ${price.toFixed(2)} no ${marketName}`,
			priceRecord: {
				id: priceRecord.id,
				product: priceRecord.product.name,
				market: priceRecord.market.name,
				price: priceRecord.price,
				recordDate: priceRecord.recordDate,
				notes: priceRecord.notes,
			},
		})
	} catch (error) {
		console.error("Erro ao registrar preço:", error)
		return handleApiError(error)
	}
}

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const productName = searchParams.get("product")
		const marketName = searchParams.get("market")
		const limit = parseInt(searchParams.get("limit") || "50", 10)
		const page = parseInt(searchParams.get("page") || "1", 10)
		const skip = (page - 1) * limit

		// Construir filtros
		const where: {
			product?: { name: { contains: string; mode: "insensitive" } }
			market?: { name: { contains: string; mode: "insensitive" } }
		} = {}

		if (productName) {
			where.product = {
				name: { contains: productName, mode: "insensitive" },
			}
		}

		if (marketName) {
			where.market = {
				name: { contains: marketName, mode: "insensitive" },
			}
		}

		// Buscar total de registros (sem limite)
		const total = await prisma.priceRecord.count({ where })

		// Buscar registros de preços com paginação
		const priceRecords = await prisma.priceRecord.findMany({
			where,
			include: {
				product: true,
				market: true,
			},
			orderBy: { recordDate: "desc" },
			take: limit,
			skip,
		})

		return NextResponse.json({
			success: true,
			priceRecords: priceRecords.map((record) => ({
				id: record.id,
				product: record.product.name,
				market: record.market.name,
				price: record.price,
				recordDate: record.recordDate,
				notes: record.notes,
			})),
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		})
	} catch (error) {
		console.error("Erro ao buscar preços:", error)
		return handleApiError(error)
	}
}

export async function DELETE(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const id = searchParams.get("id")

		if (!id) {
			return NextResponse.json({ success: false, error: "ID do registro é obrigatório" }, { status: 400 })
		}

		await prisma.priceRecord.delete({
			where: { id },
		})

		return NextResponse.json({
			success: true,
			message: "Registro de preço deletado com sucesso",
		})
	} catch (error) {
		console.error("Erro ao deletar registro de preço:", error)
		return handleApiError(error)
	}
}

export async function PATCH(request: Request) {
	try {
		const { id, price, notes } = await request.json()

		if (!id) {
			return NextResponse.json({ success: false, error: "ID do registro é obrigatório" }, { status: 400 })
		}

		if (price !== undefined && (typeof price !== "number" || price < 0)) {
			return NextResponse.json(
				{ success: false, error: "Preço deve ser um número válido maior ou igual a zero" },
				{ status: 400 },
			)
		}

		const updatedRecord = await prisma.priceRecord.update({
			where: { id },
			data: {
				...(price !== undefined && { price }),
				...(notes !== undefined && { notes }),
			},
			include: {
				product: true,
				market: true,
			},
		})

		return NextResponse.json({
			success: true,
			message: "Registro de preço atualizado com sucesso",
			priceRecord: {
				id: updatedRecord.id,
				product: updatedRecord.product.name,
				market: updatedRecord.market.name,
				price: updatedRecord.price,
				recordDate: updatedRecord.recordDate,
				notes: updatedRecord.notes,
			},
		})
	} catch (error) {
		console.error("Erro ao atualizar registro de preço:", error)
		return handleApiError(error)
	}
}
