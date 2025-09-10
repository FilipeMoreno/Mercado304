import type { Brand } from "@/types";

interface BrandsResponse {
	brands: Brand[];
	totalCount: number;
}

export const getBrands = async (
	searchParams?: URLSearchParams,
): Promise<BrandsResponse> => {
	const response = await fetch(
		`/api/brands?${searchParams?.toString() || ""}`,
		{ cache: "no-store" },
	);
	if (!response.ok) {
		throw new Error("Erro ao buscar marcas");
	}
	return response.json();
};

export const createBrand = async (name: string): Promise<Brand> => {
	const response = await fetch("/api/brands", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ name }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Erro ao criar marca");
	}
	return response.json();
};
