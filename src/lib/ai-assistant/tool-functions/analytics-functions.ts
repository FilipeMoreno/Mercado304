import { prisma } from "@/lib/prisma"

export const analyticsFunctions = {
	// Analytics & Predictions
	getConsumptionPatterns: async () => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/predictions/consumption-patterns`)
		const data = await response.json()
		return { success: true, patterns: data }
	},

	getPriceHistory: async ({ productName, days = 30 }: any) => {
		const product = await prisma.product.findFirst({
			where: { name: { contains: productName, mode: "insensitive" } },
		})
		if (!product)
			return {
				success: false,
				message: `Produto "${productName}" não encontrado.`,
			}

		const startDate = new Date()
		startDate.setDate(startDate.getDate() - days)

		const history = await prisma.purchaseItem.findMany({
			where: {
				productId: product.id,
				purchase: { purchaseDate: { gte: startDate } },
			},
			include: { purchase: { include: { market: true } } },
			orderBy: { purchase: { purchaseDate: "desc" } },
		})

		return { success: true, product: product.name, history }
	},

	checkBestPrice: async ({ productName }: { productName: string }) => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/best-price-check`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ productName }),
		})
		const data = await response.json()
		return { success: true, bestPrice: data }
	},
}
