import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)

		const search = searchParams.get("search") || ""
		const category = searchParams.get("category") || ""
		const brand = searchParams.get("brand") || ""
		const sort = searchParams.get("sort") || "name-asc"
		const page = parseInt(searchParams.get("page") || "1", 10)
		const limit = parseInt(searchParams.get("limit") || "12", 10)
		const include = searchParams.get("include") || ""

		const skip = (page - 1) * limit

		const where: any = {}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ barcodes: { some: { barcode: { contains: search } } } },
			]
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

		// Configurar includes baseado no parâmetro
		const includeConfig: any = {
			brand: true,
			category: true,
			barcodes: true,
		}

		if (include.includes("nutritionalInfo")) {
			includeConfig.nutritionalInfo = true
		}

		const [products, totalCount] = await Promise.all([
			prisma.product.findMany({
				where,
				include: includeConfig,
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
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 })
	}
}

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const {
			name,
			barcode,
			barcodes,
			categoryId,
			brandId,
			unit,
			packageSize,
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

		// Verificar se algum código de barras já existe na nova tabela
		const allBarcodes = barcodes || (barcode ? [barcode] : [])

		if (allBarcodes.length > 0) {
			for (const barcodeValue of allBarcodes) {
				if (!barcodeValue) continue

				const existingBarcode = await prisma.productBarcode.findUnique({
					where: { barcode: barcodeValue },
					include: { product: true },
				})

				if (existingBarcode) {
					return NextResponse.json(
						{
							error: `Código de barras "${barcodeValue}" já cadastrado para o produto: ${existingBarcode.product.name}`,
						},
						{ status: 409 },
					)
				}
			}

			// Fallback: verificar no campo barcode antigo (compatibilidade)
			for (const barcodeValue of allBarcodes) {
				if (!barcodeValue) continue

				const existingProduct = await prisma.product.findUnique({
					where: { barcode: barcodeValue },
					select: { id: true, name: true },
				})

				if (existingProduct) {
					return NextResponse.json(
						{
							error: `Código de barras "${barcodeValue}" já cadastrado para o produto: ${existingProduct.name}`,
						},
						{ status: 409 },
					)
				}
			}
		}

		const product = await prisma.product.create({
			data: {
				name,
				barcode: barcode || null, // Manter para compatibilidade
				categoryId: categoryId || null,
				brandId: brandId || null,
				unit: unit || "unidade",
				packageSize: packageSize || null,
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
				// Criar registros de barcode na nova tabela
				barcodes: {
					create: allBarcodes.map((barcodeValue: string, index: number) => ({
						barcode: barcodeValue,
						isPrimary: index === 0, // Primeiro é o principal
					})),
				},
			},
			include: {
				brand: true,
				category: true,
				nutritionalInfo: true,
				barcodes: true,
			},
		})

		return NextResponse.json(product, { status: 201 })
	} catch (error) {
		console.error("Erro ao criar produto:", error)
		return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 })
	}
}
