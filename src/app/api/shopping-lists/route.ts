// src/app/api/shopping-lists/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'date-desc'
    const page = parseInt(searchParams.get('page') || '1')
    const itemsPerPage = 12
    const status = searchParams.get('status') || 'all'

    const [orderBy, orderDirection] = sort.split('-')

    const where: any = {
      name: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }
    
    if (status !== 'all') {
      where.isActive = status === 'active'
    }

    const [lists, totalCount] = await prisma.$transaction([
      prisma.shoppingList.findMany({
        where,
        include: {
          items: {
            include: {
              product: true
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { [orderBy === 'date' ? 'createdAt' : orderBy]: orderDirection as 'asc' | 'desc' },
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.shoppingList.count({ where })
    ])

    return NextResponse.json({ lists, totalCount })
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