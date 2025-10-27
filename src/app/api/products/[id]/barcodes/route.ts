import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Buscar todos os barcodes de um produto
export async function GET(_request: Request, { params }: { params: { id: string } }) {
	try {
		const barcodes = await prisma.productBarcode.findMany({
			where: { productId: params.id },
			orderBy: { isPrimary: 'desc' },
		})

		return NextResponse.json(barcodes)
	} catch (error) {
		console.error("Erro ao buscar códigos de barras:", error)
		return NextResponse.json({ error: "Erro ao buscar códigos de barras" }, { status: 500 })
	}
}

// POST - Adicionar um novo barcode a um produto existente
export async function POST(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { barcode } = body

		if (!barcode) {
			return NextResponse.json({ error: "Código de barras é obrigatório" }, { status: 400 })
		}

		// Verificar se o produto existe
		const product = await prisma.product.findUnique({
			where: { id: params.id },
		})

		if (!product) {
			return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
		}

		// Verificar se o código já existe em qualquer produto
		const existingBarcode = await prisma.productBarcode.findUnique({
			where: { barcode },
			include: { product: true },
		})

		if (existingBarcode) {
			return NextResponse.json(
				{
					error: `Código de barras já cadastrado para o produto: ${existingBarcode.product.name}`,
				},
				{ status: 409 },
			)
		}

		// Verificar no campo barcode antigo
		const existingProduct = await prisma.product.findUnique({
			where: { barcode },
			select: { id: true, name: true },
		})

		if (existingProduct) {
			return NextResponse.json(
				{
					error: `Código de barras já cadastrado para o produto: ${existingProduct.name}`,
				},
				{ status: 409 },
			)
		}

		// Verificar se já existe algum barcode principal para este produto
		const hasPrimary = await prisma.productBarcode.findFirst({
			where: { productId: params.id, isPrimary: true },
		})

		// Criar o barcode
		const newBarcode = await prisma.productBarcode.create({
			data: {
				productId: params.id,
				barcode,
				isPrimary: !hasPrimary, // Se não tem principal, este será
			},
		})

		return NextResponse.json(newBarcode, { status: 201 })
	} catch (error) {
		console.error("Erro ao adicionar código de barras:", error)
		return NextResponse.json({ error: "Erro ao adicionar código de barras" }, { status: 500 })
	}
}

// DELETE - Remover um barcode
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		const url = new URL(request.url)
		const barcodeId = url.searchParams.get("barcodeId")

		if (!barcodeId) {
			return NextResponse.json({ error: "ID do código de barras é obrigatório" }, { status: 400 })
		}

		// Verificar se o barcode pertence ao produto
		const barcode = await prisma.productBarcode.findFirst({
			where: {
				id: barcodeId,
				productId: params.id,
			},
		})

		if (!barcode) {
			return NextResponse.json({ error: "Código de barras não encontrado" }, { status: 404 })
		}

		await prisma.productBarcode.delete({
			where: { id: barcodeId },
		})

		return NextResponse.json({ message: "Código de barras removido com sucesso" })
	} catch (error) {
		console.error("Erro ao remover código de barras:", error)
		return NextResponse.json({ error: "Erro ao remover código de barras" }, { status: 500 })
	}
}

// PUT - Atualizar (marcar como principal)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { barcodeId, isPrimary } = body

		if (!barcodeId) {
			return NextResponse.json({ error: "ID do código de barras é obrigatório" }, { status: 400 })
		}

		// Se está marcando como principal, primeiro remover o status de todos os outros
		if (isPrimary === true) {
			await prisma.productBarcode.updateMany({
				where: {
					productId: params.id,
					isPrimary: true,
				},
				data: {
					isPrimary: false,
				},
			})
		}

		// Atualizar o barcode
		const updatedBarcode = await prisma.productBarcode.update({
			where: { id: barcodeId },
			data: { isPrimary: isPrimary ?? false },
		})

		return NextResponse.json(updatedBarcode)
	} catch (error) {
		console.error("Erro ao atualizar código de barras:", error)
		return NextResponse.json({ error: "Erro ao atualizar código de barras" }, { status: 500 })
	}
}

