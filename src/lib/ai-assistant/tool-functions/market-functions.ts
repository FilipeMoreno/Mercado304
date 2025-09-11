import { prisma } from "@/lib/prisma";

export const marketFunctions = {
	// Markets Management
	createMarket: async ({ name, address, phone }: any) => {
		try {
			const market = await prisma.market.create({
				data: { name, location: address },
			});
			return {
				success: true,
				message: `Mercado "${name}" criado com sucesso.`,
				market,
			};
		} catch (error) {
			return { success: false, message: `Erro ao criar mercado: ${error}` };
		}
	},

	getMarkets: async () => {
		const markets = await prisma.market.findMany({
			orderBy: { name: "asc" },
		});
		return { success: true, markets };
	},

	getMarketStats: async ({ marketName }: { marketName: string }) => {
		const market = await prisma.market.findFirst({
			where: { name: { contains: marketName, mode: "insensitive" } },
		});
		if (!market)
			return {
				success: false,
				message: `Mercado "${marketName}" não encontrado.`,
			};

		const response = await fetch(
			`${process.env.NEXTAUTH_URL}/api/markets/${market.id}/stats`,
		);
		const stats = await response.json();
		return { success: true, market: market.name, stats };
	},
};