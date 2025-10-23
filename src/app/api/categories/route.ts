import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		const search = searchParams.get("search") || ""
		const sort = searchParams.get("sort") || "name-asc"
		const page = parseInt(searchParams.get("page") || "1")
		const limit = parseInt(searchParams.get("limit") || "12")

		const skip = (page - 1) * limit

		const where: any = {}

		if (search) {
			where.name = { contains: search, mode: "insensitive" }
		}

		let orderBy: any = { name: "asc" }
		switch (sort) {
			case "name-desc":
				orderBy = { name: "desc" }
				break
			case "products-count":
				orderBy = { products: { _count: "desc" } }
				break
			case "date-desc":
				orderBy = { createdAt: "desc" }
				break
		}

		const [categories, totalCount] = await Promise.all([
			prisma.category.findMany({
				where,
				orderBy,
				skip,
				take: limit,
				include: {
					_count: {
						select: { products: true },
					},
				},
			}),
			prisma.category.count({ where }),
		])

		const totalPages = Math.ceil(totalCount / limit)

		return NextResponse.json({
			categories,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasMore: page < totalPages,
			},
		})
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { name, icon, color, isFood } = body

		if (!name) {
			return NextResponse.json({ error: "Nome da categoria é obrigatório" }, { status: 400 })
		}

		const category = await prisma.category.create({
			data: {
				name,
				icon,
				color,
				isFood: isFood ?? false,
			},
		})

		return NextResponse.json(category, { status: 201 })
	} catch (error: any) {
		if (error.code === "P2002") {
			return NextResponse.json({ error: "Categoria já existe" }, { status: 400 })
		}
		return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 })
	}
}
