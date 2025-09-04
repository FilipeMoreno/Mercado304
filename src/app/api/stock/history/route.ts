import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Buscar histórico de movimentações do estoque
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const stockItemId = searchParams.get('stockItemId')
    const type = searchParams.get('type') as any
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Construir filtros
    const whereConditions: any = {}

    if (stockItemId) {
      whereConditions.stockItemId = stockItemId
    } else if (productId) {
      whereConditions.stockItem = {
        productId: productId
      }
    }

    if (type) {
      whereConditions.type = type
    }

    if (startDate) {
      whereConditions.date = {
        ...whereConditions.date,
        gte: new Date(startDate)
      }
    }

    if (endDate) {
      whereConditions.date = {
        ...whereConditions.date,
        lte: new Date(endDate)
      }
    }

    // Buscar movimentações
    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where: whereConditions,
        include: {
          stockItem: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.stockMovement.count({ where: whereConditions })
    ])

    // Calcular estatísticas
    const stats = await prisma.stockMovement.aggregate({
      where: whereConditions,
      _sum: {
        quantity: true,
        wasteValue: true
      },
      _count: {
        id: true
      }
    })

    // Estatísticas por tipo
    const typeStats = await prisma.stockMovement.groupBy({
      by: ['type'],
      where: whereConditions,
      _sum: {
        quantity: true,
        wasteValue: true
      },
      _count: {
        id: true
      }
    })

    // Estatísticas de desperdício
    const wasteStats = await prisma.stockMovement.aggregate({
      where: {
        ...whereConditions,
        isWaste: true
      },
      _sum: {
        quantity: true,
        wasteValue: true
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      movements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        total: stats._count.id || 0,
        totalQuantity: stats._sum.quantity || 0,
        totalWasteValue: stats._sum.wasteValue || 0,
        byType: typeStats,
        waste: {
          count: wasteStats._count.id || 0,
          quantity: wasteStats._sum.quantity || 0,
          value: wasteStats._sum.wasteValue || 0
        }
      }
    })

  } catch (error) {
    console.error('Erro ao buscar histórico de estoque:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar histórico de estoque' },
      { status: 500 }
    )
  }
}

// POST - Registrar nova movimentação
export async function POST(request: Request) {
  try {
    const data = await request.json()
    const {
      stockItemId,
      type,
      quantity,
      reason,
      notes,
      isWaste = false,
      wasteReason,
      wasteValue
    } = data

    // Validações básicas
    if (!stockItemId || !type || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Dados obrigatórios: stockItemId, type e quantity (> 0)' },
        { status: 400 }
      )
    }

    // Verificar se o item de estoque existe
    const stockItem = await prisma.stockItem.findUnique({
      where: { id: stockItemId },
      include: { product: true }
    })

    if (!stockItem) {
      return NextResponse.json(
        { error: 'Item de estoque não encontrado' },
        { status: 404 }
      )
    }

    // Para movimentos de saída, verificar se há quantidade suficiente
    if (['SAIDA', 'VENCIMENTO', 'PERDA', 'DESPERDICIO'].includes(type)) {
      if (quantity > stockItem.quantity) {
        return NextResponse.json(
          { error: `Quantidade insuficiente em estoque. Disponível: ${stockItem.quantity}` },
          { status: 400 }
        )
      }
    }

    // Calcular nova quantidade
    let newQuantity = stockItem.quantity
    if (type === 'ENTRADA') {
      newQuantity += quantity
    } else if (['SAIDA', 'VENCIMENTO', 'PERDA', 'DESPERDICIO'].includes(type)) {
      newQuantity = Math.max(0, newQuantity - quantity)
    } else if (type === 'AJUSTE') {
      // Para ajuste, a quantity pode ser positiva ou negativa
      newQuantity = Math.max(0, quantity)
    }

    // Transação para criar movimento e atualizar estoque
    const result = await prisma.$transaction(async (tx) => {
      // Criar movimento
      const movement = await tx.stockMovement.create({
        data: {
          stockItemId,
          type,
          quantity,
          reason,
          notes,
          isWaste,
          wasteReason,
          wasteValue
        },
        include: {
          stockItem: {
            include: {
              product: {
                include: {
                  brand: true,
                  category: true
                }
              }
            }
          }
        }
      })

      // Atualizar quantidade no estoque
      const updatedStockItem = await tx.stockItem.update({
        where: { id: stockItemId },
        data: {
          quantity: newQuantity,
          isLowStock: stockItem.product.hasStock && stockItem.product.minStock ? 
            newQuantity <= stockItem.product.minStock : false,
          // Marcar como vencido se for movimento de vencimento
          isExpired: type === 'VENCIMENTO' ? true : stockItem.isExpired
        }
      })

      return { movement, updatedStockItem }
    })

    return NextResponse.json(result.movement, { status: 201 })

  } catch (error) {
    console.error('Erro ao registrar movimentação:', error)
    return NextResponse.json(
      { error: 'Erro ao registrar movimentação' },
      { status: 500 }
    )
  }
}