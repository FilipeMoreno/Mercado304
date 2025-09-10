import type { Purchase } from "@/types";

interface PurchasesResponse {
	purchases: Purchase[];
	totalCount: number;
}

export const getPurchases = async (
	searchParams?: URLSearchParams,
): Promise<PurchasesResponse> => {
	const response = await fetch(
		`/api/purchases?${searchParams?.toString() || ""}`,
		{ cache: "no-store" },
	);
	if (!response.ok) {
		throw new Error("Erro ao buscar compras");
	}
	return response.json();
};
