// src/app/api/stock/route.ts

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')
    const searchTerm = searchParams.get('search') || ''
    
    const where: any = {
      isExpired: false,
      quantity: { gt: 0 }
    }
    
    if (location && location !== 'all') {
      where.location = location
    }

    if (searchTerm) {
      where.product = {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { brand: { name: { contains: searchTerm, mode: 'insensitive' } } }
        ]
      }
    }
    
    const stockItems = await prisma.stockItem.findMany({
      where,
      include: {
        product: {
          include: {
            brand: true,
            category: true
          }
        },
        movements: {
          orderBy: { date: 'desc' },
          take: 5
        }
      },
      orderBy: [
        { isLowStock: 'desc' },
        { expirationDate: 'asc' }
      ]
    })

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000))

    const itemsWithAlerts = stockItems.map(item => {
      let expirationStatus = 'ok'
      let expirationWarning = null

      if (item.expirationDate) {
        if (item.expirationDate <= now) {
          expirationStatus = 'expired'
          expirationWarning = 'Produto vencido!'
        } else if (item.expirationDate <= threeDaysFromNow) {
          expirationStatus = 'expiring_soon'
          const daysLeft = Math.ceil((item.expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          expirationWarning = `Vence em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}`
        }
      }

      let stockStatus = 'ok'
      let stockWarning = null

      if (item.product.hasStock && item.product.minStock && item.quantity <= item.product.minStock) {
        stockStatus = 'low'
        stockWarning = `Estoque baixo (mín: ${item.product.minStock} ${item.product.unit})`
      }

      return {
        ...item,
        expirationStatus,
        expirationWarning,
        stockStatus,
        stockWarning,
        totalValue: item.unitCost ? item.quantity * item.unitCost : null
      }
    })

    const stats = {
      totalItems: stockItems.length,
      totalValue: stockItems.reduce((sum, item) => 
        sum + (item.unitCost ? item.quantity * item.unitCost : 0), 0
      ),
      expiredItems: itemsWithAlerts.filter(item => item.expirationStatus === 'expired').length,
      expiringSoon: itemsWithAlerts.filter(item => item.expirationStatus === 'expiring_soon').length,
      lowStockItems: itemsWithAlerts.filter(item => item.stockStatus === 'low').length,
      locations: Array.from(new Set(stockItems.map(item => item.location).filter(Boolean)))
    }

    return NextResponse.json({
      items: itemsWithAlerts,
      stats
    })

  } catch (error) {
    console.error('Erro ao buscar estoque:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estoque' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const {
      productId,
      quantity,
      expirationDate,
      batchNumber,
      location = 'Despensa',
      unitCost,
      notes
    } = data

    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Produto e quantidade são obrigatórios' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      )
    }

    const stockItem = await prisma.stockItem.create({
      data: {
        productId,
        quantity,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        batchNumber,
        location,
        unitCost,
        notes,
        isLowStock: product.hasStock && product.minStock ? quantity <= product.minStock : false
      },
      include: {
        product: {
          include: {
            brand: true,
            category: true
          }
        }
      }
    })

    await prisma.stockMovement.create({
      data: {
        stockItemId: stockItem.id,
        type: 'ENTRADA',
        quantity,
        reason: 'Adição manual ao estoque',
        notes
      }
    })

    return NextResponse.json(stockItem)

  } catch (error) {
    console.error('Erro ao adicionar ao estoque:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar ao estoque' },
      { status: 500 }
    )
  }
}