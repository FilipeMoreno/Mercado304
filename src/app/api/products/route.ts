import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		const search = searchParams.get("search") || ""
		const category = searchParams.get("category") || ""
		const brand = searchParams.get("brand") || ""
		const sort = searchParams.get("sort") || "name-asc"
		const page = parseInt(searchParams.get("page") || "1")
		const limit = parseInt(searchParams.get("limit") || "12")

		const skip = (page - 1) * limit

		const where: any = {}

		if (search) {
			where.OR = [{ name: { contains: search, mode: "insensitive" } }, { barcode: { contains: search } }]
		}

		if (category && category !== "all") {
			where.categoryId = category
		}

		if (brand && brand !== "all") {
			where.brandId = brand
		}

		let orderBy: any = { name: "asc" }
		switch (sort) {
			case "name-desc":
				orderBy = { name: "desc" }
				break
			case "category":
				orderBy = { category: { name: "asc" } }
				break
			case "date-desc":
				orderBy = { createdAt: "desc" }
				break
		}

		const [products, totalCount] = await Promise.all([
			prisma.product.findMany({
				where,
				include: {
					brand: true,
					category: true,
				},
				orderBy,
				skip,
				take: limit,
			}),
			prisma.product.count({ where }),
		])

		const totalPages = Math.ceil(totalCount / limit)

		return NextResponse.json({
			products,
			pagination: {
				currentPage: page,
				totalPages,
				totalCount,
				hasMore: page < totalPages,
			},
		})
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const {
			name,
			barcode,
			categoryId,
			brandId,
			unit,
			hasStock,
			minStock,
			maxStock,
			hasExpiration,
			defaultShelfLifeDays,
			nutritionalInfo,
		} = body

		if (!name) {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
		}

		const product = await prisma.product.create({
			data: {
				name,
				barcode: barcode || null,
				categoryId: categoryId || null,
				brandId: brandId || null,
				unit: unit || "unidade",
				hasStock,
				minStock,
				maxStock,
				hasExpiration,
				defaultShelfLifeDays,
				...(nutritionalInfo && {
					nutritionalInfo: {
						create: nutritionalInfo,
					},
				}),
			},
			include: {
				brand: true,
				category: true,
				nutritionalInfo: true,
			},
		})

		return NextResponse.json(product, { status: 201 })
	} catch (error) {
		console.error("Erro ao criar produto:", error)
		return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 })
	}
}
