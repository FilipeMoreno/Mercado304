import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const market = await prisma.market.findUnique({
			where: { id: params.id },
		})

		if (!market) {
			return NextResponse.json({ error: "Mercado não encontrado" }, { status: 404 })
		}

		return NextResponse.json(market)
	} catch {
		return NextResponse.json({ error: "Erro ao buscar mercado" }, { status: 500 })
	}
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		const body = await request.json()
		const { name, legalName, location } = body

		if (!name) {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
		}

		const market = await prisma.market.update({
			where: { id: params.id },
			data: {
				name,
				legalName: legalName || null,
				location: location || null,
			},
		})

		return NextResponse.json(market)
	} catch {
		return NextResponse.json({ error: "Erro ao atualizar mercado" }, { status: 500 })
	}
}

export async function DELETE(_request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
		await prisma.market.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ message: "Mercado excluído com sucesso" })
	} catch {
		return NextResponse.json({ error: "Erro ao excluir mercado" }, { status: 500 })
	}
}
