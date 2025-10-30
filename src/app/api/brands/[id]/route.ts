import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const brand = await prisma.brand.findUnique({
			where: { id: resolvedParams.id },
		})

		if (!brand) {
			return NextResponse.json({ error: "Marca não encontrada" }, { status: 404 })
		}

		const products = await prisma.product.findMany({
			where: { brandId: resolvedParams.id },
			include: {
				brand: true,
				category: true,
			},
			orderBy: { name: "asc" },
		})

		return NextResponse.json({
			...brand,
			products,
			_count: {
				products: products.length,
			},
		})
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar marca" }, { status: 500 })
	}
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		const body = await request.json()
		const { name, imageUrl } = body

		const brand = await prisma.brand.update({
			where: { id: resolvedParams.id },
			data: {
				name,
				imageUrl: imageUrl !== undefined ? imageUrl : undefined,
			},
		})

		return NextResponse.json(brand)
	} catch (error: any) {
		if (error.code === "P2002") {
			return NextResponse.json({ error: "Marca já existe" }, { status: 400 })
		}
		if (error.code === "P2025") {
			return NextResponse.json({ error: "Marca não encontrada" }, { status: 404 })
		}
		return NextResponse.json({ error: "Erro ao atualizar marca" }, { status: 500 })
	}
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolvedParams = await params
		await prisma.brand.delete({
			where: { id: resolvedParams.id },
		})

		return NextResponse.json({ success: true })
	} catch (error: any) {
		if (error.code === "P2025") {
			return NextResponse.json({ error: "Marca não encontrada" }, { status: 404 })
		}
		return NextResponse.json({ error: "Erro ao excluir marca" }, { status: 500 })
	}
}
