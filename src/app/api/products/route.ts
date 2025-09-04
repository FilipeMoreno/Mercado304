import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: { 
        brand: true,
        category: true
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(products)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, barcode, categoryId, brandId, unit } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name,
        barcode: barcode || null,
        categoryId: categoryId || null,
        brandId: brandId || null,
        unit: unit || 'unidade'
      },
      include: { 
        brand: true,
        category: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar produto' },
      { status: 500 }
    )
  }
}