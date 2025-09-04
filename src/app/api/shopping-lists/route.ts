import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const lists = await prisma.shoppingList.findMany({
      include: {
        items: {
          include: {
            product: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(lists)
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar listas' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, items } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da lista é obrigatório' },
        { status: 400 }
      )
    }

    const list = await prisma.shoppingList.create({
      data: {
        name,
        items: {
          create: items?.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            estimatedPrice: item.estimatedPrice || null
          })) || []
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json(list, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar lista' },
      { status: 500 }
    )
  }
}