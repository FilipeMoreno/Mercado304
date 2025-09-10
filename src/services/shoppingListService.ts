import type { ShoppingList } from "@/types";

interface ShoppingListsResponse {
	lists: ShoppingList[];
	totalCount: number;
}

export const getShoppingLists = async (
	searchParams?: URLSearchParams,
): Promise<ShoppingListsResponse> => {
	const response = await fetch(
		`/api/shopping-lists?${searchParams?.toString() || ""}`,
		{ cache: "no-store" },
	);
	if (!response.ok) {
		throw new Error("Erro ao buscar listas de compras");
	}
	return response.json();
};

export const createShoppingList = async (data: {
	name: string;
	isActive?: boolean;
}): Promise<ShoppingList> => {
	const response = await fetch("/api/shopping-lists", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Erro ao criar lista de compras");
	}
	return response.json();
};
