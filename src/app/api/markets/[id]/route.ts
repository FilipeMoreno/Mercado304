import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const market = await prisma.market.findUnique({
			where: { id: params.id },
		})

		if (!market) {
			return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })
		}

		return NextResponse.json(market)
	} catch (error) {
		return NextResponse.json({ error: "Erro ao buscar mercado" }, { status: 500 })
	}
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { name, location } = body

		if (!name) {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
		}

		const market = await prisma.market.update({
			where: { id: params.id },
			data: {
				name,
				location: location || null,
			},
		})

		return NextResponse.json(market)
	} catch (error) {
		return NextResponse.json({ error: "Erro ao atualizar mercado" }, { status: 500 })
	}
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		await prisma.market.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ message: "Mercado excluído com sucesso" })
	} catch (error) {
		return NextResponse.json({ error: "Erro ao excluir mercado" }, { status: 500 })
	}
}
