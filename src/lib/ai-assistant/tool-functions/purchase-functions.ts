import { prisma } from "@/lib/prisma"

export const purchaseFunctions = {
	// Purchases Management
	createPurchase: async ({ marketName, items }: any) => {
		try {
			const market = await prisma.market.findFirst({
				where: { name: { contains: marketName, mode: "insensitive" } },
			})
			if (!market)
				return {
					success: false,
					message: `Mercado "${marketName}" não encontrado.`,
				}

			const totalAmount = items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0)

			const purchase = await prisma.purchase.create({
				data: {
					marketId: market.id,
					purchaseDate: new Date(),
					totalAmount,
					items: {
						create: await Promise.all(
							items.map(async (item: any) => {
								let product = await prisma.product.findFirst({
									where: {
										name: { contains: item.productName, mode: "insensitive" },
									},
								})

								if (!product) {
									product = await prisma.product.create({
										data: { name: item.productName },
									})
								}

								return {
									productId: product.id,
									quantity: item.quantity,
									unitPrice: item.unitPrice,
									totalPrice: item.quantity * item.unitPrice,
								}
							}),
						),
					},
				},
				include: { items: { include: { product: true } } },
			})

			return {
				success: true,
				message: `Compra registrada no ${marketName} com ${items.length} itens.`,
				purchase,
			}
		} catch (error) {
			return { success: false, message: `Erro ao registrar compra: ${error}` }
		}
	},

	getPurchases: async ({ marketName, limit = 10 }: any) => {
		const purchases = await prisma.purchase.findMany({
			where: marketName
				? {
						market: { name: { contains: marketName, mode: "insensitive" } },
					}
				: undefined,
			include: {
				market: true,
				items: { include: { product: true } },
				_count: { select: { items: true } },
			},
			orderBy: { purchaseDate: "desc" },
			take: limit,
		})
		return { success: true, purchases }
	},
}
