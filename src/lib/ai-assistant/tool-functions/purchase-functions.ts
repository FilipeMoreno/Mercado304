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

			// OTIMIZADO: Buscar/criar todos os produtos primeiro em uma única transação
			const productNames = items.map((item: any) => item.productName)
			const existingProducts = await prisma.product.findMany({
				where: {
					name: { in: productNames, mode: "insensitive" },
				},
			})

			const productsMap = new Map(existingProducts.map((p) => [p.name.toLowerCase(), p]))
			const productsToCreate = items.filter(
				(item: any) => !productsMap.has(item.productName.toLowerCase()),
			)

			const createdProducts = productsToCreate.length > 0
				? await prisma.product.createMany({
						data: productsToCreate.map((item: any) => ({ name: item.productName })),
						skipDuplicates: true,
					})
				: { count: 0 }

			// Buscar os produtos recém-criados se necessário
			if (createdProducts.count > 0) {
				const newlyCreated = await prisma.product.findMany({
					where: {
						name: { in: productsToCreate.map((i: any) => i.productName), mode: "insensitive" },
					},
				})
				newlyCreated.forEach((p) => productsMap.set(p.name.toLowerCase(), p))
			}

			// Preparar itens da compra
			const purchaseItems = items.map((item: any) => {
				const product = productsMap.get(item.productName.toLowerCase())
				return {
					productId: product?.id || null,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					totalPrice: item.quantity * item.unitPrice,
					productName: item.productName,
				}
			})

			const purchase = await prisma.purchase.create({
				data: {
					marketId: market.id,
					purchaseDate: new Date(),
					totalAmount,
					items: {
						create: purchaseItems,
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
