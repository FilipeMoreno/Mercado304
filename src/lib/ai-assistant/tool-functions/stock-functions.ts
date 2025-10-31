import { prisma } from "@/lib/prisma"

export const stockFunctions = {
	// Stock Management
	getStockAlerts: async () => {
		// OTIMIZAÇÃO: Agrupar queries simples em transação
		const [lowStockItems, expiringSoonItems, expiredItems] = await prisma.$transaction([
			prisma.stockItem.count({ where: { isLowStock: true } }),
			prisma.stockItem.count({
				where: {
					expirationDate: {
						lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
						gte: new Date(),
					},
				},
			}),
			prisma.stockItem.count({
				where: { expirationDate: { lt: new Date() } },
			}),
		])

		return {
			success: true,
			alerts: {
				lowStockCount: lowStockItems,
				expiringSoonCount: expiringSoonItems,
				expiredCount: expiredItems,
			},
		}
	},

	addToStock: async ({ productName, quantity, expirationDate, location }: any) => {
		try {
			let product = await prisma.product.findFirst({
				where: { name: { contains: productName, mode: "insensitive" } },
			})

			if (!product) {
				product = await prisma.product.create({
					data: { name: productName },
				})
			}

			const stockItem = await prisma.stockItem.create({
				data: {
					productId: product.id,
					quantity,
					expirationDate: expirationDate ? new Date(expirationDate) : undefined,
					location,
				},
				include: { product: true },
			})

			return {
				success: true,
				message: `Adicionados ${quantity} unidades de "${product.name}" ao estoque.`,
				stockItem,
			}
		} catch (error) {
			return {
				success: false,
				message: `Erro ao adicionar ao estoque: ${error}`,
			}
		}
	},

	removeFromStock: async ({ productName, quantity, reason }: any) => {
		try {
			const product = await prisma.product.findFirst({
				where: { name: { contains: productName, mode: "insensitive" } },
			})
			if (!product)
				return {
					success: false,
					message: `Produto "${productName}" não encontrado.`,
				}

			const stockItems = await prisma.stockItem.findMany({
				where: { productId: product.id, quantity: { gt: 0 } },
				orderBy: { expirationDate: "asc" },
			})

			let remainingToRemove = quantity
			const updates = []

			for (const item of stockItems) {
				if (remainingToRemove <= 0) break

				const removeFromItem = Math.min(item.quantity, remainingToRemove)
				updates.push(
					prisma.stockItem.update({
						where: { id: item.id },
						data: { quantity: item.quantity - removeFromItem },
					}),
				)
				remainingToRemove -= removeFromItem
			}

			// OTIMIZAÇÃO: Agrupar updates em transação
			if (updates.length > 0) {
				await prisma.$transaction(updates)
			}

			return {
				success: true,
				message: `Removidos ${quantity - remainingToRemove} unidades de "${product.name}" do estoque.`,
			}
		} catch (error) {
			return {
				success: false,
				message: `Erro ao remover do estoque: ${error}`,
			}
		}
	},

	getStockItems: async ({ lowStock, expiringSoon }: any) => {
		const where: any = {}

		if (lowStock) where.isLowStock = true
		if (expiringSoon) {
			where.expirationDate = {
				lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
				gte: new Date(),
			}
		}

		const items = await prisma.stockItem.findMany({
			where,
			include: { product: true },
			orderBy: { expirationDate: "asc" },
			take: 50,
		})

		return { success: true, items }
	},

	getWasteStats: async () => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/stock/waste-stats`)
		const data = await response.json()
		return { success: true, wasteStats: data }
	},

	getStockHistory: async ({ search, type, location, startDate, endDate, limit }: any) => {
		try {
			const params = new URLSearchParams()
			if (search) params.append("search", search)
			if (type) params.append("type", type)
			if (location) params.append("location", location)
			if (startDate) params.append("startDate", startDate)
			if (endDate) params.append("endDate", endDate)
			if (limit) params.append("limit", limit.toString())

			const response = await fetch(`${process.env.NEXTAUTH_URL}/api/stock/history?${params.toString()}`, {
				method: "GET",
			})

			if (!response.ok) {
				return { success: false, error: "Erro ao buscar histórico do estoque" }
			}

			const data = await response.json()
			return { success: true, historyData: data }
		} catch (error) {
			return { success: false, error: "Erro interno ao buscar histórico" }
		}
	},

	getWasteRecords: async ({ search, reason, startDate, endDate, limit }: any) => {
		try {
			const params = new URLSearchParams()
			if (search) params.append("search", search)
			if (reason) params.append("reason", reason)
			if (startDate) params.append("startDate", startDate)
			if (endDate) params.append("endDate", endDate)
			if (limit) params.append("limit", limit.toString())

			const response = await fetch(`${process.env.NEXTAUTH_URL}/api/waste?${params.toString()}`, { method: "GET" })

			if (!response.ok) {
				return { success: false, error: "Erro ao buscar registros de desperdício" }
			}

			const data = await response.json()
			return { success: true, wasteData: data }
		} catch (error) {
			return { success: false, error: "Erro interno ao buscar desperdícios" }
		}
	},

	createWasteRecord: async ({
		productName,
		quantity,
		unit,
		wasteReason,
		location,
		unitCost,
		totalValue,
		notes,
		category,
		brand,
	}: any) => {
		try {
			const wasteData = {
				productName,
				quantity,
				unit,
				wasteReason,
				location,
				unitCost,
				totalValue,
				notes,
				category,
				brand,
				wasteDate: new Date().toISOString(),
			}

			const response = await fetch(`${process.env.NEXTAUTH_URL}/api/waste`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(wasteData),
			})

			if (!response.ok) {
				return { success: false, error: "Erro ao registrar desperdício" }
			}

			const result = await response.json()
			return { success: true, wasteRecord: result }
		} catch (error) {
			return { success: false, error: "Erro interno ao registrar desperdício" }
		}
	},
}
