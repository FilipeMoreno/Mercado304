import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar categorias' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, icon, color } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        icon,
        color
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Categoria já existe' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar categoria' },
      { status: 500 }
    )
  }
}