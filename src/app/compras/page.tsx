import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import API_BASE_URL from "@/lib/api";
import { PurchasesClient } from "./purchases-client";

interface ComprasPageProps {
	searchParams: {
		search?: string;
		market?: string;
		sort?: string;
		period?: string;
		dateFrom?: string;
		dateTo?: string;
		page?: string;
	};
}

async function fetchPurchasesData(
	searchParams: ComprasPageProps["searchParams"],
) {
	const params = new URLSearchParams();
	if (searchParams.search) params.set("search", searchParams.search);
	if (searchParams.market && searchParams.market !== "all")
		params.set("marketId", searchParams.market);
	if (searchParams.sort) params.set("sort", searchParams.sort);
	if (searchParams.dateFrom) params.set("dateFrom", searchParams.dateFrom);
	if (searchParams.dateTo) params.set("dateTo", searchParams.dateTo);
	if (searchParams.page) params.set("page", searchParams.page);
	params.set("itemsPerPage", "12");

	const [purchasesRes, marketsRes] = await Promise.all([
		fetch(`${API_BASE_URL}/purchases?${params.toString()}`, {
			cache: "no-store",
		}),
		fetch(`${API_BASE_URL}/markets`, { cache: "no-store" }),
	]);

	let purchases = [];
	let totalCount = 0;
	if (purchasesRes.ok) {
		const data = await purchasesRes.json();
		purchases = data.purchases || [];
		totalCount = data.totalCount || 0;
	} else {
		console.error(
			`Erro ao buscar compras: ${purchasesRes.status} ${purchasesRes.statusText}`,
		);
	}

	let markets = [];
	if (marketsRes.ok) {
		const data = await marketsRes.json();
		markets = data.markets || [];
	} else {
		console.error(
			`Erro ao buscar mercados: ${marketsRes.status} ${marketsRes.statusText}`,
		);
	}

	return { purchases, totalCount, markets };
}

export default async function ComprasPage({ searchParams }: ComprasPageProps) {
	const { purchases, totalCount, markets } =
		await fetchPurchasesData(searchParams);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Compras</h1>
					<p className="text-gray-600 mt-2">
						Registre e acompanhe suas compras
					</p>
				</div>
				<Link href="/compras/nova">
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Nova Compra
					</Button>
				</Link>
			</div>

			<PurchasesClient
				initialPurchases={purchases}
				initialMarkets={markets}
				initialTotalCount={totalCount}
				searchParams={searchParams}
			/>
		</div>
	);
}
