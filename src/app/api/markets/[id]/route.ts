import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { deleteImageFromR2 } from "@/lib/r2-utils"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { name, legalName, location, imageUrl } = body

		if (!name) {
			return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
		}

		// Buscar o mercado atual para verificar se há imagem antiga
		const currentMarket = await prisma.market.findUnique({
			where: { id: params.id },
			select: { imageUrl: true },
		})

		// Se há uma imagem antiga e uma nova foi enviada, deletar a antiga
		if (currentMarket?.imageUrl && imageUrl && currentMarket.imageUrl !== imageUrl) {
			// Deletar imagem antiga do R2 (não bloquear se falhar)
			deleteImageFromR2(currentMarket.imageUrl).catch((error) => {
				console.error("Erro ao deletar imagem antiga:", error)
			})
		}

		const market = await prisma.market.update({
			where: { id: params.id },
			data: {
				name,
				legalName: legalName || null,
				location: location || null,
				imageUrl: imageUrl || null,
			},
		})

		return NextResponse.json(market)
	} catch {
		return NextResponse.json({ error: "Erro ao atualizar mercado" }, { status: 500 })
	}
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
	try {
		// Buscar o mercado para obter a URL da imagem
		const market = await prisma.market.findUnique({
			where: { id: params.id },
			select: { imageUrl: true },
		})

		// Deletar a imagem do R2 se existir
		if (market?.imageUrl) {
			deleteImageFromR2(market.imageUrl).catch((error) => {
				console.error("Erro ao deletar imagem do mercado:", error)
			})
		}

		// Deletar o mercado do banco
		await prisma.market.delete({
			where: { id: params.id },
		})

		return NextResponse.json({ message: "Mercado excluído com sucesso" })
	} catch {
		return NextResponse.json({ error: "Erro ao excluir mercado" }, { status: 500 })
	}
}
