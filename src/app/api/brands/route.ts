// src/app/api/brands/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const searchTerm = searchParams.get("search") || ""
		const sort = searchParams.get("sort") || "name"
		const page = parseInt(searchParams.get("page") || "1", 10)
		const itemsPerPage = parseInt(searchParams.get("limit") || "12", 10)

		const [orderBy, orderDirection] = sort.split("-").length === 2 ? sort.split("-") : [sort, "asc"]

		const where = {
			name: {
				contains: searchTerm,
				mode: "insensitive" as const,
			},
		}

		const [brands, totalCount] = await prisma.$transaction([
			prisma.brand.findMany({
				where,
				include: {
					_count: {
						select: { products: true },
					},
				},
				orderBy: {
					[orderBy === "date" ? "createdAt" : orderBy]: orderDirection as "asc" | "desc",
				},
				skip: (page - 1) * itemsPerPage,
				take: itemsPerPage,
			}),
			prisma.brand.count({ where }),
		])

		const totalPages = Math.ceil(totalCount / itemsPerPage)

		return NextResponse.json({
			brands: brands || [],
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasMore: page < totalPages,
			},
		})
	} catch (error) {
		console.error("Erro ao buscar marcas:", error)
		return NextResponse.json(
			{
				error: "Erro ao buscar marcas",
				brands: [],
				pagination: { currentPage: 1, totalPages: 0, totalCount: 0, hasMore: false },
			},
			{ status: 500 },
		)
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { name } = body

		if (!name) {
			return NextResponse.json({ error: "Nome da marca é obrigatório" }, { status: 400 })
		}

		const brand = await prisma.brand.create({
			data: { name: name.trim() },
		})

		return NextResponse.json(brand, { status: 201 })
	} catch (error) {
		if (error instanceof Error && error.message.includes("Unique constraint")) {
			return NextResponse.json({ error: "Marca já existe" }, { status: 400 })
		}
		return NextResponse.json({ error: "Erro ao criar marca" }, { status: 500 })
	}
}
