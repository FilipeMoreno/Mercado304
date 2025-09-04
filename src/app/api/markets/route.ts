// src/app/api/markets/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'name-asc'

    const [orderBy, orderDirection] = sort.split('-')

    const markets = await prisma.market.findMany({
      where: {
        name: {
          contains: searchTerm,
          mode: 'insensitive'
        }
      },
      orderBy: {
        [orderBy]: orderDirection as 'asc' | 'desc'
      }
    })
    return NextResponse.json(markets)
  } catch (error) {
    console.error('Erro ao buscar mercados:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar mercados' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, location } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const market = await prisma.market.create({
      data: {
        name,
        location: location || null
      }
    })

    return NextResponse.json(market, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar mercado' },
      { status: 500 }
    )
  }
}