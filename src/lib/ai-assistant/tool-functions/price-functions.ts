export const priceFunctions = {
	// Price Recording System
	recordPrice: async ({ productName, marketName, price, notes }: any) => {
		try {
			const response = await fetch(
				`${process.env.NEXTAUTH_URL}/api/prices/record`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ productName, marketName, price, notes }),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				return {
					success: false,
					message: errorData.error || "Erro ao registrar preço",
				};
			}

			const data = await response.json();
			return {
				success: true,
				message: data.message,
				priceRecord: data.priceRecord,
			};
		} catch (error) {
			return { success: false, message: `Erro ao registrar preço: ${error}` };
		}
	},

	getPriceRecords: async ({ productName, marketName, limit = 20 }: any) => {
		try {
			const params = new URLSearchParams();
			if (productName) params.append("product", productName);
			if (marketName) params.append("market", marketName);
			if (limit) params.append("limit", limit.toString());

			const response = await fetch(
				`${process.env.NEXTAUTH_URL}/api/prices/record?${params.toString()}`,
			);

			if (!response.ok) {
				return {
					success: false,
					message: "Erro ao buscar registros de preços",
				};
			}

			const data = await response.json();
			return {
				success: true,
				priceRecords: data.priceRecords,
				total: data.total,
			};
		} catch (error) {
			return { success: false, message: `Erro ao buscar registros: ${error}` };
		}
	},
};