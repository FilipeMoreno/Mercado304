import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { AppError } from "@/lib/errors"
import { parseOcrText } from "@/lib/gemini-parser"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
	try {
		const productId = params.id
		const { text } = await request.json()

		if (!text) {
			throw new AppError("GEN_001", "Texto não fornecido.")
		}

		// CORREÇÃO: Usando a nova função para processar texto bruto
		const parsedData = parseOcrText(text)

		const nutritionalInfo = await prisma.nutritionalInfo.upsert({
			where: { productId },
			update: parsedData,
			create: {
				productId,
				...parsedData,
			},
		})

		return NextResponse.json(nutritionalInfo)
	} catch (error) {
		return handleApiError(error)
	}
}

// O resto do arquivo (GET e DELETE) permanece o mesmo.
export async function GET(request: Request, { params }: { params: { id: string } }) {
	try {
		const productId = params.id

		const nutritionalInfo = await prisma.nutritionalInfo.findUnique({
			where: { productId },
			include: {
				product: {
					select: {
						id: true,
						name: true,
						unit: true,
					},
				},
			},
		})

		if (!nutritionalInfo) {
			throw new AppError("GEN_003", "Informações nutricionais não encontradas para este produto.")
		}

		return NextResponse.json(nutritionalInfo)
	} catch (error) {
		return handleApiError(error)
	}
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		const productId = params.id

		await prisma.nutritionalInfo.delete({
			where: { productId },
		})

		return NextResponse.json({
			success: true,
			message: "Informações nutricionais removidas com sucesso.",
		})
	} catch (error) {
		return handleApiError(error)
	}
}
