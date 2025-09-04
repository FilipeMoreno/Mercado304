import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AppError } from '@/lib/errors'
import { handleApiError } from '@/lib/api-utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'name-asc'
    const page = parseInt(searchParams.get('page') || '1')
    const itemsPerPage = 12

    const [orderBy, orderDirection] = sort.split('-')

    const where = {
      name: {
        contains: searchTerm,
        mode: 'insensitive' as const
      }
    }
    
    const [markets, totalCount] = await prisma.$transaction([
      prisma.market.findMany({
        where,
        orderBy: {
          [orderBy === 'date' ? 'createdAt' : orderBy]: orderDirection as 'asc' | 'desc'
        },
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.market.count({ where })
    ])

    return NextResponse.json({
      markets,
      totalCount
    })
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

    if (!name || !name.trim()) {
      throw new AppError('MKT_001'); 
    }

    const market = await prisma.market.create({
      data: {
        name,
        location: location || null
      }
    })

    return NextResponse.json(market, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}