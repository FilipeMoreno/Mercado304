import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar produto' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, categoryId, brandId, unit, barcode } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        categoryId: categoryId || null,
        brandId: brandId || null,
        unit: unit || 'unidade',
        barcode: barcode || null
      },
      include: {
        brand: true,
        category: true
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao atualizar produto' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Produto excluído com sucesso' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir produto' },
      { status: 500 }
    )
  }
}