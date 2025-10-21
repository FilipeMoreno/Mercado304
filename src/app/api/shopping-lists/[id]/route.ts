import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const shoppingList = await prisma.shoppingList.findUnique({
			where: { id: params.id },
			include: {
				items: {
					include: {
						product: {
							include: {
								brand: true,
								category: true,
							},
						},
					},
				},
			},
		})

		if (!shoppingList) {
			return NextResponse.json({ error: "Lista não encontrada" }, { status: 404 })
		}

		return NextResponse.json(shoppingList)
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao buscar lista" }, { status: 500 })
	}
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		const body = await request.json()
		const { name, isActive } = body

		if (!name) {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
		}

		const shoppingList = await prisma.shoppingList.update({
			where: { id: params.id },
			data: {
				name: name.trim(),
				isActive: isActive ?? true,
			},
		})

		return NextResponse.json(shoppingList)
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao atualizar lista" }, { status: 500 })
	}
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
	const params = await props.params
	try {
		await prisma.shoppingList.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ message: "Lista excluída com sucesso" })
	} catch (_error) {
		return NextResponse.json({ error: "Erro ao excluir lista" }, { status: 500 })
	}
}
