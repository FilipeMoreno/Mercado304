import API_BASE_URL from "@/lib/api";
import { EstoqueClient } from "./estoque-client";

interface EstoquePageProps {
	searchParams: {
		location?: string;
		search?: string;
	};
}

async function fetchStockData(searchParams: EstoquePageProps["searchParams"]) {
	const url = `${API_BASE_URL}/stock?location=${searchParams.location || "all"}&search=${searchParams.search || ""}`;
	const response = await fetch(url, { cache: "no-store" });
	const data = await response.json();
	return data;
}

async function fetchProducts() {
	const response = await fetch(`${API_BASE_URL}/products`, {
		cache: "no-store",
	});
	const products = await response.json();
	return products;
}

export default async function EstoquePage({ searchParams }: EstoquePageProps) {
	const [stockData, productsData] = await Promise.all([
		fetchStockData(searchParams),
		fetchProducts(),
	]);

	return (
		<EstoqueClient
			initialStockItems={stockData.items || []}
			initialStats={stockData.stats || {}}
			initialProducts={productsData || []}
			searchParams={searchParams}
		/>
	);
}
