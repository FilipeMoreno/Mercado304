import type { Product } from "@/types";

interface ProductsResponse {
	products: Product[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalCount: number;
		hasMore: boolean;
	};
}

export const getProducts = async (
	searchParams?: URLSearchParams,
): Promise<ProductsResponse> => {
	const response = await fetch(
		`/api/products?${searchParams?.toString() || ""}`,
		{ cache: "no-store" },
	);
	if (!response.ok) {
		throw new Error("Erro ao buscar produtos");
	}
	return response.json();
};
