import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * DELETE /api/stock/reset
 * Reseta todo o estoque (deleta todos os itens)
 * Requer autenticação
 */
export async function DELETE() {
	try {
		const session = await getSession()

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Contar itens antes de deletar
		const countBefore = await prisma.stockItem.count()

		// Deletar todos os itens de estoque
		const result = await prisma.stockItem.deleteMany({})

		return NextResponse.json({
			success: true,
			message: `Estoque resetado com sucesso! ${result.count} itens foram removidos.`,
			deletedCount: result.count,
			countBefore,
		})
	} catch (error) {
		console.error("[ResetStock] Erro ao resetar estoque:", error)
		return NextResponse.json(
			{
				error: "Erro ao resetar o estoque",
				details: error instanceof Error ? error.message : "Erro desconhecido",
			},
			{ status: 500 },
		)
	}
}
