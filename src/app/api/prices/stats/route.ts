import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    // Buscar estatísticas de registros manuais
    const manualRecords = await prisma.priceRecord.findMany({
      include: {
        product: true,
        market: true,
      },
    })

    // Buscar estatísticas de compras
    const purchaseItems = await prisma.purchaseItem.findMany({
      include: {
        product: true,
        purchase: {
          include: {
            market: true,
          },
        },
      },
    })

    // Combinar todos os dados
    const allPriceData = [
      ...manualRecords.map((record) => ({
        id: record.id,
        product: record.product.name,
        market: record.market.name,
        price: record.price,
        recordDate: record.recordDate,
        source: "manual" as const,
      })),
      ...purchaseItems.map((item) => ({
        id: item.id,
        product: item.product?.name || "Produto não informado",
        market: item.purchase.market?.name || "Mercado não informado",
        price: item.unitPrice,
        recordDate: item.purchase.purchaseDate,
        source: "purchase" as const,
      })),
    ]

    // Calcular estatísticas
    const stats = {
      totalRecords: allPriceData.length,
      uniqueProducts: new Set(allPriceData.map((r) => r.product)).size,
      uniqueMarkets: new Set(allPriceData.map((r) => r.market)).size,
      avgPrice: allPriceData.length > 0
        ? allPriceData.reduce((sum, r) => sum + r.price, 0) / allPriceData.length
        : 0,
      priceRange: allPriceData.length > 0
        ? {
          min: Math.min(...allPriceData.map((r) => r.price)),
          max: Math.max(...allPriceData.map((r) => r.price)),
        }
        : { min: 0, max: 0 },
      manualRecords: manualRecords.length,
      purchaseRecords: purchaseItems.length,
    }

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return handleApiError(error)
  }
}
