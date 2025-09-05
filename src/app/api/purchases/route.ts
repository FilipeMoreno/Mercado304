import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'
import API_BASE_URL from '@/lib/api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const marketId = searchParams.get('marketId')
    const searchTerm = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'date-desc'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '12')

    const where: any = {}
    if (marketId && marketId !== 'all') {
      where.marketId = marketId
    }

    if (dateFrom || dateTo) {
      where.purchaseDate = {}
      if (dateFrom) {
        // Define a data inicial como 00:00:00 do dia selecionado
        where.purchaseDate.gte = new Date(`${dateFrom}T00:00:00.000Z`)
      }
      if (dateTo) {
        // Define a data final como 00:00:00 do dia seguinte para ser estritamente menor
        const endDate = new Date(`${dateTo}T00:00:00.000Z`)
        where.purchaseDate.lt = addDays(endDate, 1)
      }
    }

    if (searchTerm) {
      where.items = {
        some: {
          OR: [
            { productName: { contains: searchTerm, mode: 'insensitive' } },
            { product: { name: { contains: searchTerm, mode: 'insensitive' } } }
          ]
        }
      }
    }

    const orderBy: any = {}
    switch (sort) {
      case 'date-asc':
        orderBy.purchaseDate = 'asc'
        break
      case 'date-desc':
        orderBy.purchaseDate = 'desc'
        break
      case 'value-asc':
        orderBy.totalAmount = 'asc'
        break
      case 'value-desc':
        orderBy.totalAmount = 'desc'
        break
      default:
        orderBy.purchaseDate = 'desc'
        break;
    }
    
    const [purchases, totalCount] = await prisma.$transaction([
      prisma.purchase.findMany({
        where,
        include: {
          market: true,
          items: {
            include: {
              product: {
                include: {
                  brand: true
                }
              }
            }
          }
        },
        orderBy,
        skip: (page - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
      prisma.purchase.count({ where })
    ])
    
    return NextResponse.json({ purchases, totalCount })
  } catch (error) {
    console.error('Erro ao buscar compras:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar compras' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { marketId, items, purchaseDate } = body

    if (!marketId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Mercado e itens são obrigatórios' },
        { status: 400 }
      )
    }

    const totalAmount = items.reduce((sum: number, item: any) => 
      sum + (item.quantity * item.unitPrice), 0
    )

    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { 
        brand: true,
        category: true
      }
    })

    const purchase = await prisma.purchase.create({
      data: {
        marketId,
        totalAmount,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
        items: {
          create: items.map((item: any) => {
            const product = products.find(p => p.id === item.productId)
            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              productName: product?.name,
              productUnit: product?.unit,
              productCategory: product?.category?.name,
              brandName: product?.brand?.name
            }
          })
        }
      },
      include: {
        market: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    try {
      const stockEntries = []
      
      for (const item of purchase.items) {
        if (item.product?.hasStock) {
          let expirationDate = null
          if (item.product.hasExpiration && item.product.defaultShelfLifeDays) {
            expirationDate = new Date()
            expirationDate.setDate(expirationDate.getDate() + item.product.defaultShelfLifeDays)
          }

          stockEntries.push({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitPrice,
            expirationDate,
            location: 'Despensa',
            notes: `Compra automática #${purchase.id}`,
            purchaseItemId: item.id
          })
        }
      }

      if (stockEntries.length > 0) {
        await fetch(`${API_BASE_URL}/stock/auto-entry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            purchaseId: purchase.id,
            items: stockEntries
          })
        })
      }
    } catch (stockError) {
      console.error('Erro na entrada automática do estoque:', stockError)
    }

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao criar compra' },
      { status: 500 }
    )
  }
}