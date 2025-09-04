import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const brand = await prisma.brand.findUnique({
      where: { id: params.id }
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Marca não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(brand)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar marca' },
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
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: { name: name.trim() }
    })

    return NextResponse.json(brand)
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Marca já existe' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar marca' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.brand.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Marca excluída com sucesso' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao excluir marca' },
      { status: 500 }
    )
  }
}