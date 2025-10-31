import { NextResponse } from "next/server"
import { handleApiError } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const productName = searchParams.get("product")
		const marketName = searchParams.get("market")
		const includePurchases = searchParams.get("includePurchases") === "true"
		const period = searchParams.get("period") || "all" // all, hour, day, week, month, custom
		const startDate = searchParams.get("startDate")
		const endDate = searchParams.get("endDate")

		// Calcular filtro de data baseado no período
		let dateFilter: { gte?: Date; lte?: Date } = {}

		if (period !== "all") {
			const now = new Date()

			switch (period) {
				case "hour":
					dateFilter.gte = new Date(now.getTime() - 60 * 60 * 1000)
					break
				case "day":
					dateFilter.gte = new Date(now.getTime() - 24 * 60 * 60 * 1000)
					break
				case "week":
					dateFilter.gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
					break
				case "month":
					dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
					break
				case "custom":
					if (startDate) dateFilter.gte = new Date(startDate)
					if (endDate) dateFilter.lte = new Date(endDate)
					break
			}
		}

		// Construir filtros para registros manuais
		const priceRecordWhere: {
			product?: { name: { contains: string; mode: "insensitive" } }
			market?: { name: { contains: string; mode: "insensitive" } }
			recordDate?: { gte?: Date; lte?: Date }
		} = {}

		if (productName) {
			priceRecordWhere.product = {
				name: { contains: productName, mode: "insensitive" },
			}
		}

		if (marketName) {
			priceRecordWhere.market = {
				name: { contains: marketName, mode: "insensitive" },
			}
		}

		if (Object.keys(dateFilter).length > 0) {
			priceRecordWhere.recordDate = dateFilter
		}

		// OTIMIZADO: Agrupar queries em transação quando includePurchases é true
		let allPriceData: Array<{
			id: string
			product: string
			market: string
			price: number
			recordDate: Date
			notes: string | null
			source: "manual" | "purchase"
		}>

		if (includePurchases) {
			const purchaseWhere: {
				product?: { name: { contains: string; mode: "insensitive" } }
				purchase?: {
					market?: { name: { contains: string; mode: "insensitive" } }
					purchaseDate?: { gte?: Date; lte?: Date }
				}
			} = {}

			if (productName) {
				purchaseWhere.product = {
					name: { contains: productName, mode: "insensitive" },
				}
			}

			if (marketName) {
				purchaseWhere.purchase = {
					market: {
						name: { contains: marketName, mode: "insensitive" },
					},
				}
			}

			if (Object.keys(dateFilter).length > 0) {
				purchaseWhere.purchase = {
					...purchaseWhere.purchase,
					purchaseDate: dateFilter,
				}
			}

			const [priceRecords, purchaseItems] = await prisma.$transaction([
				prisma.priceRecord.findMany({
					where: priceRecordWhere,
					include: {
						product: true,
						market: true,
					},
					orderBy: { recordDate: "desc" },
				}),
				prisma.purchaseItem.findMany({
					where: purchaseWhere,
					include: {
						product: true,
						purchase: {
							include: {
								market: true,
							},
						},
					},
					orderBy: { purchase: { purchaseDate: "desc" } },
				}),
			])

			const priceData = priceRecords.map((record) => ({
				id: record.id,
				product: record.product.name,
				market: record.market.name,
				price: record.price,
				recordDate: record.recordDate,
				notes: record.notes,
				source: "manual" as const,
			}))

			const purchaseData = purchaseItems.map((item) => ({
				id: item.id,
				product: item.product?.name || "Produto não informado",
				market: item.purchase.market?.name || "Mercado não informado",
				price: item.unitPrice,
				recordDate: item.purchase.purchaseDate,
				notes: `Compra - ${(item.purchase as any).notes || ""}`.trim(),
				source: "purchase" as const,
			}))

			allPriceData = [...priceData, ...purchaseData]
		} else {
			// Se não incluir compras, buscar apenas registros manuais
			const priceRecords = await prisma.priceRecord.findMany({
				where: priceRecordWhere,
				include: {
					product: true,
					market: true,
				},
				orderBy: { recordDate: "desc" },
			})

			allPriceData = priceRecords.map((record) => ({
				id: record.id,
				product: record.product.name,
				market: record.market.name,
				price: record.price,
				recordDate: record.recordDate,
				notes: record.notes,
				source: "manual" as const,
			}))
		}

		// Ordenar por data (mais recente primeiro)
		allPriceData.sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())

		// Estatísticas gerais
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
		}

		return NextResponse.json({
			success: true,
			data: allPriceData,
			stats,
			filters: {
				product: productName,
				market: marketName,
				includePurchases,
				period,
				startDate,
				endDate,
			},
		})
	} catch (error) {
		console.error("Erro ao buscar dados para análise:", error)
		return handleApiError(error)
	}
}