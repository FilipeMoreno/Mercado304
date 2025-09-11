import { prisma } from "@/lib/prisma";

export const dashboardFunctions = {
	// Dashboard & Analytics
	getDashboardStats: async () => {
		const [totalSpent, totalPurchases, totalProducts, totalStockItems] =
			await Promise.all([
				prisma.purchase.aggregate({ _sum: { totalAmount: true } }),
				prisma.purchase.count(),
				prisma.product.count(),
				prisma.stockItem.count(),
			]);

		return {
			success: true,
			data: {
				totalSpent: totalSpent._sum.totalAmount || 0,
				totalPurchases,
				totalProducts,
				totalStockItems,
			},
		};
	},

	getSavingsAnalysis: async () => {
		const response = await fetch(`${process.env.NEXTAUTH_URL}/api/savings`);
		const data = await response.json();
		return { success: true, data };
	},
};