import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(brands)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar marcas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da marca é obrigatório' },
        { status: 400 }
      )
    }

    const brand = await prisma.brand.create({
      data: { name: name.trim() }
    })

    return NextResponse.json(brand, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Marca já existe' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erro ao criar marca' },
      { status: 500 }
    )
  }
}