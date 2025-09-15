import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const category = await prisma.category.findUnique({
			where: { id: params.id },
			include: {
				products: {
					include: {
						brand: true,
						category: true,
					},
					orderBy: { name: "asc" },
				},
				// NOVO: Adicionar a contagem de produtos diretamente na consulta
				_count: {
					select: { products: true },
				},
			},
		})

		if (!category) {
			return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
		}

		return NextResponse.json(category)
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar categoria" }, { status: 500 })
	}
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { name, icon, color } = body

		const category = await prisma.category.update({
			where: { id: params.id },
			data: {
				name,
				icon,
				color,
			},
		})

		return NextResponse.json(category)
	} catch (error: any) {
		if (error.code === "P2002") {
			return NextResponse.json({ error: "Categoria já existe" }, { status: 400 })
		}
		if (error.code === "P2025") {
			return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
		}
		return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 })
	}
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		await prisma.category.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ success: true })
	} catch (error: any) {
		if (error.code === "P2025") {
			return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
		}
		return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 })
	}
}
