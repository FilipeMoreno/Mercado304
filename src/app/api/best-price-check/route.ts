// src/app/api/best-price-check/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
	try {
		const { productId, currentPrice } = await request.json()

		if (!productId || currentPrice === undefined) {
			return NextResponse.json({ error: "ProductId e currentPrice são obrigatórios" }, { status: 400 })
		}

		// Buscar preços históricos de compras, excluindo o preço atual
		const historicalPurchases = await prisma.purchaseItem.findMany({
			where: {
				productId: productId,
				unitPrice: {
					not: currentPrice,
				},
			},
			select: {
				unitPrice: true,
				purchase: {
					select: {
						purchaseDate: true,
					},
				},
			},
		})

		// Buscar preços históricos de registros manuais, excluindo o preço atual
		const historicalRecords = await prisma.priceRecord.findMany({
			where: {
				productId: productId,
				price: {
					not: currentPrice,
				},
			},
			select: {
				price: true,
				recordDate: true,
			},
		})

		// Combinar todos os preços históricos
		const allHistoricalPrices = [
			...historicalPurchases.map((p) => ({
				price: p.unitPrice,
				date: p.purchase.purchaseDate,
				source: "purchase",
			})),
			...historicalRecords.map((r) => ({
				price: r.price,
				date: r.recordDate,
				source: "record",
			})),
		].sort((a, b) => a.price - b.price)

		const totalPurchaseRecords = await prisma.purchaseItem.count({
			where: { productId },
		})

		const totalPriceRecords = await prisma.priceRecord.count({
			where: { productId },
		})

		const totalRecords = totalPurchaseRecords + totalPriceRecords

		// Se não há histórico, o preço atual é o primeiro registo
		if (totalRecords === 0) {
			return NextResponse.json({
				isBestPrice: true,
				isFirstRecord: true,
				previousBestPrice: null,
			})
		}

		const previousBestPrice = allHistoricalPrices[0]?.price

		// Se não há outro preço registado ou o preço atual é menor que o melhor preço anterior
		if (!previousBestPrice || currentPrice < previousBestPrice) {
			return NextResponse.json({
				isBestPrice: true,
				isFirstRecord: false,
				previousBestPrice: previousBestPrice || 0,
				totalRecords: totalRecords,
			})
		}

		return NextResponse.json({
			isBestPrice: false,
			isFirstRecord: false,
			previousBestPrice: previousBestPrice,
			totalRecords: totalRecords,
		})
	} catch (error) {
		console.error("Erro ao verificar melhor preço:", error)
		return NextResponse.json({ error: "Erro ao verificar o melhor preço histórico" }, { status: 500 })
	}
}
