import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import API_BASE_URL from "@/lib/api";
import { MercadosClient } from "./mercados-client";

interface MercadosPageProps {
	searchParams: {
		search?: string;
		sort?: string;
		page?: string;
	};
}

async function fetchMarkets(searchParams: MercadosPageProps["searchParams"]) {
	const params = new URLSearchParams();
	if (searchParams.search) params.set("search", searchParams.search);
	if (searchParams.sort) params.set("sort", searchParams.sort);
	if (searchParams.page) params.set("page", searchParams.page);
	params.set("itemsPerPage", "12"); // Quantidade fixa por página

	const response = await fetch(`${API_BASE_URL}/markets?${params.toString()}`, {
		cache: "no-store",
	});
	const data = await response.json();
	return data;
}

export default async function MercadosPage({
	searchParams,
}: MercadosPageProps) {
	const { markets, totalCount } = await fetchMarkets(searchParams);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Mercados</h1>
					<p className="text-gray-600 mt-2">
						Gerencie os mercados onde você faz suas compras
					</p>
				</div>
				<Link href="/mercados/novo">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Novo Mercado
					</Button>
				</Link>
			</div>

			<MercadosClient
				initialMarkets={markets}
				initialTotalCount={totalCount}
				searchParams={searchParams}
			/>
		</div>
	);
}
