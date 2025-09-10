import type { Market } from "@/types";

interface MarketsResponse {
	markets: Market[];
	totalCount: number;
}

export const getMarkets = async (
	searchParams?: URLSearchParams,
): Promise<MarketsResponse> => {
	const response = await fetch(
		`/api/markets?${searchParams?.toString() || ""}`,
		{ cache: "no-store" },
	);
	if (!response.ok) {
		throw new Error("Erro ao buscar mercados");
	}
	return response.json();
};
