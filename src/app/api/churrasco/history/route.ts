import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/churrasco/history
 * Busca o histórico de cálculos do churrascômetro do usuário logado
 */
export async function GET(_request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		// Buscar últimos 5 cálculos do usuário, ordenados do mais recente para o mais antigo
		const calculations = await prisma.churrascoCalculation.findMany({
			where: {
				userId: session.user.id,
			},
			orderBy: {
				createdAt: "desc",
			},
			take: 5,
		})

		return NextResponse.json(calculations)
	} catch (error) {
		return handleApiError(error)
	}
}

/**
 * POST /api/churrasco/history
 * Salva um novo cálculo do churrascômetro
 */
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
		}

		const body = await request.json()
		const { adults, children, drinkers, preferences, result } = body

		if (!adults || adults < 1 || !result) {
			return NextResponse.json({ error: "Dados incompletos ou inválidos" }, { status: 400 })
		}

		// Criar novo cálculo
		const newCalculation = await prisma.churrascoCalculation.create({
			data: {
				userId: session.user.id,
				adults,
				children: children || 0,
				drinkers: drinkers || 0,
				preferences: preferences || null,
				result,
			},
		})

		return NextResponse.json(newCalculation, { status: 201 })
	} catch (error) {
		return handleApiError(error)
	}
}
